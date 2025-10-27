import React, { useState, useEffect } from 'react';
import { Spin, Typography } from 'antd';
import { useAdministrativeImages } from '../../hooks/useAdministrativeImages';

const { Text } = Typography;

interface AdminImageProps {
  imagePath: string | undefined;
  alt: string;
  style?: React.CSSProperties;
  onClick: () => void;
}

export const AdminImage: React.FC<AdminImageProps> = ({ imagePath, alt, style, onClick }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { getSignedImageUrl } = useAdministrativeImages();

  useEffect(() => {
    if (!imagePath) {
      setLoading(false);
      setError(true);
      return;
    }

    const fetchSignedUrl = async () => {
      try {
        setLoading(true);
        setError(false);
        
        console.log("🔍 Token:", import.meta.env.VITE_ACCESS_ADMINISTRATIVE_IMAGE_SECRET_KEY ? "✅ Défini" : "❌ Non défini");
        
        const signedUrl = await getSignedImageUrl(imagePath);
        setImageUrl(signedUrl);
        setLoading(false);

      } catch (err) {
        console.error(`❌ Erreur de chargement de l'image administrative:`, err);
        setError(true);
        setLoading(false);
      }
    };

    fetchSignedUrl();

    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imagePath, getSignedImageUrl]);

  if (loading) {
    return (
      <Spin
        style={{
          ...style,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      />
    );
  }

  if (error || !imageUrl || imageUrl === "URL_FACTICE") {
    return (
      <div
        style={{
          ...style,
          background: "#f5f5f5",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text type="secondary">Image non disponible</Text>
      </div>
    );
  }

  return <img src={imageUrl} alt={alt} style={style} onClick={onClick} />;
};
