// Test simple pour vérifier les notifications en temps réel
// Copie-colle ce script dans la console du navigateur

console.log('🔔 Test simple des notifications...');

// 1. Récupérer un canal de réclamation
window.supabaseClient
  .from('claim')
  .select('channel_id')
  .not('channel_id', 'is', null)
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.error('❌ Aucun canal de réclamation trouvé');
      return;
    }
    
    const channelId = data[0].channel_id;
    console.log('✅ Canal trouvé:', channelId);
    
    // 2. Créer un canal de notification simple
    const notificationChannel = window.supabaseClient
      .channel('test-notification-simple')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_chat',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          console.log('🔔 NOTIFICATION REÇUE EN TEMPS RÉEL:', payload);
          console.log('✅ Les notifications fonctionnent parfaitement!');
          
          // Afficher une alerte pour confirmer
          alert('🔔 Notification reçue en temps réel!');
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut du canal:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Canal connecté! Envoi d\'un message de test...');
          
          // 3. Envoyer un message de test
          window.supabaseClient
            .from('message_chat')
            .insert({
              message: 'Test notification temps réel - ' + new Date().toLocaleTimeString(),
              sender_id: 'test-user-' + Date.now(),
              channel_id: channelId,
              created_at: new Date().toISOString()
            })
            .then(({ data, error }) => {
              if (error) {
                console.error('❌ Erreur envoi message:', error);
              } else {
                console.log('✅ Message de test envoyé:', data);
              }
            });
        }
      });
  }); 