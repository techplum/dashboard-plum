import { useState, useRef, useCallback, useEffect } from 'react';
import { Address } from '../types/FliiinkerCompleteProfile';

// Déclaration des types Google Maps
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

export const useGoogleMaps = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Fonction pour charger l'API Google Maps une seule fois
  const loadGoogleMaps = useCallback(() => {
    if (window.google?.maps) {
      console.log("Google Maps déjà chargé");
      setMapLoaded(true);
      return;
    }

    console.log("Chargement de Google Maps...");
    window.initMap = () => {
      console.log("Google Maps callback initié");
      setMapLoaded(true);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Fonction pour initialiser la carte
  const initializeMap = useCallback(
    (addresses: Address[]) => {
      if (!mapLoaded || !addresses.length || !mapContainerRef.current) return;

      try {
        const defaultAddress = addresses[0];
        if (!defaultAddress?.latitude || !defaultAddress?.longitude) return;

        const mapOptions = {
          center: {
            lat: defaultAddress.latitude,
            lng: defaultAddress.longitude,
          },
          zoom: 15,
          mapTypeId: "roadmap",
        };

        const map = new window.google.maps.Map(
          mapContainerRef.current,
          mapOptions,
        );

        addresses.forEach((address) => {
          if (address.latitude && address.longitude) {
            new window.google.maps.Marker({
              map,
              position: { lat: address.latitude, lng: address.longitude },
              title: address.name || "Adresse",
            });
          }
        });
      } catch (error) {
        console.error("Erreur carte:", error);
      }
    },
    [mapLoaded],
  );

  // Nettoyer les ressources
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current = [];
    };
  }, []);

  return {
    mapLoaded,
    mapContainerRef,
    loadGoogleMaps,
    initializeMap,
  };
};
