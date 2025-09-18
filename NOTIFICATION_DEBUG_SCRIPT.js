// Script de debug pour diagnostiquer les problèmes de notifications
// Copie-colle ce script dans la console du navigateur

console.log('🔔 Début du diagnostic des notifications...');

// 1. Vérifier les canaux de réclamation
console.log('📋 Vérification des canaux de réclamation...');

window.supabaseClient
  .from('claim')
  .select('channel_id')
  .not('channel_id', 'is', null)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erreur lors de la récupération des canaux:', error);
      return;
    }
    
    const channelIds = data.map(claim => claim.channel_id);
    console.log('✅ Canaux de réclamation trouvés:', channelIds);
    
    if (channelIds.length === 0) {
      console.error('❌ Aucun canal de réclamation trouvé');
      return;
    }
    
    // 2. Tester la création d'un canal de notification
    console.log('🔔 Test de création du canal de notification...');
    
    const notificationChannel = window.supabaseClient
      .channel('notification-test')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_chat',
          filter: `channel_id=in.(${channelIds.join(',')})`
        },
        (payload) => {
          console.log('🔔 Notification reçue:', payload);
          console.log('✅ Les notifications fonctionnent!');
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut du canal de notification:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Canal de notification connecté avec succès!');
          
          // 3. Tester l'envoi d'un message de test
          console.log('🧪 Envoi d\'un message de test...');
          
          window.supabaseClient
            .from('message_chat')
            .insert({
              message: 'Message de test pour les notifications',
              sender_id: 'test-sender',
              channel_id: channelIds[0],
              created_at: new Date().toISOString()
            })
            .then(({ data, error }) => {
              if (error) {
                console.error('❌ Erreur lors de l\'envoi du message de test:', error);
              } else {
                console.log('✅ Message de test envoyé:', data);
              }
            });
          
          // Nettoyer le canal après 10 secondes
          setTimeout(() => {
            window.supabaseClient.removeChannel(notificationChannel);
            console.log('🧹 Canal de notification nettoyé');
          }, 10000);
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erreur de canal de notification:', status);
        }
        
        if (status === 'TIMED_OUT') {
          console.error('⏰ Timeout du canal de notification');
        }
      });
  });

// 4. Vérifier les permissions sur la table message_chat
console.log('🔍 Vérification des permissions...');

window.supabaseClient
  .from('message_chat')
  .select('*')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erreur de permission sur message_chat:', error);
    } else {
      console.log('✅ Permissions OK sur message_chat');
    }
  });

// 5. Vérifier l'état des canaux après 5 secondes
setTimeout(() => {
  console.log('📊 État des canaux après 5 secondes:');
  const channels = window.supabaseClient.realtime.getChannels();
  console.log('Nombre total de canaux:', channels.length);
  
  channels.forEach((channel, index) => {
    console.log(`Canal ${index + 1}:`, {
      topic: channel.topic,
      state: channel.state
    });
  });
}, 5000);

console.log('🎯 Diagnostic des notifications terminé. Vérifiez les logs ci-dessus.'); 