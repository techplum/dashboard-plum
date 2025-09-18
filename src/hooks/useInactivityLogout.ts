import { useEffect, useRef } from 'react';
import { supabaseClient } from '../utility/supabaseClient';

interface UseInactivityLogoutProps {
  timeoutMinutes?: number; // Durée d'inactivité avant logout (défaut: 30 min)
  checkInterval?: number; // Intervalle de vérification en ms (défaut: 60s)
}

export const useInactivityLogout = ({
  timeoutMinutes = 30,
  checkInterval = 60000, // 1 minute
}: UseInactivityLogoutProps = {}) => {
  // Fonction de logout directe via Supabase
  const performLogout = async () => {
    try {
      console.log('🔓 Déconnexion en cours...');
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('Erreur lors de la déconnexion:', error);
      } else {
        console.log('✅ Déconnexion réussie');
        // Rediriger vers la page de login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Erreur inattendue lors de la déconnexion:', error);
      // En cas d'erreur, forcer la redirection
      window.location.href = '/login';
    }
  };
  
  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  // Mettre à jour le timestamp de dernière activité
  const updateLastActivity = () => {
    lastActivityRef.current = Date.now();
    
    // Sauvegarder dans localStorage pour persistance entre onglets
    localStorage.setItem('last_activity', lastActivityRef.current.toString());
  };

  // Vérifier l'inactivité - Déconnexion automatique directe
  const checkInactivity = () => {
    const now = Date.now();
    const lastActivity = Math.max(
      lastActivityRef.current,
      parseInt(localStorage.getItem('last_activity') || '0')
    );
    
    const inactiveMinutes = (now - lastActivity) / (1000 * 60);

    // Logout automatique direct après le délai d'inactivité
    if (inactiveMinutes >= timeoutMinutes) {
      console.log(`🔐 Déconnexion automatique après ${inactiveMinutes.toFixed(1)} minutes d'inactivité`);
      performLogout();
      
      // Notification optionnelle et discrète
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Session expirée', {
          body: `Déconnecté après ${timeoutMinutes} min d'inactivité`,
          icon: '/favicon.ico'
        });
      }
    }
  };

  useEffect(() => {
    // Events à surveiller pour détecter l'activité
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle pour éviter trop d'updates
    let throttleTimeout: NodeJS.Timeout;
    const throttledUpdate = () => {
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        updateLastActivity();
        throttleTimeout = undefined as any;
      }, 1000); // Max 1 update par seconde
    };

    // Ajouter les listeners
    events.forEach(event => {
      document.addEventListener(event, throttledUpdate, true);
    });

    // Démarrer la vérification périodique
    checkIntervalRef.current = setInterval(checkInactivity, checkInterval);

    // Vérification initiale
    updateLastActivity();

    // Demander permission pour notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdate, true);
      });
      
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [timeoutMinutes, checkInterval]);

  // API pour usage manuel
  return {
    updateLastActivity,
    checkInactivity,
    getInactiveMinutes: () => {
      const lastActivity = Math.max(
        lastActivityRef.current,
        parseInt(localStorage.getItem('last_activity') || '0')
      );
      return (Date.now() - lastActivity) / (1000 * 60);
    }
  };
};