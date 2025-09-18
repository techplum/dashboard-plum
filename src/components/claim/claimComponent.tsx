import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import {
  Avatar,
  Typography,
  Space,
  Spin,
  List,
  Select,
  Input,
  Tag,
  message,
  Button,
  Empty,
  Badge,
  Tooltip,
  Divider,
  Row,
  Col,
  notification,
} from "antd";
import { MessageChat } from "../../types/message";
import "../../styles/chat.css";
import "../../styles/ClaimList.css";
import ChatUIComponent from "../chat/ChatUIComponent";
import { ColorModeContext } from "../../contexts/color-mode";
import { sendMessageToChannel } from "../../services/chat/kiplynkChatApi";
import { updateClaimStatus as updateClaimStatusAction } from "../../store/slices/claimSlice";
import { useDispatch, useSelector } from "react-redux";
import { setClaims } from "../../store/slices/claimSlice";
import { RootState } from "../../store/store";
import { updateClaimStatus as updateClaimStatusApi } from "../../services/claims/claimApi";
import { useChannelMessages, useLastMessages, useGlobalMessageConnection } from "../../hooks/useMessages";
import {
  SearchOutlined,
  FilterOutlined,
  MessageOutlined,
  UserOutlined,
  CommentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  SendOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const { Text, Title, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ClaimComponentProps {
  claims: any[];
  messages: MessageChat[];
  selectedClaimId?: string;
  onClaimSelect?: (claimId: string) => void;
  onBackToList?: () => void;
}

// Interfaces supprimées car gérées par Redux

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN_UNPROCESSED":
      return "#ea4335"; // Rouge
    case "OPEN_IN_PROGRESS":
      return "#1a73e8"; // Bleu
    case "RESOLVED":
      return "#34a853"; // Vert
    case "PENDING_RESPONSE":
      return "#fbbc04"; // Jaune
    default:
      return "#9aa0a6"; // Gris
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "OPEN_UNPROCESSED":
      return <ExclamationCircleOutlined />;
    case "OPEN_IN_PROGRESS":
      return <ClockCircleOutlined />;
    case "RESOLVED":
      return <CheckCircleOutlined />;
    case "PENDING_RESPONSE":
      return <CommentOutlined />;
    default:
      return <InboxOutlined />;
  }
};

const getStatusTranslation = (status: string) => {
  switch (status) {
    case "OPEN_UNPROCESSED":
      return "Non traité";
    case "OPEN_IN_PROGRESS":
      return "En cours";
    case "RESOLVED":
      return "Résolu";
    case "PENDING_RESPONSE":
      return "En attente";
    default:
      return status;
  }
};

