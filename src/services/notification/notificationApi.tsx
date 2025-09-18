import { supabaseClient } from "../../utility/supabaseClient";
import { MessageChat } from "../../types/message";
import { RealtimeChannel } from "@supabase/supabase-js";

const adminId = import.meta.env.VITE_CURRENT_USER_ID;

let notificationCache: {
  data: MessageChat[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Gestionnaire centralisé des canaux de notification
class NotificationChannelManager {
  private static instance: NotificationChannelManager;
  private channels: Map<string, RealtimeChannel> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;
  private retryDelay = 3000;

  static getInstance(): NotificationChannelManager {
    if (!NotificationChannelManager.instance) {
      NotificationChannelManager.instance = new NotificationChannelManager();
    }
    return NotificationChannelManager.instance;
  }

  private generateChannelName(channelIds: number[]): string {
    return `notification_${channelIds.sort().join("_")}_${adminId}`;
  }

  private async retryConnection(
    channelName: string,
    channelIds: number[],
    onNewMessage: (message: MessageChat) => void,
  ): Promise<RealtimeChannel | null> {
    const attempts = this.retryAttempts.get(channelName) || 0;

    if (attempts >= this.maxRetries) {
      console.error(
        `❌ Échec de connexion après ${this.maxRetries} tentatives pour ${channelName}`,
      );
      return null;
    }

    console.log(
      `🔄 Tentative de reconnexion ${attempts + 1}/${this.maxRetries} pour ${channelName}`,
    );
    this.retryAttempts.set(channelName, attempts + 1);

    // Attendre avant de réessayer
    await new Promise((resolve) =>
      setTimeout(resolve, this.retryDelay * (attempts + 1)),
    );

    return this.createChannel(channelIds, channelName, onNewMessage);
  }

  private createChannel(
    channelIds: number[],
    channelName: string,
    onNewMessage: (message: MessageChat) => void,
  ): RealtimeChannel {
    // Nettoyer l'ancien canal s'il existe
    const existingChannel = this.channels.get(channelName);
    if (existingChannel) {
      console.log("🔧 Suppression du canal existant:", channelName);
      supabaseClient.removeChannel(existingChannel);
      this.channels.delete(channelName);
    }

    // Vérifier qu'on a des channelIds
    if (!channelIds || channelIds.length === 0) {
      console.warn("🔧 Aucun channel_id fourni pour les notifications");
      channelIds = [];
    }

    const channel = supabaseClient
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_chat",
          filter:
            channelIds.length > 0
              ? `channel_id=in.(${channelIds.join(",")})`
              : undefined,
        },
        (payload) => {
          console.log("🔧 Nouveau message reçu:", payload);
          const newMessage = payload.new as MessageChat;
          
          // Vérifier que le message n'est pas de l'admin actuel
          if (newMessage.sender_id === adminId) {
            console.log("🔧 Message ignoré (envoyé par l'admin actuel)");
            return;
          }
          
          console.log("🔧 Traitement du nouveau message:", newMessage);
          onNewMessage(newMessage);
        },
      )
      .subscribe((status) => {
        console.log("🔧 Statut du canal:", status, "pour", channelName);
        
        if (status === "SUBSCRIBED") {
          console.log("✅ Canal de notification connecté:", channelName);
          // Réinitialiser les tentatives de retry en cas de succès
          this.retryAttempts.delete(channelName);
        }
        
        if (status === "CHANNEL_ERROR") {
          console.error("❌ Erreur de connexion au canal de notification:", channelName);
          // Tenter une reconnexion automatique
          this.retryConnection(channelName, channelIds, onNewMessage);
        }
        
        if (status === "TIMED_OUT") {
          console.error("⏰ Timeout de connexion au canal de notification:", channelName);
          // Tenter une reconnexion automatique
          this.retryConnection(channelName, channelIds, onNewMessage);
        }
        
        if (status === "CLOSED") {
          console.log("🔒 Canal de notification fermé:", channelName);
          this.channels.delete(channelName);
        }
      });

    // Stocker le canal
    this.channels.set(channelName, channel);
    return channel;
  }

  setupNotificationChannel(
    channelIds: number[],
    onNewMessage: (message: MessageChat) => void
  ): RealtimeChannel {
    const channelName = this.generateChannelName(channelIds);
    console.log("🔧 Configuration du canal de notification:", {
      channelName,
      channelIds,
      adminId,
    });

    return this.createChannel(channelIds, channelName, onNewMessage);
  }

  removeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      console.log("🔧 Suppression du canal:", channelName);
      supabaseClient.removeChannel(channel);
      this.channels.delete(channelName);
      this.retryAttempts.delete(channelName);
    }
  }

  removeAllChannels(): void {
    console.log("🔧 Suppression de tous les canaux de notification");
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
const channelManager = NotificationChannelManager.getInstance();

// Récupérer les canaux de réclamation
export const fetchClaimChannels = async () => {
  const { data: claims, error } = await supabaseClient
    .from("claim")
    .select("channel_id")
    .not("channel_id", "is", null);

  if (error) throw error;
  return claims?.map((claim) => claim.channel_id) || [];
};

// Configurer le canal de notification (version améliorée)
export const setupNotificationChannel = (
  channelIds: number[],
  onNewMessage: (message: MessageChat) => void,
): RealtimeChannel => {
  return channelManager.setupNotificationChannel(channelIds, onNewMessage);
};

// Fonction utilitaire pour nettoyer les canaux
export const cleanupNotificationChannels = (channelName?: string): void => {
  if (channelName) {
    channelManager.removeChannel(channelName);
  } else {
    channelManager.removeAllChannels();
  }
};

// Fonction pour obtenir les canaux actifs
export const getActiveNotificationChannels = (): string[] => {
  return channelManager.getActiveChannels();
};

// Récupérer l'historique des notifications
export const fetchNotificationHistory = async (limit = 50) => {
  console.log("🔧 Récupération de l'historique des notifications");

  if (
    notificationCache &&
    Date.now() - notificationCache.timestamp < CACHE_DURATION &&
    notificationCache.data.length > 0
  ) {
    console.log(
      "🔧 Récupération de l'historique des notifications depuis le cache",
    );
    return notificationCache.data;
  }

  // Récupérer d'abord les canaux de réclamation
  const claimChannels = await fetchClaimChannels();
  console.log("🔧 Canaux de réclamation pour l'historique:", claimChannels);

  if (!claimChannels || claimChannels.length === 0) {
    console.log("🔧 Aucun canal de réclamation trouvé");
    return [];
  }

  const { data, error } = await supabaseClient
    .from("message_chat")
    .select("*")
    .neq("sender_id", adminId)
    .in("channel_id", claimChannels)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("🔧 Erreur lors de la récupération de l'historique:", error);
    throw error;
  }

  console.log("🔧 Messages récupérés:", data?.length || 0);

  notificationCache = {
    data: data || [],
    timestamp: Date.now(),
  };

  return data || [];
};
