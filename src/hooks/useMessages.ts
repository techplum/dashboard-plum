import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import { MessageChat } from "../types/message";
import { setMessagesForChannel } from "../store/slices/messageSlice";
import { fetchMessagesByChannel } from "../services/chat/chatApi";
import { useCallback, useEffect } from "react";

/**
 * Hook pour accéder aux messages d'un canal spécifique depuis Redux
 */
export const useChannelMessages = (
  channelId: string | number | null | undefined,
) => {
  const dispatch = useDispatch();

  const channelIdString = channelId?.toString() || "";

  const messages = useSelector((state: RootState) =>
    channelIdString
      ? state.messages.messagesByChannel[channelIdString] || []
      : [],
  );

  const lastMessage = useSelector((state: RootState) =>
    channelIdString
      ? state.messages.lastMessagesByChannel[channelIdString]
      : null,
  );

  const connectionStatus = useSelector(
    (state: RootState) => state.messages.connectionStatus,
  );

  const loading = useSelector((state: RootState) => state.messages.loading);

  const error = useSelector((state: RootState) => state.messages.error);

  // Fonction pour charger les messages historiques d'un canal
  const loadChannelMessages = useCallback(async () => {
    if (!channelIdString) return;

    try {
      console.log(
        `📥 Chargement des messages historiques pour le canal ${channelIdString}`,
      );
      const messages = await fetchMessagesByChannel(channelIdString);
      dispatch(setMessagesForChannel({ channelId: channelIdString, messages }));
      console.log(
        `✅ ${messages.length} messages chargés pour le canal ${channelIdString}`,
      );
    } catch (error) {
      console.error(
        `❌ Erreur lors du chargement des messages pour le canal ${channelIdString}:`,
        error,
      );
    }
  }, [channelIdString, dispatch]);

  return {
    messages,
    lastMessage,
    connectionStatus,
    loading,
    error,
    loadChannelMessages,
    isConnected: connectionStatus === "connected",
  };
};

/**
 * Hook pour accéder aux derniers messages de tous les canaux
 */
export const useLastMessages = () => {
  const lastMessagesByChannel = useSelector(
    (state: RootState) => state.messages.lastMessagesByChannel,
  );

  const connectionStatus = useSelector(
    (state: RootState) => state.messages.connectionStatus,
  );

  // Fonction utilitaire pour obtenir le dernier message d'un canal
  const getLastMessageForChannel = useCallback(
    (channelId: string | number | null | undefined) => {
      if (!channelId) return null;
      return lastMessagesByChannel[channelId.toString()] || null;
    },
    [lastMessagesByChannel],
  );

  // Fonction utilitaire pour formater le temps du dernier message
  const formatLastMessageTime = useCallback((message: MessageChat | null) => {
    if (!message) return "";

    const now = new Date();
    const messageDate = new Date(message.created_at);
    const diffInMinutes = Math.floor(
      (now.getTime() - messageDate.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440)
      return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  }, []);

  return {
    lastMessagesByChannel,
    connectionStatus,
    getLastMessageForChannel,
    formatLastMessageTime,
    isConnected: connectionStatus === "connected",
  };
};

/**
 * Hook pour surveiller le statut de connexion global
 */
export const useGlobalMessageConnection = () => {
  const connectionStatus = useSelector(
    (state: RootState) => state.messages.connectionStatus,
  );

  const error = useSelector((state: RootState) => state.messages.error);

  return {
    connectionStatus,
    error,
    isConnected: connectionStatus === "connected",
    isConnecting: connectionStatus === "connecting",
    isDisconnected: connectionStatus === "disconnected",
    hasError: connectionStatus === "error",
  };
};
