import React from 'react';
import { Typography, Divider, Row, Col, Card } from 'antd';
import { IdcardOutlined } from '@ant-design/icons';
import { AdminImage } from './AdminImage';
import { FliiinkerCompleteProfile } from '../../types/FliiinkerCompleteProfile';

const { Title, Text } = Typography;

interface IdentityDocumentsProps {
  profileData: FliiinkerCompleteProfile;
  onImageClick: (imagePath: string) => void;
}

export const IdentityDocuments: React.FC<IdentityDocumentsProps> = ({
  profileData,
  onImageClick,
}) => {
  // Récupérer les images depuis les données administratives
  const adminImages = profileData.administrative_images;
  
  console.log("🔍🔍🔍 Vérification des images administratives pour l'identité:", {
    hasAdminImages: !!adminImages,
    adminImagesType: typeof adminImages,
    adminImages: adminImages,
  });

  if (!adminImages) {
    return null;
  }

  const { has_cin, has_passport, front_image, back_image, passport_image } = adminImages;
  
  // Calculer combien d'images on va afficher
  const imagesToShow = [];
  
  if (has_cin && front_image) {
    imagesToShow.push({
      key: 'front',
      title: 'Carte d\'identité (Recto)',
      imagePath: front_image,
      alt: 'Carte d\'identité - Recto'
    });
  }
  
  if (has_cin && back_image) {
    imagesToShow.push({
      key: 'back', 
      title: 'Carte d\'identité (Verso)',
      imagePath: back_image,
      alt: 'Carte d\'identité - Verso'
    });
  }
  
  if (has_passport && passport_image) {
    imagesToShow.push({
      key: 'passport',
      title: 'Passeport',
      imagePath: passport_image,
      alt: 'Passeport'
    });
  }

  if (imagesToShow.length === 0) {
    return null;
  }

  // Calculer la largeur des colonnes selon le nombre d'images
  const getColSpan = (totalImages: number) => {
    if (totalImages === 1) return 24; // Une image = pleine largeur
    if (totalImages === 2) return 12; // Deux images = 50% chacune
    return 8; // Trois images = 33% chacune
  };

  const colSpan = getColSpan(imagesToShow.length);

  return (
    <>
      <Divider style={{ margin: "16px 0" }} />
      <Title level={5}>
        <IdcardOutlined style={{ marginRight: 8, color: "#1890ff" }} />
        Pièces d'identité / Passeport
        <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
          ({imagesToShow.length} document{imagesToShow.length > 1 ? 's' : ''})
        </Text>
      </Title>
      <Row gutter={[16, 16]} justify="start">
        {imagesToShow.map((imageInfo) => (
          <Col span={colSpan} key={imageInfo.key}>
            <Card
              title={imageInfo.title}
              className="admin-image-card"
              style={{ height: "100%" }}
              hoverable
            >
              <div
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 8,
                }}
                onMouseEnter={(e) => {
                  const img = e.currentTarget.querySelector('img');
                  if (img) img.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  const img = e.currentTarget.querySelector('img');
                  if (img) img.style.transform = "scale(1)";
                }}
              >
                <AdminImage
                  imagePath={imageInfo.imagePath}
                  alt={imageInfo.alt}
                  style={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "transform 0.3s ease",
                    display: "block",
                  }}
                  onClick={() => onImageClick(imageInfo.imagePath)}
                />
                {/* Overlay pour indiquer qu'on peut cliquer */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                    cursor: "pointer",
                    borderRadius: 8,
                  }}
                  className="image-overlay"
                  onClick={() => onImageClick(imageInfo.imagePath)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.background = "rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0";
                    e.currentTarget.style.background = "rgba(0,0,0,0)";
                  }}
                >
                  <div
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      color: "#1890ff",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    🔍 Cliquer pour agrandir
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};
