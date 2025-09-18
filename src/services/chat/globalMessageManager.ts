import { supabaseClient } from "../../utility/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import { MessageChat } from "../../types/message";
import { store } from "../../store/store";
import {
  addMessage,
  updateMessage,
  deleteMessage,
  setConnectionStatus,
  setError,
} from "../../store/slices/messageSlice";

/**
 * Gestionnaire global pour écouter tous les messages en temps réel
 * Ce service crée une seule connexion WebSocket qui écoute tous les événements
 * sur la table message_chat et les distribue au store Redux
 */
class GlobalMessageManager {
  private static instance: GlobalMessageManager;
  private channel: RealtimeChannel | null = null;
  private retryAttempts = 0;
  private maxRetries = 5;
  private retryDelay = 3000;
  private retryTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  static getInstance(): GlobalMessageManager {
    if (!GlobalMessageManager.instance) {
      GlobalMessageManager.instance = new GlobalMessageManager();
    }
    return GlobalMessageManager.instance;
  }

  /**
   * Initialise la connexion globale aux messages
   * Cette méthode doit être appelée une seule fois au login
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("🔄 Gestionnaire global de messages déjà initialisé");
      return;
    }

    console.log("🚀 Initialisation du gestionnaire global de messages");
    store.dispatch(setConnectionStatus("connecting"));

    try {
      await this.createGlobalChannel();
      this.isInitialized = true;
      console.log("✅ Gestionnaire global de messages initialisé avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation:", error);
      store.dispatch(
        setError("Erreur lors de l'initialisation de la connexion"),
      );
      this.scheduleRetry();
    }
  }

  /**
   * Crée le canal global qui écoute tous les messages
   */
  private async createGlobalChannel(): Promise<void> {
    // Nettoyer l'ancien canal s'il existe
    this.cleanup();

    const channelName = `global_messages_${Date.now()}`;

    this.channel = supabaseClient
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_chat",
        },
        (payload) => this.handleRealtimeEvent(payload),
      )
      .subscribe((status) => this.handleConnectionStatus(status));

    console.log(`📡 Canal global créé: ${channelName}`);
  }

  /**
   * Gère les événements en temps réel reçus
   */
  private handleRealtimeEvent(payload: any): void {
    console.log("📨 Événement reçu:", payload.eventType, payload);

    try {
      switch (payload.eventType) {
        case "INSERT":
          console.log("➕ Nouveau message:", payload.new);
          store.dispatch(addMessage(payload.new as MessageChat));
          break;

        case "UPDATE":
          console.log("🔄 Message mis à jour:", payload.new);
          store.dispatch(updateMessage(payload.new as MessageChat));
          break;

        case "DELETE":
          console.log("🗑️ Message supprimé:", payload.old);
          store.dispatch(
            deleteMessage({
              id: payload.old.id,
              channelId: payload.old.channel_id.toString(),
            }),
          );
          break;

        default:
          console.log("🤷 Événement non géré:", payload.eventType);
      }
    } catch (error) {
      console.error("❌ Erreur lors du traitement de l'événement:", error);
      store.dispatch(setError("Erreur lors du traitement d'un message"));
    }
  }

  /**
   * Gère les changements de statut de connexion
   */
  private handleConnectionStatus(status: string): void {
    console.log("📡 Statut de connexion global:", status);

    switch (status) {
      case "SUBSCRIBED":
        console.log("✅ Connexion globale établie avec succès");
        store.dispatch(setConnectionStatus("connected"));
        store.dispatch(setError(null));
        this.retryAttempts = 0;
        this.clearRetryTimeout();
        break;

      case "CLOSED":
        console.log("🔒 Connexion globale fermée");
        store.dispatch(setConnectionStatus("disconnected"));
        this.channel = null;
        break;

      case "CHANNEL_ERROR":
        console.error("❌ Erreur de canal global");
        store.dispatch(setConnectionStatus("error"));
        store.dispatch(setError("Erreur de connexion au canal"));
        this.scheduleRetry();
        break;

      case "TIMED_OUT":
        console.error("⏰ Timeout de connexion globale");
        store.dispatch(setConnectionStatus("error"));
        store.dispatch(setError("Timeout de connexion"));
        this.scheduleRetry();
        break;

      default:
        console.log("🤷 Statut de connexion non géré:", status);
    }
  }

  /**
   * Programme une nouvelle tentative de connexion
   */
  private scheduleRetry(): void {
    if (this.retryAttempts >= this.maxRetries) {
      console.error(`❌ Abandon après ${this.maxRetries} tentatives`);
      store.dispatch(setConnectionStatus("error"));
      store.dispatch(
        setError(`Échec de connexion après ${this.maxRetries} tentatives`),
      );
      return;
    }

    this.retryAttempts++;
    const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);

    console.log(
      `🔄 Tentative de reconnexion ${this.retryAttempts}/${this.maxRetries} dans ${delay}ms`,
    );

    this.retryTimeout = setTimeout(() => {
      console.log(
        `🔄 Reconnexion automatique (tentative ${this.retryAttempts})`,
      );
      this.createGlobalChannel();
    }, delay);
  }

  /**
   * Nettoie le timeout de retry
   */
  private clearRetryTimeout(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * Nettoie la connexion actuelle
   */
  private cleanup(): void {
    this.clearRetryTimeout();

    if (this.channel) {
      console.log("🧹 Nettoyage du canal global existant");
      supabaseClient.removeChannel(this.channel);
      this.channel = null;
    }
  }

  /**
   * Reconnecte manuellement si nécessaire
   */
  async reconnect(): Promise<void> {
    console.log("🔄 Reconnexion manuelle demandée");
    this.retryAttempts = 0;
    await this.createGlobalChannel();
  }

  /**
   * Obtient le statut de connexion actuel
   */
  getConnectionStatus(): string {
    return store.getState().messages.connectionStatus;
  }

  /**
   * Vérifie si le gestionnaire est connecté
   */
  isConnected(): boolean {
    return this.getConnectionStatus() === "connected";
  }

  /**
   * Nettoie complètement le gestionnaire
   * À utiliser lors de la déconnexion
   */
  destroy(): void {
    console.log("🧹 Destruction du gestionnaire global de messages");
    this.cleanup();
    this.isInitialized = false;
    store.dispatch(setConnectionStatus("disconnected"));
  }
}

// Instance singleton
export const globalMessageManager = GlobalMessageManager.getInstance();

// Fonctions utilitaires pour l'utilisation externe
export const initializeGlobalMessageManager = () =>
  globalMessageManager.initialize();
export const reconnectGlobalMessageManager = () =>
  globalMessageManager.reconnect();
export const destroyGlobalMessageManager = () => globalMessageManager.destroy();
export const isGlobalMessageManagerConnected = () =>
  globalMessageManager.isConnected();
