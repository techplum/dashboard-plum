import React, { useEffect } from "react";
import { Avatar, Badge, Dropdown, List, App } from "antd";
import { BellOutlined, UserOutlined } from "@ant-design/icons";
import { supabaseClient } from "../../utility/supabaseClient";
import { MessageChat } from "../../types/message";
import "../../styles/notificationBell.css";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";

interface NotificationBellProps {
  mode: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ mode }) => {
  const supabase_url_storage_images = import.meta.env
    .VITE_SUPABASE_STORAGE_URL_FOR_IMAGES;
  const { message } = App.useApp();
  const navigate = useNavigate();

  // Utiliser le nouveau hook pour les notifications
  const {
    notifications,
    unreadCount,
    connectionStatus,
    resetUnreadCount,
    getSenderInfo,
  } = useNotifications();

  // Plus besoin d'useEffect complexe, tout est géré par le hook useNotifications
  useEffect(() => {
    console.log("🔔 NotificationBell: Statut de connexion:", connectionStatus);
    console.log("🔔 NotificationBell: Nombre de notifications:", notifications.length);
    console.log("🔔 NotificationBell: Messages non lus:", unreadCount);
  }, [connectionStatus, notifications.length, unreadCount]);

  // Les notifications sont déjà filtrées dans le hook
  const filteredNotifications = notifications;

  // Fonction pour naviguer vers le chat de réclamation
  const handleNotificationItemClick = async (notification: MessageChat) => {
    try {
      // Récupérer les informations de la réclamation basées sur le channel_id
      const { data: claimData, error } = await supabaseClient
        .from("claim")
        .select("claim_id, claim_slug, order_id")
        .eq("channel_id", notification.channel_id)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error(
          "Erreur lors de la récupération de la réclamation:",
          error,
        );
        message.error("Impossible de naviguer vers la réclamation");
        return;
      }

      if (claimData) {
        // Naviguer vers la page de réclamation avec l'ID
        navigate(`/claim/${claimData.claim_id}`);
        resetUnreadCount();
      } else {
        message.warning("Réclamation non trouvée ou inactive");
      }
    } catch (error) {
      console.error("Erreur lors de la navigation:", error);
      message.error("Erreur lors de la navigation");
    }
  };

  const handleNotificationClick = () => {
    console.log(
      "🔔 Notification cliquée, réinitialisation du compteur de non-lus",
    );
    resetUnreadCount();
  };

  const getThemeColors = () => ({
    backgroundColor: mode === "dark" ? "#1f1f1f" : "white",
    textColor: mode === "dark" ? "#ffffff" : "#1f1f1f",
    borderColor: mode === "dark" ? "#303030" : "#e0e0e0",
    secondaryTextColor: mode === "dark" ? "#a0a0a0" : "gray",
  });

  const colors = getThemeColors();



  const notificationList = (
    <List
      style={{
        width: 300,
        maxHeight: 400,
        overflow: "auto",
        backgroundColor: colors.backgroundColor,
        borderRadius: "10px",
        boxShadow:
          mode === "dark"
            ? "0 2px 8px rgba(255,255,255,0.1)"
            : "0 2px 8px rgba(0,0,0,0.1)",
      }}
      dataSource={filteredNotifications}
      renderItem={(item) => (
        <List.Item
          style={{
            border: `1px solid ${colors.borderColor}`,
            borderRadius: "10px",
            marginBottom: "1px",
            backgroundColor: colors.backgroundColor,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onClick={() => handleNotificationItemClick(item)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              mode === "dark" ? "#2a2a2a" : "#f5f5f5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.backgroundColor;
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "12px",
              color: colors.secondaryTextColor,
              marginLeft: "20px",
            }}
          >
            <Avatar
              src={
                getSenderInfo(item.sender_id)?.avatar
                  ? `${supabase_url_storage_images}/${getSenderInfo(item.sender_id).avatar}`
                  : undefined
              }
              icon={
                !getSenderInfo(item.sender_id)?.avatar ? <UserOutlined /> : undefined
              }
              style={{ marginRight: "10px" }}
            />

            <div
              style={{
                marginLeft: "40px",
                color: colors.textColor,
              }}
            >
              <div style={{ color: colors.textColor }}>
                {getSenderInfo(item.sender_id)
                  ? `${getSenderInfo(item.sender_id).first_name} ${getSenderInfo(item.sender_id).last_name}`
                  : "Utilisateur inconnu"}
              </div>
              <p style={{ color: colors.secondaryTextColor }}>{item.message}</p>
              <p style={{ color: colors.secondaryTextColor, fontSize: "11px" }}>
                {getTimeDifference(item.created_at)}
              </p>
            </div>
          </div>
        </List.Item>
      )}
    />
  );

  return (
    <Dropdown
      menu={{
        items: [
          {
            key: "1",
            label: notificationList,
          },
        ],
      }}
      trigger={["click"]}
      onOpenChange={handleNotificationClick}
    >
      <Badge count={unreadCount} style={{ cursor: "pointer" }}>
        <BellOutlined
          style={{
            fontSize: "20px",
            color: mode === "dark" ? "#fff" : "#1f1f1f",
          }}
        />
      </Badge>
    </Dropdown>
  );
};

const getTimeDifference = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `il y a ${days} jour${days > 1 ? "s" : ""}`;
  if (hours > 0) return `il y a ${hours} heure${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
  return "à l'instant";
};

export default NotificationBell;
