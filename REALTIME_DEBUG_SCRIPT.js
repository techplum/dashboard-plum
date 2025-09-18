// Script de debug pour diagnostiquer les problèmes de realtime
// Copie-colle ce script dans la console du navigateur

console.log('🔍 Début du diagnostic realtime...');

// 1. Vérifier les variables d'environnement
console.log('📋 Variables d\'environnement:');
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('Service Role Key exists:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
console.log('Anon Key prefix:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// 2. Vérifier l'état du client Supabase
console.log('📊 État du client Supabase:');
console.log('Client exists:', !!window.supabaseClient);
console.log('Realtime exists:', !!window.supabaseClient?.realtime);

// 3. Tester une connexion simple
console.log('🧪 Test de connexion simple...');

const testChannel = window.supabaseClient
  .channel('debug-test')
  .on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'message_chat' 
    },
    (payload) => {
      console.log('✅ Message reçu:', payload);
    }
  )
  .subscribe((status) => {
    console.log('📡 Statut du canal de test:', status);
    
    if (status === 'SUBSCRIBED') {
      console.log('✅ Connexion realtime réussie!');
      
      // Nettoyer le canal de test après 10 secondes
      setTimeout(() => {
        window.supabaseClient.removeChannel(testChannel);
        console.log('🧹 Canal de test nettoyé');
      }, 10000);
    }
    
    if (status === 'CHANNEL_ERROR') {
      console.error('❌ Erreur de canal:', status);
    }
    
    if (status === 'TIMED_OUT') {
      console.error('⏰ Timeout de connexion');
    }
  });

// 4. Vérifier les canaux actifs
setTimeout(() => {
  console.log('📊 Canaux actifs après 5 secondes:');
  const channels = window.supabaseClient.realtime.getChannels();
  console.log('Nombre de canaux:', channels.length);
  channels.forEach((channel, index) => {
    console.log(`Canal ${index + 1}:`, {
      topic: channel.topic,
      state: channel.state
    });
  });
}, 5000);

// 5. Test de requête simple
console.log('🔍 Test de requête simple...');
window.supabaseClient
  .from('message_chat')
  .select('*')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erreur de requête:', error);
    } else {
      console.log('✅ Requête réussie, données:', data);
    }
  });

console.log('🎯 Diagnostic terminé. Vérifiez les logs ci-dessus.'); 