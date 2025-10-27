import { useState, useCallback } from 'react';
import { message } from 'antd';
import { supabaseClient } from '../utility/supabaseClient';

// Cache pour éviter les appels multiples
const imageUrlCache = new Map<string, Promise<string>>();

// Fonction pour récupérer le token JWT de l'utilisateur connecté
const getUserToken = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error("Erreur récupération session:", error);
      return null;
    }
    
    if (!session) {
      console.warn("⚠️ Pas de session active");
      return null;
    }
    
    const token = session.access_token;
    if (token) {
      // Décoder le token pour vérifier sa validité
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convertir en millisecondes
        const now = Date.now();
        
        console.log("🔍 Analyse du token JWT:");
        console.log("   Expiration:", new Date(exp).toISOString());
        console.log("   Maintenant:", new Date(now).toISOString());
        console.log("   Valide:", exp > now ? "✅ Oui" : "❌ Expiré");
        console.log("   User ID:", payload.sub);
        console.log("   Email:", payload.email);
        
        if (exp <= now) {
          console.warn("⚠️ Token JWT expiré, tentative de refresh...");
          
          const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
          if (refreshError) {
            console.error("❌ Échec du refresh:", refreshError);
            return null;
          }
          
          if (refreshData.session?.access_token) {
            console.log("✅ Token refreshé avec succès");
            return refreshData.session.access_token;
          }
        }
      } catch (decodeError) {
        console.error("❌ Erreur décodage token:", decodeError);
      }
    }
    
    return token;
  } catch (error) {
    console.error("Erreur getUserToken:", error);
    return null;
  }
};

// Fonction interne pour faire l'appel API
const fetchSignedImageUrl = async (imagePath: string): Promise<string> => {
  // Utiliser le proxy local au lieu d'appeler directement le backend
  const proxyUrl = `/api/admin-images/signed-url`;
  const params = new URLSearchParams({
    imagePath: imagePath,
    expirationInSeconds: '60'
  });
  
  console.log("🔍 APPEL API VIA PROXY:");
  console.log("   Proxy URL:", `${proxyUrl}?${params}`);
  console.log("   imagePath:", imagePath);
  
  try {
    // Récupérer le token JWT de l'utilisateur connecté
    const userToken = await getUserToken();
    console.log("   JWT Token:", userToken ? "✅ Récupéré" : "❌ Non trouvé");
    
    // Utiliser le token qui fonctionne
    const workingToken = import.meta.env.VITE_ACCESS_ADMINISTRATIVE_IMAGE_SECRET_KEY;
    
    const headers: Record<string, string> = {
      'accept': '*/*',
      'access-administrative-image': workingToken, // Utiliser directement le token qui fonctionne
    };
    
    // Ajouter le token JWT si disponible
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    } else {
      console.warn("⚠️ Pas de token JWT - l'authentification pourrait échouer");
    }
    
    console.log("   Headers envoyés:", Object.keys(headers));
    
    // Appel via le proxy (pas de problème CORS)
    const response = await fetch(`${proxyUrl}?${params}`, {
      method: 'GET',
      headers: headers,
    });

    console.log("📡 RÉPONSE VIA PROXY:");
    console.log("   Status:", response.status);
    console.log("   OK:", response.ok);
    console.log("   Headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("📋 DONNÉES BRUTES:", responseText);

    if (response.ok) {
      try {
        const jsonData = JSON.parse(responseText);
        console.log("📋 DONNÉES JSON:", jsonData);
        
        // La réponse a le format: { success: true, data: { signedUrl: "..." } }
        const signedUrl = jsonData.data?.signedUrl || jsonData.signedUrl || jsonData.url;
        
        if (signedUrl) {
          console.log("✅ URL signée obtenue avec succès:", signedUrl.substring(0, 100) + "...");
          return signedUrl;
        } else {
          console.log("❌ Pas d'URL signée dans la réponse");
          return "URL_FACTICE";
        }
      } catch {
        console.log("📋 Pas du JSON, retour brut:", responseText);
        return "URL_FACTICE";
      }
    } else {
      console.log("❌ ERREUR API:", response.status, responseText);
      
      // Si c'est une erreur d'authentification, afficher plus d'infos
      if (response.status === 401 || response.status === 403) {
        console.log("🚨 ERREUR D'AUTHENTIFICATION:");
        console.log("   - Vérifier que le token JWT est valide");
        console.log("   - Vérifier que access-administrative-image est correct");
      }
      
      return "URL_FACTICE";
    }

  } catch (error) {
    console.error("❌ ERREUR FETCH VIA PROXY:", error);
    
    // Supprimer du cache en cas d'erreur
    imageUrlCache.delete(imagePath);
    
    return "URL_FACTICE";
  }
};

export const useAdministrativeImages = () => {
  const [messageApi, contextHolder] = message.useMessage();

  // Fonction pour obtenir une URL signée avec cache
  const getSignedImageUrl = useCallback(async (imagePath: string): Promise<string> => {
    // Vérifier le cache d'abord
    if (imageUrlCache.has(imagePath)) {
      console.log("🔄 Utilisation du cache pour:", imagePath);
      return imageUrlCache.get(imagePath)!;
    }

    // Créer la promesse et la mettre en cache immédiatement
    const promise = fetchSignedImageUrl(imagePath);
    imageUrlCache.set(imagePath, promise);
    
    return promise;
  }, []);

  // Fonction pour afficher une image en grand
  const handleImageClick = useCallback(async (imagePath: string, onSuccess: (url: string) => void) => {
    if (!imagePath) return;

    try {
      console.log("🔍 Récupération URL signée pour agrandissement:", imagePath);
      const signedUrl = await getSignedImageUrl(imagePath);
      
      if (signedUrl && signedUrl !== "URL_FACTICE") {
        console.log("✅ Ouverture de l'image en grand");
        onSuccess(signedUrl);
      } else {
        console.warn("⚠️ URL signée non valide");
        messageApi.warning("Impossible d'afficher l'image en grand");
      }
    } catch (error) {
      console.error(
        `Erreur lors du chargement de l'image administrative pour modale: ${imagePath}`,
        error,
      );
      messageApi.error(`Impossible de charger l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [getSignedImageUrl, messageApi]);

  return {
    getSignedImageUrl,
    handleImageClick,
    contextHolder,
  };
};
