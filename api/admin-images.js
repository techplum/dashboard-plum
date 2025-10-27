// Proxy pour les images administratives - compatible avec le proxy local
export default async function handler(req, res) {
  const base_url = process.env.VITE_API_BASE_URL;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imagePath, expirationInSeconds = '60' } = req.query;
  
  if (!imagePath) {
    return res.status(400).json({ error: 'imagePath required' });
  }

  try {
    // Utiliser la même URL que le proxy local
    const apiUrl = `${base_url}/access-administrative-image/signed-url`;
    const params = new URLSearchParams({
      imagePath: imagePath,
      expirationInSeconds: expirationInSeconds
    });

    // Headers identiques au proxy local
    const headers = {
      'accept': '*/*',
      'access-administrative-image': process.env.VITE_ACCESS_ADMINISTRATIVE_IMAGE_SECRET_KEY,
    };

    // Ajouter le token JWT si présent dans la requête
    const authHeader = req.headers.authorization;
    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log('🔑 Token JWT ajouté:', authHeader.substring(0, 50) + '...');
    } else {
      console.log('⚠️ Pas de token JWT dans la requête');
    }

    console.log('🔄 Proxy Vercel - Appel API:', `${apiUrl}?${params}`);
    console.log('🔑 Token admin présent:', !!process.env.VITE_ACCESS_ADMINISTRATIVE_IMAGE_SECRET_KEY);
    console.log('🔑 Headers envoyés:', Object.keys(headers));

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      headers: headers,
    });

    console.log('📡 Réponse API:', response.status, response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API:', errorText);
      return res.status(response.status).json({ 
        error: 'API error', 
        details: errorText,
        status: response.status 
      });
    }

    const data = await response.json();
    console.log('📋 Données reçues:', typeof data, data ? Object.keys(data) : 'null');

    // Retourner directement la réponse JSON du backend
    // Le frontend s'attend à recevoir { data: { signedUrl: "..." } } ou { signedUrl: "..." }
    if (data && (data.signedUrl || data.data?.signedUrl)) {
      console.log('✅ URL signée trouvée, retour JSON');
      return res.json(data);
    }

    // Si on reçoit directement l'image (buffer) - cas non utilisé normalement
    if (data && typeof data === 'object' && data.buffer) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(Buffer.from(data.buffer));
    }

    // Fallback - retourner l'erreur
    console.log('❌ Format de réponse non reconnu:', data);
    return res.status(500).json({ 
      error: 'Invalid response format', 
      received: typeof data,
      data: data
    });

  } catch (error) {
    console.error('❌ Erreur proxy:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
