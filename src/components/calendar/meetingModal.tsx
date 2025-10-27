import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  Modal,
  Typography,
  Avatar,
  Tag,
  Divider,
  Spin,
  Space,
  Row,
  Col,
  Card,
  Button,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  TrophyOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  IdcardOutlined,
  BankOutlined,
  CarOutlined,
  GlobalOutlined,
  DollarCircleOutlined,
  TagsOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  MeetingWithProfiles,
  fetchFliiinkerCompleteProfile,
  validateFliiinkerProfileAndServices,
} from "../../services/meeting/meetingService";
import dayjs from "dayjs";
import { ColorModeContext } from "../../contexts/color-mode";
import { FliiinkerCompleteProfile } from "../../types/FliiinkerCompleteProfile";
import type { Address } from "../../types/FliiinkerCompleteProfile";
import { supabaseClient } from "../../utility/supabaseClient";
import "../../styles/meetingModal.css";

const { Title, Text, Paragraph } = Typography;
const base_url = "https://staging.api.plumservices.co";

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

// Fonction pour tester l'appel API via le proxy Vite (avec cache pour éviter les appels multiples)
const getSignedImageUrl = async (imagePath: string): Promise<string> => {
  // Vérifier le cache d'abord
  if (imageUrlCache.has(imagePath)) {
    console.log("🔄 Utilisation du cache pour:", imagePath);
    return imageUrlCache.get(imagePath)!;
  }

  // Créer la promesse et la mettre en cache immédiatement
  const promise = fetchSignedImageUrl(imagePath);
  imageUrlCache.set(imagePath, promise);
  
  return promise;
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
      
      // Si c'est une erreur d'authentification, essayer avec le token hardcodé
      if (response.status === 401 || response.status === 403) {
        console.log("🚨 ERREUR D'AUTHENTIFICATION - Tentative avec token hardcodé:");
        
        try {
          const fallbackHeaders = {
            'accept': '*/*',
            'access-administrative-image': workingToken, // Token qui marche dans curl
            ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {}),
          };
          
          console.log("   🔄 Retry avec token hardcodé...");
          
          const retryResponse = await fetch(`${proxyUrl}?${params}`, {
            method: 'GET',
            headers: fallbackHeaders,
          });
          
          console.log("   📡 Retry Status:", retryResponse.status);
          
          if (retryResponse.ok) {
            const retryText = await retryResponse.text();
            console.log("   ✅ SUCCESS avec token hardcodé!");
            console.log("   📋 Données:", retryText);
            
            try {
              const jsonData = JSON.parse(retryText);
              const signedUrl = jsonData.data?.signedUrl || jsonData.signedUrl || jsonData.url;
              return signedUrl || "URL_FACTICE";
            } catch {
              return "URL_FACTICE";
            }
          } else {
            console.log("   ❌ Retry aussi échoué:", retryResponse.status);
          }
        } catch (retryError) {
          console.log("   ❌ Erreur retry:", retryError);
        }
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

// Composant d'image administrative utilisant la nouvelle API signed-url
const AdminImage: React.FC<{
  imagePath: string | undefined;
  alt: string;
  style?: React.CSSProperties;
  onClick: () => void;
}> = ({ imagePath, alt, style, onClick }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        
        console.log("🔍 Token:", import.meta.env.VITE_ADMIN_DATA_IMAGES_SECRET_KEY ? "✅ Défini" : "❌ Non défini");
        
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
  }, [imagePath]);

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

  if (error || !imageUrl) {
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

interface MeetingModalProps {
  isVisible: boolean;
  meeting: MeetingWithProfiles | null;
  loading: boolean;
  onClose: () => void;
  meetingId?: string;
}

// Déclaration des types Google Maps
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

const MeetingModal: React.FC<MeetingModalProps> = ({
  isVisible,
  meeting,
  loading: initialLoading,
  onClose,
  meetingId,
}) => {
  const { mode } = useContext(ColorModeContext);
  const [fliiinkerProfile, setFliiinkerProfile] =
    useState<FliiinkerCompleteProfile | null>(null);
  const [loading, setLoading] = useState(initialLoading);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [activatingPlum, setActivatingPlum] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Déterminer les données à afficher
  const profileData = (fliiinkerProfile || {
    ...meeting?.publicProfile,
    ...meeting?.fliiinkerProfile,
    meeting: meeting?.meeting,
  }) as FliiinkerCompleteProfile;

  // Récupérer les données complètes du fliiinker
  useEffect(() => {
    if (isVisible && meeting) {
      setLoading(true);

      const meetingData = meeting.meeting as any;
      const fliiinkerId = meeting.fliiinkerProfile.id;

      fetchFliiinkerCompleteProfile(fliiinkerId, meetingData.id)
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
  }, [isVisible, meeting]);

  useEffect(() => {
    if (fliiinkerProfile) {
      console.log("Données du profil complet:", fliiinkerProfile);
      console.log(
        "Données administratives:",
        fliiinkerProfile.fliiinker_profile?.administrative_data ||
          fliiinkerProfile.administrative_data,
      );
      console.log("Services:", fliiinkerProfile.services);
      console.log(
        "Meeting:",
        fliiinkerProfile.fliiinker_profile?.fliiinker_meeting ||
          fliiinkerProfile.meeting,
      );
      console.log(
        "📸📸📸 Images administratives:",
        fliiinkerProfile.administrative_images,
      );
    }
  }, [fliiinkerProfile]);

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

  // Charger l'API Google Maps quand le modal est visible
  useEffect(() => {
    if (
      isVisible &&
      profileData?.addresses &&
      profileData.addresses.length > 0
    ) {
      console.log("Tentative de chargement de la carte");
      loadGoogleMaps();
    }
  }, [isVisible, profileData?.addresses, loadGoogleMaps]);

  // Initialiser la carte quand l'API est chargée
  useEffect(() => {
    if (
      mapLoaded &&
      profileData?.addresses &&
      profileData.addresses.length > 0 &&
      mapContainerRef.current
    ) {
      console.log("Initialisation de la carte");
      initializeMap(profileData.addresses);
    }
  }, [mapLoaded, profileData?.addresses, initializeMap]);

  // Nettoyer les ressources
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current = [];
    };
  }, []);

  // Forcer un re-render du conteneur de la carte
  useEffect(() => {
    if (isVisible && mapContainerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          google.maps.event.trigger(mapRef.current, "resize");
        }
      });
      resizeObserver.observe(mapContainerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isVisible]);

  // Fonction pour activer le Plüm
  const handleActivatePlum = async () => {
    if (!meeting?.fliiinkerProfile?.id) {
      console.log("No fliiinker profile id");
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
      await validateFliiinkerProfileAndServices(meeting.fliiinkerProfile.id);
      messageApi.open({
        key,
        type: "success",
        content: (
          <Space>
            <CheckCircleOutlined />
            Plüm activé avec succès !
          </Space>
        ),
        duration: 3,
      });
    } catch (error) {
      messageApi.open({
        key,
        type: "error",
        content: (
          <Space>
            <ThunderboltOutlined />
            Échec de l'activation du Plüm
          </Space>
        ),
        duration: 3,
      });
    } finally {
      setActivatingPlum(false);
    }
  };

  // Fonction pour ouvrir l'image dans la modale
  const handleImageClick = (imageUrl: string) => {
    // Si c'est une image administrative, garder l'URL originale
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

  // Fonction pour fermer la modale d'image
  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

  // Fonction pour afficher l'image administrative dans la modale
  const handleAdminImageClick = async (imagePath: string) => {
    if (!imagePath) return;

    try {
      console.log("🔍 Récupération URL signée pour agrandissement:", imagePath);
      const signedUrl = await getSignedImageUrl(imagePath);
      
      if (signedUrl && signedUrl !== "URL_FACTICE") {
        console.log("✅ Ouverture de l'image en grand");
        setSelectedImage(signedUrl);
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
  };

  if (loading) {
    return (
      <Modal
        className="styled-modal"
        title="Détails du rendez-vous"
        open={isVisible}
        onCancel={onClose}
        footer={null}
        centered
        width={800}
      >
        <div
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <Spin size="large" />
        </div>
      </Modal>
    );
  }

  if (!meeting && !fliiinkerProfile) {
    return null;
  }

  const meetingData =
    profileData.fliiinker_profile?.fliiinker_meeting ||
    profileData.meeting ||
    meeting?.meeting;
  const meetingDate = meetingData?.date_to_call
    ? dayjs(meetingData.date_to_call)
    : null;

  const adminData =
    profileData.fliiinker_profile?.administrative_data ||
    profileData.administrative_data;
  const supaPowas =
    profileData.fliiinker_profile?.supa_powa || profileData.supa_powa || [];
  const services = profileData.services || [];
  const description =
    profileData.fliiinker_profile?.description || profileData.description;

  console.log("Données complètes pour debug:", {
    profileData,
    meetingData,
    adminData,
    supaPowas,
    services,
  });

  return (
    <Modal
      className="styled-modal"
      title={
        <Title level={4}>
          Détails du rendez-vous
          {meetingData && (
            <Tag
              className={`status-tag ${meetingData.is_finish ? "validated" : "pending"}`}
            >
              {meetingData.is_finish ? "Terminé" : "En attente"}
            </Tag>
          )}
        </Title>
      }
      open={isVisible}
      onCancel={onClose}
      footer={null}
      centered
      width={800}
      data-theme={mode}
    >
      {contextHolder}

      {/* Modale pour afficher l'image en grand */}
      <Modal
        open={!!selectedImage}
        onCancel={() => {
          handleCloseImageModal();
          // Si c'est une URL d'objet blob, la révoquer pour libérer la mémoire
          if (selectedImage && selectedImage.startsWith("blob:")) {
            URL.revokeObjectURL(selectedImage);
          }
        }}
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
                handleCloseImageModal();
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

      <div className="profile-card">
        <Avatar
          className="large-avatar"
          src={
            profileData.avatar
              ? `${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${profileData.avatar}`
              : undefined
          }
          size={80}
          icon={<UserOutlined />}
          style={{
            borderRadius: "50%",
            minWidth: "80px",
            minHeight: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            objectFit: "cover",
            cursor: profileData.avatar ? "pointer" : "default",
          }}
          onClick={() =>
            profileData.avatar && handleImageClick(profileData.avatar)
          }
          onError={() => {
            console.error(
              "Erreur de chargement de l'avatar:",
              profileData.avatar,
            );
            return false;
          }}
        />
        <div className="profile-info">
          <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
            {profileData.first_name} {profileData.last_name}
            {(profileData.fliiinker_profile?.is_pro || profileData.is_pro) && (
              <Tag color="gold" style={{ marginLeft: 10 }}>
                PRO
              </Tag>
            )}
          </Title>
          <Text
            type="secondary"
            style={{ fontSize: 16, display: "block", marginBottom: 12 }}
          >
            {profileData.fliiinker_profile?.tagline ||
              profileData.tagline ||
              (description
                ? description.substring(0, 50) +
                  (description.length > 50 ? "..." : "")
                : "Fliiinker")}
          </Text>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {Array.isArray(profileData.fliiinker_profile?.spoken_languages) &&
              profileData.fliiinker_profile?.spoken_languages.map(
                (lang: any, index: number) => (
                  <Tag
                    key={index}
                    color="blue"
                    icon={lang.emoji ? <span>{lang.emoji}</span> : null}
                  >
                    {typeof lang === "object" ? lang.name || "Langue" : lang}
                  </Tag>
                ),
              )}
            {Array.isArray(profileData.spoken_languages) &&
              profileData.spoken_languages.map((lang: any, index: number) => (
                <Tag
                  key={index}
                  color="blue"
                  icon={lang.emoji ? <span>{lang.emoji}</span> : null}
                >
                  {typeof lang === "object" ? lang.name || "Langue" : lang}
                </Tag>
              ))}
          </div>
        </div>
      </div>

      <div className="glass-section" style={{ textAlign: "center" }}>
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          onClick={handleActivatePlum}
          loading={activatingPlum}
          style={{
            height: "50px",
            padding: "0 40px",
            fontSize: "18px",
            background: "linear-gradient(45deg, #722ed1 0%, #1890ff 100%)",
            border: "none",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            marginBottom: "10px",
            transition: "all 0.3s ease",
          }}
          className="plum-button"
        >
          Activer le Plüm
        </Button>
        <br />
        <Text type="secondary">Valider le profil et activer les services</Text>
      </div>

      {meetingData && (
        <div className="glass-section">
          <Title level={5}>Détails du rendez-vous</Title>
          <div className="detail-item">
            <CalendarOutlined style={{ color: "#1890ff" }} />
            <Text>
              {meetingDate
                ? meetingDate.format("DD MMMM YYYY")
                : "Date non définie"}
            </Text>
          </div>
          <div className="detail-item">
            <ClockCircleOutlined style={{ color: "#52c41a" }} />
            <Text>{meetingData.hour_to_call || "Heure non définie"}</Text>
          </div>
          <div className="detail-item">
            <EnvironmentOutlined style={{ color: "#faad14" }} />
            <Text>
              Fuseau horaire: {meetingData.timezone || "Non spécifié"}
            </Text>
          </div>
          <div className="detail-item">
            <MailOutlined style={{ color: "#eb2f96" }} />
            <Text>{profileData.email}</Text>
          </div>
          {profileData.phone && (
            <div className="detail-item">
              <PhoneOutlined style={{ color: "#722ed1" }} />
              <Text>{profileData.phone}</Text>
            </div>
          )}
        </div>
      )}

      <Divider style={{ margin: "12px 0" }} />

      <Title level={5}>Profil</Title>
      {description && (
        <div className="glass-section">
          <Paragraph style={{ margin: 0 }}>{description}</Paragraph>
        </div>
      )}

      {supaPowas && supaPowas.length > 0 && (
        <div className="glass-section">
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Super Pouvoirs:
          </Text>
          <Space wrap>
            {supaPowas.map((power: any, index: number) => (
              <Tag
                key={index}
                color="purple"
                icon={power.emoji ? <span>{power.emoji}</span> : null}
              >
                {typeof power === "object" ? power.name : power}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      <div className="meeting-stats">
        <div className="stat-card">
          <TrophyOutlined
            style={{ fontSize: 24, color: "#faad14", marginBottom: 8 }}
          />
          <Text strong>
            {profileData.fliiinker_profile?.degree ||
              profileData.degree ||
              "Non spécifié"}
          </Text>
          <Text type="secondary">Diplôme</Text>
        </div>
        <div className="stat-card">
          <UserOutlined
            style={{ fontSize: 24, color: "#1890ff", marginBottom: 8 }}
          />
          <Text strong>
            {(() => {
              const gender = profileData.gender;
              if (typeof gender === "object" && gender !== null) {
                return gender || "Non spécifié";
              }
              return gender || "Non spécifié";
            })()}
          </Text>
          <Text type="secondary">Genre</Text>
        </div>
      </div>

      {(profileData.Pictures1 ||
        profileData.Pictures2 ||
        profileData.Pictures3) && (
        <>
          <Divider style={{ margin: "16px 0" }} />
          <Title level={5}>Photos du Plüm</Title>
          <Row gutter={[16, 16]}>
            {profileData.Pictures1 && (
              <Col span={8}>
                <img
                  src={`${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${profileData.Pictures1}`}
                  alt="Photo 1"
                  style={{
                    width: "100%",
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    profileData.Pictures1 &&
                    handleImageClick(profileData.Pictures1)
                  }
                  onError={() =>
                    console.error(
                      "Erreur de chargement de Pictures1:",
                      profileData.Pictures1,
                    )
                  }
                />
              </Col>
            )}
            {profileData.Pictures2 && (
              <Col span={8}>
                <img
                  src={`${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${profileData.Pictures2}`}
                  alt="Photo 2"
                  style={{
                    width: "100%",
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    profileData.Pictures2 &&
                    handleImageClick(profileData.Pictures2)
                  }
                  onError={() =>
                    console.error(
                      "Erreur de chargement de Pictures2:",
                      profileData.Pictures2,
                    )
                  }
                />
              </Col>
            )}
            {profileData.Pictures3 && (
              <Col span={8}>
                <img
                  src={`${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${profileData.Pictures3}`}
                  alt="Photo 3"
                  style={{
                    width: "100%",
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    profileData.Pictures3 &&
                    handleImageClick(profileData.Pictures3)
                  }
                  onError={() =>
                    console.error(
                      "Erreur de chargement de Pictures3:",
                      profileData.Pictures3,
                    )
                  }
                />
              </Col>
            )}
          </Row>
        </>
      )}

      {/* Section pour les pièces d'identité / passeport */}
      {(() => {
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
                        e.currentTarget.querySelector('img')!.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.querySelector('img')!.style.transform = "scale(1)";
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
                        onClick={() => handleAdminImageClick(imageInfo.imagePath)}
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
                        onClick={() => handleAdminImageClick(imageInfo.imagePath)}
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
      })()}

      {/* Cette section est maintenant fusionnée avec la section des pièces d'identité ci-dessus */}

      {services && services.length > 0 && (
        <>
          <Divider style={{ margin: "16px 0" }} />
          <Title level={5}>Services proposés</Title>
          {services.map((service: any, index: number) => (
            <Card
              key={index}
              className="service-card"
              title={
                <Space>
                  <DollarCircleOutlined
                    style={{ color: service.is_active ? "#52c41a" : "#ff4d4f" }}
                  />
                  <Text>
                    {service.service_type ||
                      (service.service_id === 24
                        ? "Garde d'animaux"
                        : service.service_id === 25
                          ? "Ménage/Linge"
                          : service.service_id === 26
                            ? "Garde d'enfant"
                            : `Service #${service.service_id}`)}
                  </Text>
                  <Tag color={service.is_active ? "success" : "error"}>
                    {service.is_active ? "Actif" : "Inactif"}
                  </Tag>
                </Space>
              }
            >
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text strong>Tarif horaire:</Text>{" "}
                  {service.hourly_rate || "Non défini"} €/h
                </Col>
                <Col span={12}>
                  <Text strong>Date création:</Text>{" "}
                  {service.created_at
                    ? dayjs(service.created_at).format("DD/MM/YYYY")
                    : "Non définie"}
                </Col>
                {service.description && (
                  <Col span={24}>
                    <Text strong>Description:</Text> {service.description}
                  </Col>
                )}
                {service.tags && service.tags.length > 0 && (
                  <Col span={24}>
                    <Space style={{ marginTop: 8 }}>
                      <TagsOutlined />
                      {service.tags.map((tag: any, i: number) => (
                        <Tag key={i} color="blue">
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                  </Col>
                )}
              </Row>
            </Card>
          ))}
        </>
      )}

      {profileData?.addresses && profileData.addresses.length > 0 && (
        <>
          <Divider style={{ margin: "16px 0" }} />
          <Title level={5}>Adresses</Title>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              {profileData.addresses.map((address) => (
                <Card
                  key={address.id}
                  className="address-card"
                  title={
                    <Space>
                      <EnvironmentOutlined
                        style={{
                          color: address.is_default ? "#52c41a" : "#1890ff",
                        }}
                      />
                      <Text strong>{address.name}</Text>
                      {address.is_default && (
                        <Tag color="success">Par défaut</Tag>
                      )}
                    </Space>
                  }
                >
                  <div className="detail-item">
                    <Text>{address.street}</Text>
                  </div>
                  <div className="detail-item">
                    <Text>
                      {address.zip_code} {address.city}
                    </Text>
                  </div>
                </Card>
              ))}
            </Col>
            <Col span={12}>
              <div
                style={{ height: "300px", width: "100%", position: "relative" }}
              >
                <div className="map-container" ref={mapContainerRef} />
                {!mapLoaded && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: mode === "dark" ? "#1f1f1f" : "#f0f0f0",
                    }}
                  >
                    <Space>
                      <Spin />
                      <Text>Chargement de la carte...</Text>
                    </Space>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </>
      )}
    </Modal>
  );
};

export default MeetingModal;