const ClaimComponent: React.FC<ClaimComponentProps> = ({
  claims: initialClaims,
  messages: initialMessages,
  selectedClaimId,
  onClaimSelect,
  onBackToList,
}) => {
  const { mode } = useContext(ColorModeContext);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const supabase_url_storage_images =
    import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES || "";
  const cloudflare_url_storage_images =
    import.meta.env.VITE_CLOUDFLARE_STORAGE_URL_FOR_IMAGES || "";
  const adminId = import.meta.env.VITE_CURRENT_USER_ID;
  const dispatch = useDispatch();
  const claimsFromRedux = useSelector(
    (state: RootState) => state.claims.claims,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [api, contextHolder] = notification.useNotification();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);
  const [claims, setClaims] = useState<any[]>(initialClaims);

  // Nouveaux hooks pour la gestion des messages via Redux
  const { 
    messages: channelMessages, 
    loadChannelMessages,
    isConnected: isMessageManagerConnected 
  } = useChannelMessages(selectedClaim?.channel_id);
  
  const { 
    lastMessagesByChannel, 
    getLastMessageForChannel, 
    formatLastMessageTime,
    isConnected: isGlobalConnected 
  } = useLastMessages();
  
  const { 
    connectionStatus, 
    error: connectionError 
  } = useGlobalMessageConnection();

  // Plus besoin de debounce car la gestion est centralisée dans Redux

  const containerStyle = {
    backgroundColor: mode === "dark" ? "#141414" : "#f8f9fa",
    color: mode === "dark" ? "#e8eaed" : "#202124",
  };

  const getCustomerInfo = (claim: any) => ({
    first_name: claim.public_profile?.first_name || "",
    last_name: claim.public_profile?.last_name || "",
    avatar: claim.public_profile?.avatar || "",
  });

  // Fonction pour obtenir le timestamp du dernier message d'un claim (nouvelle version Redux)
  const getLastMessageTimestamp = (claim: any): string => {
    if (!claim.channel_id) return claim.created_at; // Fallback sur la date de création du claim

    const lastMessage = getLastMessageForChannel(claim.channel_id);
    if (lastMessage) {
      return lastMessage.created_at; // Utiliser le timestamp du dernier message
    }

    return claim.created_at; // Fallback
  };

  // Fonction pour trier les claims par dernier message
  const getSortedClaims = () => {
    const filteredClaims = getFilteredClaims();

    return filteredClaims.sort((a, b) => {
      const timestampA = getLastMessageTimestamp(a);
      const timestampB = getLastMessageTimestamp(b);

      // Trier par ordre décroissant (plus récent en premier)
      return new Date(timestampB).getTime() - new Date(timestampA).getTime();
    });
  };

  // Plus besoin d'updateLastMessages car c'est géré par Redux automatiquement
  
  const getMessagesByChannelId = (channelId: number) => {
    if (!channelId) return [];
    // Utiliser les messages du canal sélectionné depuis Redux
    return selectedClaim?.channel_id === channelId ? channelMessages : [];
  };

  const handleSendMessageInClaimComponent = async (message: string) => {
    if (!selectedClaim) {
      console.error("Aucune réclamation sélectionnée");
      return;
    }

    if (!selectedClaim.channel_id || !selectedClaim.user_id) {
      console.error("Données de réclamation invalides:", selectedClaim);
      console.error("Données de réclamation invalides");
      return;
    }

    try {
      const sentMessage = await sendMessageToChannel(
        selectedClaim.channel_id,
        message,
        selectedClaim.user_id,
      );
    } catch (error: any) {
      console.error("Erreur détaillée:", error);
      console.error(`Erreur lors de l'envoi: ${error.message}`);
    }
  };

  useEffect(() => {
    if (initialClaims && initialClaims.length > 0) {
      console.log("⚡ Mise à jour des réclamations depuis les props");
      setClaims(initialClaims);
    }
  }, [initialClaims]);

  // Plus besoin de useEffect pour updateLastMessages car c'est géré automatiquement par Redux

  useEffect(() => {
    // Charger les messages historiques quand une réclamation est sélectionnée
    if (selectedClaim && selectedClaim.channel_id) {
      console.log(`📥 Chargement des messages pour le canal ${selectedClaim.channel_id}`);
      loadChannelMessages();

      // Faire défiler vers le bas après un petit délai
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedClaim, loadChannelMessages]); // Charger les messages quand selectedClaim change

  // Plus besoin de nettoyage manuel des canaux car la gestion est centralisée

  // Sélectionner automatiquement la réclamation basée sur l'URL
  useEffect(() => {
    console.log('🔍 Sélection automatique - selectedClaimId:', selectedClaimId, 'claims.length:', claims.length);
    
    if (selectedClaimId && claims.length > 0) {
      // Chercher par claim_id (utilisé dans l'URL) ou par id
      const claim = claims.find(c => 
        c.claim_id?.toString() === selectedClaimId || 
        c.id?.toString() === selectedClaimId
      );
      
      console.log('🔍 Réclamation trouvée:', claim);
      
      if (claim) {
        console.log('✅ Sélection automatique de la réclamation:', claim.claim_id || claim.id);
        setSelectedClaim(claim);
        if (isMobile) {
          setIsChatVisible(true);
        }
      } else {
        console.log('❌ Aucune réclamation trouvée pour ID:', selectedClaimId);
        console.log('🔍 Claims disponibles:', claims.map(c => ({ id: c.id, claim_id: c.claim_id })));
      }
    }
  }, [selectedClaimId, claims]);

  const handleStatusChange = async (claimId: string, newStatus: string) => {
    try {
      // S'assurer que nous avons le claim_id correct
      const actualClaimId = claimId;
      console.log("🚀 Mise à jour du statut - Détails:", {
        claimId: actualClaimId,
        newStatus,
        selectedClaim: selectedClaim
          ? {
              id: selectedClaim.id,
              claim_id: selectedClaim.claim_id,
              status: selectedClaim.status,
            }
          : null,
      });

      // 1. Mettre à jour dans l'API
      await updateClaimStatusApi(BigInt(actualClaimId), newStatus);
      console.log("✅ API mise à jour avec succès");

      // 2. Mettre à jour dans Redux
      dispatch(updateClaimStatusAction({ claimId: actualClaimId, newStatus }));
      console.log("✅ Redux mis à jour");

      // 3. Mettre à jour la réclamation sélectionnée (UI locale)
      if (
        selectedClaim &&
        (selectedClaim.id === actualClaimId ||
          selectedClaim.claim_id === actualClaimId ||
          selectedClaim.claim_id?.toString() === actualClaimId)
      ) {
        const updatedSelectedClaim = {
          ...selectedClaim,
          status: newStatus,
        };
        setSelectedClaim(updatedSelectedClaim);
        console.log(
          "✅ Réclamation sélectionnée mise à jour:",
          updatedSelectedClaim,
        );
      }

      // 4. Mettre à jour la liste des réclamations pour refléter le changement immédiatement en UI
      const updatedClaimsArray = claims.map((claim) => {
        if (
          (claim.claim_id && claim.claim_id.toString() === actualClaimId) ||
          (claim.id && claim.id.toString() === actualClaimId)
        ) {
          console.log(
            "✅ Réclamation trouvée dans la liste et mise à jour:",
            claim.claim_id || claim.id,
          );
          return { ...claim, status: newStatus };
        }
        return claim;
      });

      // Mettre à jour le state local
      setClaims(updatedClaimsArray);
      console.log("✅ State local des réclamations mis à jour");

      // Forcer une mise à jour de la liste des réclamations dans Redux
      try {
        dispatch(setClaims(updatedClaimsArray) as any);
        console.log("✅ Liste des réclamations mise à jour dans Redux");
      } catch (error) {
        console.error(
          "❌ Erreur lors de la mise à jour du store Redux:",
          error,
        );
      }

      // 5. Notification de succès
      api.success({
        message: "Statut mis à jour",
        description: `Le statut a été changé en "${getStatusTranslation(newStatus)}" avec succès`,
        icon: <CheckOutlined style={{ color: "#34a853" }} />,
        placement: "topRight",
        duration: 3,
      });
      console.log("✅ Notification de succès affichée");
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du statut:", error);

      // Notification d'erreur
      api.error({
        message: "Erreur",
        description:
          "Impossible de mettre à jour le statut de la réclamation dans la base de données",
        placement: "topRight",
        duration: 4,
      });
    }
  };

  const getFilteredClaims = () => {
    return claims.filter((claim) => {
      // console.log('😍😍😍😍😍😍😍😍😍😍😍😍😍😍');
      // console.log('claim', claim);
      // console.log('searchText', searchText);
      // console.log('😍😍😍😍😍😍😍😍😍😍😍😍😍😍');
      const matchesSearch = searchText
        ? claim.order_id.toString().includes(searchText) ||
          (claim.public_profile?.first_name || "")
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (claim.public_profile?.last_name || "")
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (claim.content || "").toLowerCase().includes(searchText.toLowerCase())
        : true;

      const matchesStatus = statusFilter ? claim.status === statusFilter : true;

      return matchesSearch && matchesStatus;
    });
  };

  const getStatusTag = (status: string) => {
    return (
      <Tag color={getStatusColor(status)}>
        {getStatusIcon(status)} {getStatusTranslation(status)}
      </Tag>
    );
  };

  useEffect(() => {
    if (selectedClaim?.public_profile?.avatar) {
      console.log(
        `Chemin de l'avatar selectedClaim: ${
          selectedClaim.public_profile.avatar && cloudflare_url_storage_images
            ? `${cloudflare_url_storage_images}${selectedClaim.public_profile.avatar.startsWith("/") ? "" : "/"}${selectedClaim.public_profile.avatar}`
            : "Aucun avatar"
        }`,
      );
    }
  }, [selectedClaim, cloudflare_url_storage_images]);

  useEffect(() => {
    if (!cloudflare_url_storage_images) {
      console.warn("VITE_CLOUDFLARE_STORAGE_URL_FOR_IMAGES n'est pas défini");
    }
  }, [cloudflare_url_storage_images]);

  // Vérification si l'écran est en mode mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Vérification initiale
    checkIfMobile();

    // Ajouter l'écouteur d'événement pour le redimensionnement
    window.addEventListener("resize", checkIfMobile);

    // Nettoyage
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Fonction pour gérer le retour à la liste en mode mobile
  const handleBackToList = () => {
    if (isMobile) {
      setIsChatVisible(false);
    }
    
    // Utiliser la navigation si disponible
    if (onBackToList) {
      onBackToList();
    }
  };

  // Fonction pour gérer la sélection d'une réclamation
  const handleClaimSelection = (claim: any) => {
    console.log('🔍 Sélection manuelle de la réclamation:', claim);
    setSelectedClaim(claim);
    if (isMobile) {
      setIsChatVisible(true);
    }
    
    // Utiliser la navigation si disponible
    if (onClaimSelect) {
      const claimId = claim.claim_id?.toString() || claim.id?.toString();
      console.log('🧭 Navigation vers claim ID:', claimId);
      onClaimSelect(claimId);
    }
  };

  return (
    <div
      className={`claims-chat-container ${isMobile && isChatVisible ? "mobile-chat-visible" : ""}`}
      style={containerStyle}
    >
      {contextHolder}
      <div
        className="claims-list"
        style={{ backgroundColor: mode === "dark" ? "#1f1f1f" : "#fff" }}
      >
        <div
          className="claims-search-filter"
          style={{
            backgroundColor: mode === "dark" ? "#1f1f1f" : "#fff",
            position: "sticky",
            top: 0,
            zIndex: 100,
            padding: "1rem 0",
          }}
        >
          <Title
            level={4}
            style={{ color: mode === "dark" ? "#e8eaed" : "#202124" }}
          >
            Réclamations
          </Title>

          <Space
            direction="vertical"
            style={{ width: "100%", marginBottom: "1rem" }}
          >
            <Search
              placeholder="Rechercher une réclamation..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%" }}
              prefix={<SearchOutlined />}
              allowClear
            />

            <Select
              placeholder="Filtrer par statut"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
              allowClear
              suffixIcon={<FilterOutlined />}
            >
              <Option value="OPEN_UNPROCESSED">Non traité</Option>
              <Option value="OPEN_IN_PROGRESS">En cours</Option>
              <Option value="PENDING_RESPONSE">En attente</Option>
              <Option value="RESOLVED">Résolu</Option>
            </Select>
          </Space>

          <Divider
            style={{
              margin: "0.5rem 0 1rem",
              borderColor: mode === "dark" ? "#303030" : "#e0e0e0",
            }}
          />
        </div>

        {connectionStatus === 'connecting' ? (
          <div style={{ padding: "1rem", textAlign: "center" }}>
            <Spin tip="Connexion au système de messages..." />
          </div>
        ) : getFilteredClaims().length === 0 ? (
          <Empty
            description={
              <Text style={{ color: mode === "dark" ? "#e8eaed" : "#202124" }}>
                Aucune réclamation trouvée
              </Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: "2rem 0" }}
          />
        ) : (
          <div className="claims-list-container">
            <List
              key={`claims-status-${Date.now()}`}
              dataSource={getSortedClaims()}
              renderItem={(claim) => {
                const customerInfo = getCustomerInfo(claim);
                const isSelected =
                  selectedClaim && selectedClaim.id === claim.id;
                const claimKey = claim.channel_id || claim.id;
                const lastMessage = getLastMessageForChannel(claim.channel_id);
                const lastMessageInfo = lastMessage ? {
                  message: lastMessage.message,
                  time: formatLastMessageTime(lastMessage),
                } : {
                  message: "",
                  time: "",
                };

                return (
                  <div
                    className={`claim-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleClaimSelection(claim)}
                    style={{
                      backgroundColor:
                        mode === "dark"
                          ? isSelected
                            ? "rgba(26, 115, 232, 0.15)"
                            : "#242424"
                          : isSelected
                            ? "rgba(26, 115, 232, 0.08)"
                            : "#fff",
                      borderColor: mode === "dark" ? "#303030" : "#e0e0e0",
                      borderWidth: isSelected ? "2px" : "1px",
                    }}
                  >
                    <div style={{ display: "flex", width: "100%" }}>
                      <div className="claim-avatar">
                        <Badge
                          dot
                          color={getStatusColor(claim.status)}
                          offset={[-4, 36]}
                        >
                          <Avatar
                            src={
                              customerInfo.avatar &&
                              cloudflare_url_storage_images
                                ? `${cloudflare_url_storage_images}${customerInfo.avatar.startsWith("/") ? "" : "/"}${customerInfo.avatar}`
                                : null
                            }
                            icon={!customerInfo.avatar && <UserOutlined />}
                            size={40}
                            style={{
                              backgroundColor: !customerInfo.avatar
                                ? mode === "dark"
                                  ? "#303030"
                                  : "#f0f0f0"
                                : undefined,
                            }}
                          />
                          {/* {console.log(`Chemin de l'avatar customerInfo: ${customerInfo.avatar ? `${cloudflare_url_storage_images}/${customerInfo.avatar}` : 'Aucun avatar'}`)} */}
                          {/* {console.log(`avatar: ${customerInfo.avatar}`);} */}
                          {/* console.log( src={customerInfo.avatar ? `${cloudflare_url_storage_images}${customerInfo.avatar}` : null}) */}
                        </Badge>
                      </div>

                      <div className="claim-content">
                        <div className="claim-header">
                          <span
                            className="claim-name"
                            style={{
                              color: mode === "dark" ? "#e8eaed" : "#202124",
                            }}
                          >
                            {customerInfo.first_name} {customerInfo.last_name}
                          </span>

                          <div className="claim-meta">
                            <span
                              className="claim-time"
                              style={{
                                color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                              }}
                            >
                              {lastMessageInfo.time || ""}
                            </span>

                            <Tooltip title={getStatusTranslation(claim.status)}>
                              <Tag
                                color={getStatusColor(claim.status)}
                                style={{ marginLeft: "0.5rem" }}
                              >
                                {getStatusIcon(claim.status)}{" "}
                                {getStatusTranslation(claim.status)}
                              </Tag>
                            </Tooltip>
                          </div>
                        </div>

                        <div
                          className="last-message"
                          style={{
                            color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                          }}
                        >
                          {lastMessageInfo.message || ""}
                        </div>

                        {claim.order_id && (
                          <Text
                            type="secondary"
                            style={{
                              fontSize: "0.75rem",
                              marginTop: "0.25rem",
                              color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                            }}
                          >
                            Order ID: {claim.order_id}
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}
      </div>

      <div
        className="chat-container"
        style={{ backgroundColor: mode === "dark" ? "#1f1f1f" : "#fff" }}
      >
        {selectedClaim ? (
          <>
            <div
              className="chat-header"
              style={{
                backgroundColor: mode === "dark" ? "#242424" : "#fff",
                borderColor: mode === "dark" ? "#303030" : "#e0e0e0",
              }}
            >
              {isMobile && (
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToList}
                  className="back-button"
                  style={{ color: mode === "dark" ? "#e8eaed" : "#202124" }}
                />
              )}
              <div className="chat-header-info">
                <Avatar
                  src={
                    selectedClaim?.public_profile?.avatar &&
                    cloudflare_url_storage_images
                      ? `${cloudflare_url_storage_images}${selectedClaim.public_profile.avatar.startsWith("/") ? "" : "/"}${selectedClaim.public_profile.avatar}`
                      : null
                  }
                  icon={
                    !selectedClaim?.public_profile?.avatar && <UserOutlined />
                  }
                  size={isMobile ? 36 : 40}
                  style={{
                    marginRight: "1rem",
                    backgroundColor: !selectedClaim?.public_profile?.avatar
                      ? mode === "dark"
                        ? "#303030"
                        : "#f0f0f0"
                      : undefined,
                  }}
                />
                <div>
                  <Title
                    level={5}
                    style={{
                      margin: 0,
                      color: mode === "dark" ? "#e8eaed" : "#202124",
                    }}
                  >
                    {selectedClaim.public_profile?.first_name}{" "}
                    {selectedClaim.public_profile?.last_name}
                  </Title>

                  <Space
                    align="center"
                    size={4}
                    wrap={isMobile}
                    style={{ fontSize: isMobile ? "0.75rem" : "inherit" }}
                  >
                    <Text
                      type="secondary"
                      style={{ color: mode === "dark" ? "#9aa0a6" : "#5f6368" }}
                    >
                      #{selectedClaim.id}
                    </Text>

                    {!isMobile && selectedClaim.order_id && (
                      <>
                        <Divider
                          type="vertical"
                          style={{
                            borderColor:
                              mode === "dark" ? "#303030" : "#e0e0e0",
                          }}
                        />
                        <Text
                          type="secondary"
                          style={{
                            color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                          }}
                        >
                          Order ID: {selectedClaim.order_id}
                        </Text>
                      </>
                    )}

                    {!isMobile && selectedClaim.claim_id && (
                      <>
                        <Divider
                          type="vertical"
                          style={{
                            borderColor:
                              mode === "dark" ? "#303030" : "#e0e0e0",
                          }}
                        />
                        <Text
                          type="secondary"
                          style={{
                            color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                          }}
                        >
                          Claim ID: {selectedClaim.claim_id}
                        </Text>
                      </>
                    )}
                  </Space>
                </div>
              </div>

              <Space>
                <Select
                  value={selectedClaim.status}
                  onChange={(value) =>
                    handleStatusChange(
                      selectedClaim.claim_id
                        ? selectedClaim.claim_id.toString()
                        : selectedClaim.id,
                      value,
                    )
                  }
                  style={{ width: isMobile ? "120px" : "180px" }}
                  dropdownStyle={{
                    backgroundColor: mode === "dark" ? "#242424" : "#fff",
                  }}
                  size={isMobile ? "small" : "middle"}
                >
                  <Option value="OPEN_UNPROCESSED">
                    <ExclamationCircleOutlined
                      style={{ marginRight: "8px", color: "#ea4335" }}
                    />
                    Non traité
                  </Option>
                  <Option value="OPEN_IN_PROGRESS">
                    <ClockCircleOutlined
                      style={{ marginRight: "8px", color: "#1a73e8" }}
                    />
                    En cours
                  </Option>
                  <Option value="PENDING_RESPONSE">
                    <CommentOutlined
                      style={{ marginRight: "8px", color: "#fbbc04" }}
                    />
                    En attente
                  </Option>
                  <Option value="RESOLVED">
                    <CheckCircleOutlined
                      style={{ marginRight: "8px", color: "#34a853" }}
                    />
                    Résolu
                  </Option>
                </Select>

                {!isMobile && (
                  <>
                    <Tooltip title="Réduire">
                      <Button type="text" icon={<EyeInvisibleOutlined />} />
                    </Tooltip>

                    <Tooltip title="Fermer">
                      <Button
                        danger
                        type="text"
                        icon={<CloseCircleOutlined />}
                      />
                    </Tooltip>
                  </>
                )}
              </Space>
            </div>

            {selectedClaim.channel_id ? (
              <ChatUIComponent
                messages={getMessagesByChannelId(selectedClaim.channel_id)}
                onSendMessage={handleSendMessageInClaimComponent}
                messagesEndRef={messagesEndRef}
                darkMode={mode === "dark"}
              />
            ) : (
              <div className="empty-state">
                <ExclamationCircleOutlined
                  className="empty-state-icon"
                  style={{ color: mode === "dark" ? "#9aa0a6" : "#5f6368" }}
                />
                <Title
                  level={4}
                  style={{ color: mode === "dark" ? "#e8eaed" : "#202124" }}
                >
                  Aucun canal de discussion
                </Title>
                <Text
                  style={{ color: mode === "dark" ? "#9aa0a6" : "#5f6368" }}
                >
                  Cette réclamation n'a pas de canal de discussion actif
                </Text>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <MessageOutlined
              className="empty-state-icon"
              style={{ color: mode === "dark" ? "#9aa0a6" : "#5f6368" }}
            />
            <Title
              level={4}
              style={{ color: mode === "dark" ? "#e8eaed" : "#202124" }}
            >
              Aucune réclamation sélectionnée
            </Title>
            <Text style={{ color: mode === "dark" ? "#9aa0a6" : "#5f6368" }}>
              Sélectionnez une réclamation dans la liste pour voir les détails
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimComponent;
