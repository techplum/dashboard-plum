import { MessageChat } from "../../types/message";
import { supabaseClient } from "../../utility";
import { RealtimeChannel } from "@supabase/supabase-js";

// Gestionnaire centralisé des canaux de chat
class ChatChannelManager {
  private static instance: ChatChannelManager;
  private channels: Map<string, RealtimeChannel> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;
  private retryDelay = 3000;

  static getInstance(): ChatChannelManager {
    if (!ChatChannelManager.instance) {
      ChatChannelManager.instance = new ChatChannelManager();
    }
    return ChatChannelManager.instance;
  }

  private generateChannelName(channelId: string): string {
    return `chat_${channelId}_${Date.now()}`;
  }

  private async retryConnection(
    channelName: string,
    channelId: string,
    onMessage: (message: MessageChat) => void,
    setChatMessages: React.Dispatch<React.SetStateAction<MessageChat[]>>,
    onError?: (error: any) => void,
  ): Promise<RealtimeChannel | null> {
    const attempts = this.retryAttempts.get(channelName) || 0;

    if (attempts >= this.maxRetries) {
      console.error(
        `❌ Échec de connexion après ${this.maxRetries} tentatives pour ${channelName}`,
      );
      onError?.("Échec de connexion après plusieurs tentatives");
      return null;
    }

    console.log(
      `🔄 Tentative de reconnexion ${attempts + 1}/${this.maxRetries} pour ${channelName}`,
    );
    this.retryAttempts.set(channelName, attempts + 1);

    // Attendre avant de réessayer avec backoff exponentiel
    await new Promise((resolve) =>
      setTimeout(resolve, this.retryDelay * Math.pow(2, attempts)),
    );

    return this.createChannel(channelId, onMessage, setChatMessages, onError);
  }

  private createChannel(
    channelId: string,
    onMessage: (message: MessageChat) => void,
    setChatMessages: React.Dispatch<React.SetStateAction<MessageChat[]>>,
    onError?: (error: any) => void,
  ): RealtimeChannel {
    const channelName = this.generateChannelName(channelId);

    // Nettoyer l'ancien canal s'il existe
    const existingChannel = this.channels.get(channelName);
    if (existingChannel) {
      console.log("🧹 Suppression du canal existant:", channelName);
      supabaseClient.removeChannel(existingChannel);
      this.channels.delete(channelName);
    }

    const channel = supabaseClient
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_chat",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          console.log("📨 Changement détecté:", payload);
          switch (payload.eventType) {
            case "INSERT":
              console.log("📨 Insertion d'un nouveau message:", payload.new);
              onMessage(payload.new as MessageChat);
              break;
            case "UPDATE":
              console.log("📨 Mise à jour d'un message:", payload.new);
              setChatMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === payload.new.id ? { ...msg, ...payload.new } : msg,
                ),
              );
              break;
            case "DELETE":
              console.log("📨 Suppression d'un message:", payload.old);
              setChatMessages((prevMessages) =>
                prevMessages.filter((msg) => msg.id !== payload.old.id),
              );
              break;
          }
        },
      )
      .subscribe((status) => {
        console.log("📨 Statut du canal:", status, "pour", channelName);
        
        if (status === "SUBSCRIBED") {
          console.log("✅ Canal de chat connecté:", channelName);
          // Réinitialiser les tentatives de retry en cas de succès
          this.retryAttempts.delete(channelName);
        }
        
        if (status === "CLOSED") {
          console.log("🔒 Canal de chat fermé:", channelName);
          this.channels.delete(channelName);
        }
        
        if (status === "CHANNEL_ERROR") {
          console.error("❌ Erreur de canal:", status);
          onError?.("Erreur de connexion au canal");
          // Tenter une reconnexion automatique
          this.retryConnection(channelName, channelId, onMessage, setChatMessages, onError);
        }
        
        if (status === "TIMED_OUT") {
          console.error("⏰ Timeout de connexion au canal:", channelName);
          // Tenter une reconnexion automatique
          this.retryConnection(channelName, channelId, onMessage, setChatMessages, onError);
        }
      });

    // Stocker le canal
    this.channels.set(channelName, channel);
    console.log(`📨 Canal créé: ${channelName} pour channel_id: ${channelId}`);
    
    return channel;
  }

  subscribeToMessages(
    channelId: string,
    onMessage: (message: MessageChat) => void,
    setChatMessages: React.Dispatch<React.SetStateAction<MessageChat[]>>,
    onError?: (error: any) => void,
  ): RealtimeChannel {
    console.log("📨 Configuration de la souscription pour channel_id:", channelId);
    return this.createChannel(channelId, onMessage, setChatMessages, onError);
  }

  unsubscribeFromMessages(channelId: string): void {
    const channelName = Array.from(this.channels.keys()).find(name => 
      name.includes(`chat_${channelId}_`)
    );
    
    if (channelName) {
      const channel = this.channels.get(channelName);
      if (channel) {
        console.log("📨 Désinscription du canal:", channelName);
        supabaseClient.removeChannel(channel);
        this.channels.delete(channelName);
        this.retryAttempts.delete(channelName);
      }
    }
  }

  removeAllChannels(): void {
    console.log("📨 Suppression de tous les canaux de chat");
    this.channels.forEach((channel, name) => {
      supabaseClient.removeChannel(channel);
    });
    this.channels.clear();
    this.retryAttempts.clear();
  }

  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Instance globale du gestionnaire
