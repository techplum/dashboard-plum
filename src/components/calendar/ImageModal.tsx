import React from 'react';
import { Modal, Typography } from 'antd';
import { IdcardOutlined } from '@ant-design/icons';
import { message } from 'antd';

const { Title, Text } = Typography;

interface ImageModalProps {
  selectedImage: string | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ selectedImage, onClose }) => {
  const [messageApi, contextHolder] = message.useMessage();

  const handleClose = () => {
    onClose();
    // Si c'est une URL d'objet blob, la révoquer pour libérer la mémoire
    if (selectedImage && selectedImage.startsWith("blob:")) {
      URL.revokeObjectURL(selectedImage);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        open={!!selectedImage}
        onCancel={handleClose}
        footer={null}
        centered
        width="90vw"
        style={{ top: 20 }}
        title={
          <div style={{ textAlign: "center" }}>
            <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
              <IdcardOutlined style={{ marginRight: 8 }} />
              Document d'identité
            </Title>
          </div>
        }
      >
        {selectedImage && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <img
              src={selectedImage}
              alt="Document d'identité agrandi"
              style={{ 
                maxWidth: "100%", 
                maxHeight: "75vh", 
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
              onError={() => {
                console.error("Erreur de chargement de l'image:", selectedImage);
                messageApi.error("Impossible d'afficher l'image");
                handleClose();
              }}
              onLoad={() => {
                console.log("✅ Image chargée avec succès dans la modale");
              }}
            />
            <div style={{ marginTop: 16, color: "#666" }}>
              <Text type="secondary">
                Cliquez en dehors de l'image ou appuyez sur Échap pour fermer
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
