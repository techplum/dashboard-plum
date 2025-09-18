import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MessageChat } from "../../types/message";

interface MessageState {
  messagesByChannel: { [channelId: string]: MessageChat[] };
  lastMessagesByChannel: { [channelId: string]: MessageChat };
  loading: boolean;
  error: string | null;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
}

const initialState: MessageState = {
  messagesByChannel: {},
  lastMessagesByChannel: {},
  loading: false,
  error: null,
  connectionStatus: "disconnected",
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    // Ajouter un nouveau message à un canal spécifique
    addMessage: (state, action: PayloadAction<MessageChat>) => {
      const message = action.payload;
      const channelId = message.channel_id.toString();

      if (!state.messagesByChannel[channelId]) {
        state.messagesByChannel[channelId] = [];
      }

      // Éviter les doublons
      const exists = state.messagesByChannel[channelId].some(
        (msg) => msg.id === message.id,
      );
      if (!exists) {
        state.messagesByChannel[channelId].push(message);
        state.lastMessagesByChannel[channelId] = message;
      }
    },

    // Mettre à jour un message existant
    updateMessage: (state, action: PayloadAction<MessageChat>) => {
      const message = action.payload;
      const channelId = message.channel_id.toString();

      if (state.messagesByChannel[channelId]) {
        const index = state.messagesByChannel[channelId].findIndex(
          (msg) => msg.id === message.id,
        );
        if (index !== -1) {
          state.messagesByChannel[channelId][index] = message;

          // Mettre à jour le dernier message si c'est le plus récent
          if (state.lastMessagesByChannel[channelId]?.id === message.id) {
            state.lastMessagesByChannel[channelId] = message;
          }
        }
      }
    },

    // Supprimer un message
    deleteMessage: (
      state,
      action: PayloadAction<{ id: number; channelId: string }>,
    ) => {
      const { id, channelId } = action.payload;

      if (state.messagesByChannel[channelId]) {
        state.messagesByChannel[channelId] = state.messagesByChannel[
          channelId
        ].filter((msg) => msg.id !== id);

        // Recalculer le dernier message si nécessaire
        if (state.lastMessagesByChannel[channelId]?.id === id) {
          const messages = state.messagesByChannel[channelId];
          state.lastMessagesByChannel[channelId] =
            messages.length > 0
              ? messages[messages.length - 1]
              : (undefined as any);
        }
      }
    },

    // Définir tous les messages pour un canal
    setMessagesForChannel: (
      state,
      action: PayloadAction<{ channelId: string; messages: MessageChat[] }>,
    ) => {
      const { channelId, messages } = action.payload;
      state.messagesByChannel[channelId] = messages.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      if (messages.length > 0) {
        state.lastMessagesByChannel[channelId] = messages[messages.length - 1];
      }
    },

    // Effacer les messages d'un canal
    clearChannelMessages: (state, action: PayloadAction<string>) => {
      const channelId = action.payload;
      delete state.messagesByChannel[channelId];
      delete state.lastMessagesByChannel[channelId];
    },

    // Définir le statut de connexion
    setConnectionStatus: (
      state,
      action: PayloadAction<MessageState["connectionStatus"]>,
    ) => {
      state.connectionStatus = action.payload;
    },

    // Définir l'état de chargement
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Définir une erreur
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Réinitialiser l'état
    resetMessages: (state) => {
      state.messagesByChannel = {};
      state.lastMessagesByChannel = {};
      state.loading = false;
      state.error = null;
      state.connectionStatus = "disconnected";
    },
  },
});

export const {
  addMessage,
  updateMessage,
  deleteMessage,
  setMessagesForChannel,
  clearChannelMessages,
  setConnectionStatus,
  setLoading,
  setError,
  resetMessages,
} = messageSlice.actions;

export default messageSlice.reducer;
