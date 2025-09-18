import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { MessageChat } from "../types/message";
import { useCallback, useEffect, useState } from "react";
import { fetchUserById } from "../services/customer/customerApi";
import {
  fetchClaimChannels,
  fetchNotificationHistory,
} from "../services/notification/notificationApi";
import { App } from "antd";

/**
 * Hook pour gérer les notifications de messages en utilisant le système Redux global
 */
export const useNotifications = () => {
  const { message } = App.useApp();
  const [claimChannels, setClaimChannels] = useState<number[]>([]);
  const [senders, setSenders] = useState<{ [key: string]: any }>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<
    number | null
  >(null);
  const [notificationHistory, setNotificationHistory] = useState<MessageChat[]>(
    [],
  );

  const adminId = import.meta.env.VITE_CURRENT_USER_ID;

  // Récupérer tous les derniers messages depuis Redux
  const lastMessagesByChannel = useSelector(
    (state: RootState) => state.messages.lastMessagesByChannel,
  );

  const connectionStatus = useSelector(
    (state: RootState) => state.messages.connectionStatus,
  );

  // Charger les canaux de réclamation et l'historique au démarrage
  useEffect(() => {
    const loadNotificationData = async () => {
      try {
        console.log("🔔 Chargement des données de notification");

        // Charger les canaux de réclamation
        const channelIds = await fetchClaimChannels();
        console.log("🔔 Canaux de réclamation chargés:", channelIds);
        setClaimChannels(channelIds);

        // Charger l'historique des notifications
        const history = await fetchNotificationHistory();
        console.log(
          "🔔 Historique des notifications chargé:",
          history.length,
          "messages",
        );
        setNotificationHistory(history);

        // Charger les informations des expéditeurs
        const senderIds = [...new Set(history.map((msg) => msg.sender_id))];
        const sendersData: { [key: string]: any } = {};

        for (const senderId of senderIds) {
          try {
            const sender = await fetchUserById(senderId);
            if (sender) {
              sendersData[senderId] = sender;
            }
          } catch (error) {
            console.error(
              `Erreur lors du chargement de l'expéditeur ${senderId}:`,
              error,
            );
          }
        }

        console.log("🔔 Expéditeurs chargés:", Object.keys(sendersData).length);
        setSenders(sendersData);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données de notification:",
          error,
        );
      }
    };

    loadNotificationData();
  }, []);

  // Surveiller les nouveaux messages et afficher les notifications
  useEffect(() => {
    if (!claimChannels.length || !lastMessagesByChannel) return;

    // Chercher le dernier message parmi tous les canaux de réclamation
    let latestMessage: MessageChat | null = null;
    let latestTimestamp = 0;

    Object.entries(lastMessagesByChannel).forEach(([channelId, message]) => {
      const channelIdNum = parseInt(channelId);

      // Vérifier si c'est un canal de réclamation et que le message existe
      if (
        claimChannels.includes(channelIdNum) &&
        message &&
        typeof message === "object"
      ) {
        const messageAsChat = message as MessageChat;
        const messageTimestamp = new Date(messageAsChat.created_at).getTime();

        if (messageTimestamp > latestTimestamp) {
          latestTimestamp = messageTimestamp;
          latestMessage = messageAsChat;
        }
      }
    });

    // Si on a un nouveau message qui n'a pas été traité
    if (
      latestMessage &&
      typeof latestMessage === "object" &&
      "sender_id" in latestMessage &&
      "id" in latestMessage &&
      (latestMessage as MessageChat).sender_id !== adminId &&
      (!lastProcessedMessageId ||
        (latestMessage as MessageChat).id > lastProcessedMessageId)
    ) {
      console.log(
        "🔔 Nouveau message détecté pour notification:",
        latestMessage,
      );

      // Marquer ce message comme traité
      setLastProcessedMessageId((latestMessage as MessageChat).id);

      // Ajouter le nouveau message à l'historique s'il n'y est pas déjà
      setNotificationHistory((prev: MessageChat[]) => {
        if (
          !latestMessage ||
          typeof latestMessage !== "object" ||
          !("id" in latestMessage)
        )
          return prev;
        const exists = prev.some(
          (msg) => msg.id === (latestMessage as MessageChat).id,
        );
        if (!exists) {
          return [latestMessage as MessageChat, ...prev];
        }
        return prev;
      });

      // Incrémenter le compteur
      setUnreadCount((prev) => prev + 1);

      // Charger les infos de l'expéditeur et afficher la notification
      showNotification(latestMessage as MessageChat);
    }
  }, [lastMessagesByChannel, claimChannels, adminId, lastProcessedMessageId]);

  // Fonction pour afficher une notification
  const showNotification = async (messageData: MessageChat) => {
    try {
      // Charger les infos de l'expéditeur si pas déjà en cache
      let sender = senders[messageData.sender_id];

      if (!sender) {
        console.log(
          "🔔 Chargement des infos de l'expéditeur:",
          messageData.sender_id,
        );
        sender = await fetchUserById(messageData.sender_id);

        if (sender) {
          setSenders((prev) => ({
            ...prev,
            [messageData.sender_id]: sender,
          }));
        }
      }

      // Afficher la notification
      message.warning({
        content: `Nouveau message de ${sender?.first_name || "Utilisateur"} ${sender?.last_name || ""} : ${messageData.message}`,
        duration: 5,
        style: {
          fontSize: "18px",
          marginTop: "50px",
        },
      });

      console.log("🔔 Notification affichée pour le message:", messageData.id);
    } catch (error) {
      console.error("Erreur lors de l'affichage de la notification:", error);
    }
  };

  // Fonction pour obtenir les notifications filtrées pour l'affichage
  const getFilteredNotifications = useCallback((): MessageChat[] => {
    if (!claimChannels.length) return [];

    // Filtrer l'historique par canaux de réclamation
    const filtered = notificationHistory.filter((notification) =>
      claimChannels.includes(notification.channel_id),
    );

    // Trier par date décroissante (plus récent en premier)
    return filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [notificationHistory, claimChannels]);

  // Fonction pour réinitialiser le compteur
  const resetUnreadCount = useCallback(() => {
    console.log("🔔 Réinitialisation du compteur de notifications non lues");
    setUnreadCount(0);
  }, []);

  // Fonction pour obtenir les infos d'un expéditeur
  const getSenderInfo = useCallback(
    (senderId: string) => {
      return senders[senderId] || null;
    },
    [senders],
  );

  return {
    notifications: getFilteredNotifications(),
    unreadCount,
    senders,
    claimChannels,
    connectionStatus,
    resetUnreadCount,
    getSenderInfo,
    isConnected: connectionStatus === "connected",
  };
};
