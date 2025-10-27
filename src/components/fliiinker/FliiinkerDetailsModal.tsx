import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  Typography,
  Divider,
  Spin,
  Button,
  message,
  Popconfirm,
} from "antd";
import {
  ThunderboltOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useDelete } from "@refinedev/core";
import { ColorModeContext } from "../../contexts/color-mode";
import { Public_profile } from "../../types/public_profileTypes";
import { FliiinkerCompleteProfile } from "../../types/FliiinkerCompleteProfile";
import { 
  fetchFliiinkerCompleteProfile,
  validateFliiinkerProfileAndServices 
} from "../../services/meeting/meetingService";
import { useAdministrativeImages } from "../../hooks/useAdministrativeImages";
import { useGoogleMaps } from "../../hooks/useGoogleMaps";

import { ProfileInfo } from "../calendar/ProfileInfo";
import { IdentityDocuments } from "../calendar/IdentityDocuments";
import { ImageModal } from "../calendar/ImageModal";
import { AdminInfo } from "./AdminInfo";
import { ContactInfo } from "./ContactInfo";
import { ServiceDetails } from "./ServiceDetails";
import { ServiceRatings } from "./ServiceRatings";

import "../../styles/meetingModal.css";

const { Title } = Typography;

interface FliiinkerDetailsModalProps {
  isVisible: boolean;
  fliiinker: Public_profile | null;
  onClose: () => void;
  onDelete?: () => void;
}

export const FliiinkerDetailsModal: React.FC<FliiinkerDetailsModalProps> = ({
  isVisible,
  fliiinker,
  onClose,
  onDelete,
}) => {
  const { mode } = useContext(ColorModeContext);
  const [fliiinkerProfile, setFliiinkerProfile] = useState<FliiinkerCompleteProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activatingPlum, setActivatingPlum] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  
  const { mutate: deleteOne } = useDelete();
  const { handleImageClick: handleAdminImageClickHook } = useAdministrativeImages();
  const { mapLoaded, mapContainerRef, loadGoogleMaps, initializeMap } = useGoogleMaps();

  const profileData = (fliiinkerProfile || {
    ...fliiinker,
    ...fliiinker?.fliiinker_profile,
  }) as FliiinkerCompleteProfile;

  useEffect(() => {
    if (isVisible && fliiinker?.fliiinker_profile?.id) {
      setLoading(true);
      
      fetchFliiinkerCompleteProfile(fliiinker.fliiinker_profile.id)
        .then((profile) => {
          if (profile) {
            setFliiinkerProfile(profile);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement du profil complet:", error);
          setLoading(false);
        });
    }
  }, [isVisible, fliiinker]);

  useEffect(() => {
    if (
      isVisible &&
      profileData?.addresses &&
      profileData.addresses.length > 0
    ) {
      loadGoogleMaps();
    }
  }, [isVisible, profileData?.addresses, loadGoogleMaps]);

  useEffect(() => {
    if (
      mapLoaded &&
      profileData?.addresses &&
      profileData.addresses.length > 0 &&
      mapContainerRef.current
    ) {
      initializeMap(profileData.addresses);
    }
  }, [mapLoaded, profileData?.addresses, initializeMap]);

  useEffect(() => {
    if (isVisible && mapContainerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (window.google?.maps && mapContainerRef.current) {
          google.maps.event.trigger(mapContainerRef.current, "resize");
        }
      });
      resizeObserver.observe(mapContainerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isVisible, mapContainerRef]);

  const handleActivatePlum = async () => {
    if (!fliiinker?.fliiinker_profile?.id) {
      messageApi.error({
        content: "Impossible de trouver l'ID du profil Fliiinker",
        icon: <ThunderboltOutlined style={{ color: "#ff4d4f" }} />,
        duration: 3,
      });
      return;
    }

    setActivatingPlum(true);
    const key = "plum-activation";

    messageApi.open({
      key,
      type: "loading",
      content: "Activation du Plüm en cours...",
      duration: 0,
    });

    try {
      await validateFliiinkerProfileAndServices(fliiinker.fliiinker_profile.id);
      messageApi.open({
        key,
        type: "success",
        content: "Plüm activé avec succès !",
        duration: 3,
      });
    } catch (error) {
      messageApi.open({
        key,
        type: "error",
        content: "Échec de l'activation du Plüm",
        duration: 3,
      });
    } finally {
      setActivatingPlum(false);
    }
  };

  const handleRegularImageClick = (imageUrl: string) => {
    if (
      imageUrl.startsWith(
        "https://administrative-image-access.fliiinkapp.workers.dev",
      )
    ) {
      setSelectedImage(imageUrl);
    } else {
      setSelectedImage(
        `${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${imageUrl}`,
      );
    }
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

  const handleAdminImageClick = (imagePath: string) => {
    handleAdminImageClickHook(imagePath, setSelectedImage);
  };

  const handleDelete = async () => {
    if (!fliiinker?.id) return;
    
    await deleteOne({
      resource: "public_profile",
      id: fliiinker.id,
    });
    
    if (onDelete) {
      onDelete();
    }
    onClose();
  };

  if (loading) {
    return (
      <Modal
        className="styled-modal"
        title="Détails du Fliiinker"
        open={isVisible}
        onCancel={onClose}
        footer={null}
        centered
        width={900}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      </Modal>
    );
  }

  if (!fliiinker) {
    return null;
  }

  return (
    <Modal
      className="styled-modal"
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title level={4} style={{ margin: 0 }}>
            Détails du Fliiinker
          </Title>
          <div>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleActivatePlum}
              loading={activatingPlum}
              style={{ marginRight: 8 }}
            >
              Activer le Plüm
            </Button>
            <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer ce Fliiinker ?"
              onConfirm={handleDelete}
              okText="Oui"
              cancelText="Non"
            >
              <Button danger icon={<DeleteOutlined />}>
                Supprimer
              </Button>
            </Popconfirm>
          </div>
        </div>
      }
      open={isVisible}
      onCancel={onClose}
      footer={null}
      centered
      width={900}
      data-theme={mode}
    >
      {contextHolder}

      <ImageModal 
        selectedImage={selectedImage} 
        onClose={handleCloseImageModal} 
      />

      <ContactInfo publicProfile={fliiinker} />

      <Divider />

      <ProfileInfo 
        profileData={profileData} 
        onImageClick={handleRegularImageClick} 
      />

      <Divider />

      <IdentityDocuments 
        profileData={profileData} 
        onImageClick={handleAdminImageClick} 
      />

      <Divider />

      {profileData?.services && profileData.services.length > 0 && (
        <>
          <ServiceDetails 
            services={profileData.services} 
            fliiinkerId={fliiinker.id} 
          />
          
          <Divider />
        </>
      )}

      <ServiceRatings 
        services={profileData?.services || []} 
        fliiinkerId={fliiinker.id} 
      />
      
      <Divider />

      <AdminInfo publicProfile={fliiinker} />
    </Modal>
  );
};
