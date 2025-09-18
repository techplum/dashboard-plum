import { createClient } from "@refinedev/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env
  .VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Diagnostic de la configuration
console.log("🔍 Configuration Supabase:");
console.log("URL:", SUPABASE_URL);
console.log("Anon Key exists:", !!SUPABASE_ANON_KEY);
console.log("Service Role Key exists:", !!SUPABASE_SERVICE_ROLE_KEY);
console.log("Anon Key prefix:", SUPABASE_ANON_KEY?.substring(0, 20) + "...");

// Client principal pour le realtime (clé anonyme)
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  // Rendre accessible globalement pour le debug
  global: {
    headers: {
      "X-Client-Info": "dashboard-plum",
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
      timeout: 60000,
    },
  },
  db: {
    schema: "public",
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Client pour les opérations administratives (utilise la clé de service)
export const supabaseAdminClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: "public",
    },
    auth: {
      persistSession: false,
    },
  },
);

// Rendre accessible globalement pour le debug (en développement seulement)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.supabaseClient = supabaseClient;
  console.log('🔧 Client Supabase rendu accessible globalement pour le debug');
}

// Configuration avancée pour améliorer la fiabilité
// Note: Supabase Realtime n'a pas d'API d'événements de connexion
// Les événements sont gérés au niveau des canaux individuels
if (supabaseClient.realtime) {
  // Augmenter la limite des listeners
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Accéder aux propriétés internes du WebSocket
  if (supabaseClient.realtime.transport?.socket) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    supabaseClient.realtime.transport.socket.setMaxListeners(100);
  }
}

// Fonction utilitaire pour vérifier l'état de la connexion
export const checkRealtimeConnection = () => {
  if (supabaseClient.realtime) {
    const channels = supabaseClient.realtime.getChannels();
    console.log(
      "📊 État des canaux Realtime:",
      channels.map((ch) => ({
        topic: ch.topic,
        state: ch.state,
      })),
    );
    return channels;
  }
  return [];
};

// Fonction utilitaire pour nettoyer tous les canaux
export const cleanupAllChannels = () => {
  if (supabaseClient.realtime) {
    const channels = supabaseClient.realtime.getChannels();
    channels.forEach((channel) => {
      console.log(`🧹 Nettoyage du canal: ${channel.topic}`);
      supabaseClient.realtime.removeChannel(channel);
    });
  }
};

// Fonction utilitaire pour reconnecter manuellement
export const reconnectRealtime = async () => {
  if (supabaseClient.realtime) {
    console.log("🔄 Reconnexion manuelle du Realtime...");
    await supabaseClient.realtime.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await supabaseClient.realtime.connect();
  }
};

// Fonction de test de connexion simple
export const testRealtimeConnection = () => {
  console.log("🧪 Test de connexion realtime...");

  const testChannel = supabaseClient
    .channel("test-connection")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "message_chat" },
      (payload) => {
        console.log("✅ Test message reçu:", payload);
      },
    )
    .subscribe((status) => {
      console.log("🧪 Test channel status:", status);
      if (status === "SUBSCRIBED") {
        console.log("✅ Test de connexion réussi!");
        // Nettoyer le canal de test après 5 secondes
        setTimeout(() => {
          supabaseClient.removeChannel(testChannel);
          console.log("🧹 Canal de test nettoyé");
        }, 5000);
      }
      if (status === "CHANNEL_ERROR") {
        console.error("❌ Test de connexion échoué:", status);
      }
    });

  return testChannel;
};
