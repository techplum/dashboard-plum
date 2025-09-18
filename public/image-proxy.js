// Proxy simple pour contourner CORS
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imagePath } = req.query;
  
  if (!imagePath) {
    return res.status(400).json({ error: 'imagePath required' });
  }

  try {
    const response = await fetch(
      `https://staging-secure-image-access.tech-2a5.workers.dev/${imagePath}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.VITE_ADMIN_DATA_IMAGES_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Worker error' });
    }

    const imageBuffer = await response.buffer();
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(imageBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
