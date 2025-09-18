import { useEffect, useRef } from 'react';
import { supabaseClient } from '../utility/supabaseClient';

interface UseSimpleInactivityLogoutProps {
  inactivityMinutes?: number; // Durée d'inactivité avant déconnexion (défaut: 30 min)
}

/**
 * Hook simple pour déconnexion automatique après inactivité
 * 
 * Comportement :
 * - Détecte l'activité utilisateur (souris, clavier, scroll)
 * - Déconnecte automatiquement après X minutes d'inactivité
 * - Pas de popup ni avertissement
 * - Redirection directe vers /login
 * 
 * Usage :
 * useSimpleInactivityLogout({ inactivityMinutes: 30 });
 */
export const useSimpleInactivityLogout = ({
  inactivityMinutes = 30,
}: UseSimpleInactivityLogoutProps = {}) => {
  
  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  // Déconnexion directe via Supabase
  const logout = async () => {
    try {
      console.log(`🔐 Déconnexion automatique après ${inactivityMinutes} min d'inactivité`);
      await supabaseClient.auth.signOut();
      
      // Nettoyer le localStorage
      localStorage.removeItem('last_activity');
      
      // Redirection immédiate
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Forcer la redirection même en cas d'erreur
      window.location.href = '/login';
    }
  };

  // Mettre à jour l'activité
  const updateActivity = () => {
    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem('last_activity', now.toString());
  };

  // Vérifier l'inactivité
  const checkInactivity = () => {
    const now = Date.now();
    const lastActivity = Math.max(
      lastActivityRef.current,
      parseInt(localStorage.getItem('last_activity') || '0')
    );
    
    const inactiveMinutes = (now - lastActivity) / (1000 * 60);

    if (inactiveMinutes >= inactivityMinutes) {
      logout();
    }
  };

  useEffect(() => {
    // Events d'activité à surveiller
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 
      'scroll', 'touchstart', 'click'
    ];

    // Throttle pour éviter trop d'updates
    let throttleTimeout: NodeJS.Timeout;
    const throttledUpdate = () => {
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        updateActivity();
        throttleTimeout = undefined as any;
      }, 1000); // Max 1 update par seconde
    };

    // Ajouter les listeners d'activité
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledUpdate, true);
    });

    // Vérification périodique toutes les minutes
    checkIntervalRef.current = setInterval(checkInactivity, 60000);

    // Initialiser l'activité
    updateActivity();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledUpdate, true);
      });
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [inactivityMinutes]);

  // API pour usage externe (optionnel)
  return {
    updateActivity,
    checkInactivity,
    getInactiveMinutes: () => {
      const lastActivity = Math.max(
        lastActivityRef.current,
        parseInt(localStorage.getItem('last_activity') || '0')
      );
      return (Date.now() - lastActivity) / (1000 * 60);
    },
    logout,
  };
};