const chatChannelManager = ChatChannelManager.getInstance();

// Fonction pour récupérer tous les messages de chat
export const fetchMessages = async (): Promise<MessageChat[]> => {
  try {
    const { data, error } = await supabaseClient
      .from("message_chat")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error(error);
    throw new Error(
      "Erreur lors de la récupération des message_chat dans claimApi.",
    );
  }
};

// Fonction pour s'abonner aux messages d'un canal spécifique (version améliorée)
export const subscribeToMessages = (
  channelId: string,
  onMessage: (message: MessageChat) => void,
  setChatMessages: React.Dispatch<React.SetStateAction<MessageChat[]>>,
  onError?: (error: any) => void,
): RealtimeChannel => {
  return chatChannelManager.subscribeToMessages(channelId, onMessage, setChatMessages, onError);
};

// Fonction pour se désabonner d'un canal de messages (version améliorée)
export const unsubscribeFromMessages = (channelId: string): void => {
  chatChannelManager.unsubscribeFromMessages(channelId);
};

// Fonction utilitaire pour nettoyer tous les canaux
export const cleanupAllChatChannels = (): void => {
  chatChannelManager.removeAllChannels();
};

// Fonction pour obtenir les canaux actifs
export const getActiveChatChannels = (): string[] => {
  return chatChannelManager.getActiveChannels();
};

// Fonction pour récupérer les messages d'un canal spécifique
export const fetchMessagesByChannel = async (
  channelId: string,
): Promise<MessageChat[]> => {
  try {
    // Sélectionne tous les messages du canal spécifié en ordre croissant par date de création
    const { data, error } = await supabaseClient
      .from("message_chat")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error(error);
    throw new Error(
      `Erreur lors de la récupération des messages pour le canal ${channelId}`,
    );
  }
};

// Interface mise à jour pour inclure le timestamp
export interface LastMessageInfo {
  message: string;
  time: string;
  timestamp: string; // Ajouter le vrai timestamp
}

export interface LastMessagesMap {
  [channelId: number]: LastMessageInfo;
}

// Fonction utilitaire pour formater la différence de temps
const formatTimeDifference = (createdAt: string): string => {
  const now = new Date();
  const messageDate = new Date(createdAt);
  const diffInMinutes = Math.floor(
    (now.getTime() - messageDate.getTime()) / (1000 * 60),
  );

  if (diffInMinutes < 1) return "À l'instant";
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
  return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
};

//  FONCTION OPTIMISÉE : Récupérer tous les derniers messages en une seule requête
export const fetchLastMessagesForChannels = async (
  channelIds: string[],
): Promise<LastMessagesMap> => {
  console.log(
    "🚀 fetchLastMessagesForChannels - Début avec",
    channelIds.length,
    "channels",
  );

  if (channelIds.length === 0) {
    console.log("Aucun channel_id fourni");
    return {};
  }

  try {
    // Requête optimisée : récupérer tous les messages pour tous les channels en une fois
    const { data: allMessages, error } = await supabaseClient
      .from("message_chat")
      .select("*")
      .in("channel_id", channelIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Erreur lors de la récupération des messages:", error);
      throw error;
    }

    console.log(
      "✅ Récupéré",
      allMessages?.length || 0,
      "messages en une seule requête",
    );

    // Grouper par channel_id et trouver le dernier message de chaque
    const lastMessagesMap: LastMessagesMap = {};

    channelIds.forEach((channelId) => {
      const channelMessages =
        allMessages?.filter((msg) => msg.channel_id.toString() === channelId) ||
        [];

      if (channelMessages.length > 0) {
        const lastMessage = channelMessages[channelMessages.length - 1]; // Dernier message (déjà trié)
        lastMessagesMap[parseInt(channelId)] = {
          message: lastMessage.message,
          time: formatTimeDifference(lastMessage.created_at),
          timestamp: lastMessage.created_at, // Vrai timestamp
        };
      } else {
        lastMessagesMap[parseInt(channelId)] = {
          message: "Aucun message",
          time: "",
          timestamp: "", // Timestamp vide si pas de message
        };
      }
    });

    console.log(
      "✅ Map créé avec",
      Object.keys(lastMessagesMap).length,
      "entrées",
    );
    return lastMessagesMap;
  } catch (error) {
    console.error("💥 Erreur dans fetchLastMessagesForChannels:", error);
    throw error;
  }
};

// Récupérer le dernier message pour un channel spécifique (requête ciblée)
export const fetchLastMessageForChannel = async (
  channelId: string,
): Promise<MessageChat | null> => {
  try {
    const { data, error } = await supabaseClient
      .from("message_chat")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("❌ Erreur lors de la récupération du dernier message:", error);
      throw error;
    }

    return (data as unknown as MessageChat) || null;
  } catch (error) {
    console.error("💥 Erreur dans fetchLastMessageForChannel:", error);
    throw error as any;
  }
};