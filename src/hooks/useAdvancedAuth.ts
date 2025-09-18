import { useInactivityLogout } from './useInactivityLogout';
import { useSessionManager } from './useSessionManager';

interface UseAdvancedAuthProps {
  // Paramètres d'inactivité
  inactivityMinutes?: number;
  
  // Paramètres de session maximale
  maxSessionHours?: number;
  
  // Paramètres de vérification
  checkIntervalMinutes?: number;
  
  // Mode de sécurité prédéfini
  securityMode?: 'relaxed' | 'standard' | 'strict' | 'enterprise';
}

// Configurations prédéfinies selon le niveau de sécurité
const SECURITY_PRESETS = {
  relaxed: {
    inactivityMinutes: 60, // 1h - déconnexion directe
    maxSessionHours: 12,
    checkIntervalMinutes: 10,
  },
  standard: {
    inactivityMinutes: 30, // 30 min - déconnexion directe
    maxSessionHours: 8,
    checkIntervalMinutes: 5,
  },
  strict: {
    inactivityMinutes: 15, // 15 min - déconnexion directe
    maxSessionHours: 4,
    checkIntervalMinutes: 2,
  },
  enterprise: {
    inactivityMinutes: 10, // 10 min - déconnexion directe
    maxSessionHours: 2,
    checkIntervalMinutes: 1,
  },
};

export const useAdvancedAuth = ({
  securityMode = 'standard',
  inactivityMinutes,
  maxSessionHours,
  checkIntervalMinutes,
}: UseAdvancedAuthProps = {}) => {
  
  // Appliquer les presets ou les valeurs personnalisées
  const preset = SECURITY_PRESETS[securityMode];
  const config = {
    inactivityMinutes: inactivityMinutes ?? preset.inactivityMinutes,
    maxSessionHours: maxSessionHours ?? preset.maxSessionHours,
    checkIntervalMinutes: checkIntervalMinutes ?? preset.checkIntervalMinutes,
  };

  console.log(`🔐 Sécurité auth activée - Mode: ${securityMode} (déconnexion directe)`, config);

  // Hook d'inactivité - déconnexion automatique directe
  const inactivityControls = useInactivityLogout({
    timeoutMinutes: config.inactivityMinutes,
    checkInterval: config.checkIntervalMinutes * 60 * 1000,
  });

  // Hook de gestion de session
  const sessionControls = useSessionManager({
    maxSessionHours: config.maxSessionHours,
    refreshIntervalMinutes: config.checkIntervalMinutes,
    forceLogoutOnExpiry: true,
  });

  // API combinée
  return {
    // Informations sur la session
    getSessionInfo: sessionControls.getSessionInfo,
    getInactiveMinutes: inactivityControls.getInactiveMinutes,
    
    // Contrôles manuels
    resetSession: sessionControls.resetSession,
    updateActivity: inactivityControls.updateLastActivity,
    checkSession: sessionControls.checkSessionValidity,
    
    // Configuration actuelle
    config,
    securityMode,
    
    // Méthode utilitaire pour afficher le statut
    getSecurityStatus: () => {
      const sessionInfo = sessionControls.getSessionInfo();
      const inactiveMinutes = inactivityControls.getInactiveMinutes();
      
      return {
        sessionDuration: `${sessionInfo.sessionDurationHours}h`,
        remainingSession: `${sessionInfo.remainingHours}h`,
        inactiveTime: `${inactiveMinutes.toFixed(1)} min`,
        sessionExpired: sessionInfo.isExpired,
        inactivityThreshold: `${config.inactivityMinutes} min (déconnexion directe)`,
        securityLevel: securityMode,
        autoLogoutMode: 'direct', // Pas d'avertissement
      };
    }
  };
};