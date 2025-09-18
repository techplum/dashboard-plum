import { useEffect, useRef } from 'react';
import { supabaseClient } from '../utility/supabaseClient';

interface UseSessionManagerProps {
  maxSessionHours?: number; // Durée maximale de session (défaut: 8h)
  refreshIntervalMinutes?: number; // Intervalle de vérification (défaut: 5 min)
  forceLogoutOnExpiry?: boolean; // Logout forcé à l'expiration (défaut: true)
}

export const useSessionManager = ({
  maxSessionHours = 8,
  refreshIntervalMinutes = 5,
  forceLogoutOnExpiry = true,
}: UseSessionManagerProps = {}) => {
  // Fonction de logout directe via Supabase
  const performLogout = async () => {
    try {
      console.log('🔓 Déconnexion de session en cours...');
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('Erreur lors de la déconnexion:', error);
      } else {
        console.log('✅ Déconnexion de session réussie');
        // Rediriger vers la page de login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Erreur inattendue lors de la déconnexion de session:', error);
      // En cas d'erreur, forcer la redirection
      window.location.href = '/login';
    }
  };
  const sessionStartRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  // Récupérer ou initialiser le timestamp de début de session
  const getSessionStart = (): number => {
    const stored = localStorage.getItem('session_start_time');
    if (stored) {
      return parseInt(stored);
    }
    
    // Première connexion
    const now = Date.now();
    sessionStartRef.current = now;
    localStorage.setItem('session_start_time', now.toString());
    return now;
  };

  // Vérifier la validité de la session
  const checkSessionValidity = async () => {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      if (error || !session) {
        console.log('🔐 Session invalide détectée');
        return false;
      }

      const sessionStart = getSessionStart();
      const sessionDurationHours = (Date.now() - sessionStart) / (1000 * 60 * 60);
      
      console.log(`⏱️ Durée de session actuelle: ${sessionDurationHours.toFixed(1)}h`);

      // Vérifier si la session a dépassé la limite
      if (sessionDurationHours >= maxSessionHours) {
        console.log(`🚫 Session expirée après ${sessionDurationHours.toFixed(1)}h`);
        
        if (forceLogoutOnExpiry) {
          // Nettoyer les données de session
          localStorage.removeItem('session_start_time');
          localStorage.removeItem('last_activity');
          
          // Notification utilisateur
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Session expirée', {
              body: `Votre session a expiré après ${maxSessionHours}h pour votre sécurité`,
              icon: '/favicon.ico'
            });
          }

          performLogout();
          return false;
        }
      }

      // Vérifier l'expiration du token lui-même
      const tokenExp = session.expires_at ? session.expires_at * 1000 : 0;
      const timeUntilExpiry = tokenExp - Date.now();
      
      if (timeUntilExpiry < 5 * 60 * 1000) { // Moins de 5 min
        console.log('🔄 Token proche de l\'expiration, tentative de refresh...');
        
        const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ Échec du refresh du token:', refreshError);
          performLogout();
          return false;
        }
        
        console.log('✅ Token refreshé avec succès');
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification de session:', error);
      return false;
    }
  };

  // Obtenir les infos de session actuelles
  const getSessionInfo = () => {
    const sessionStart = getSessionStart();
    const sessionDurationHours = (Date.now() - sessionStart) / (1000 * 60 * 60);
    const remainingHours = Math.max(0, maxSessionHours - sessionDurationHours);
    
    return {
      sessionDurationHours: parseFloat(sessionDurationHours.toFixed(1)),
      remainingHours: parseFloat(remainingHours.toFixed(1)),
      isExpired: sessionDurationHours >= maxSessionHours,
    };
  };

  // Réinitialiser la session (nouveau login)
  const resetSession = () => {
    const now = Date.now();
    sessionStartRef.current = now;
    localStorage.setItem('session_start_time', now.toString());
    console.log('🔄 Session réinitialisée');
  };

  useEffect(() => {
    // Initialiser la session
    getSessionStart();
    
    // Vérification périodique
    checkIntervalRef.current = setInterval(
      checkSessionValidity, 
      refreshIntervalMinutes * 60 * 1000
    );

    // Vérification immédiate
    checkSessionValidity();

    // Écouter les changements d'auth state
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          resetSession();
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('session_start_time');
        }
      }
    );

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      subscription.unsubscribe();
    };
  }, [maxSessionHours, refreshIntervalMinutes]);

  return {
    checkSessionValidity,
    getSessionInfo,
    resetSession,
  };
};