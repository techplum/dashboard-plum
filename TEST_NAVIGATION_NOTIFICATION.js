// Test de navigation vers les discussions
// Copie-colle ce script dans la console du navigateur

console.log('🧭 Test de navigation vers les discussions...');

// 1. Récupérer une réclamation avec son ID
window.supabaseClient
  .from('claim')
  .select('claim_id, channel_id')
  .not('channel_id', 'is', null)
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.error('❌ Aucune réclamation trouvée');
      return;
    }
    
    const claim = data[0];
    console.log('✅ Réclamation trouvée:', claim);
    
    // 2. Tester la navigation
    const targetUrl = `/claim/${claim.claim_id}`;
    console.log('🧭 Navigation vers:', targetUrl);
    
    // 3. Changer l'URL
    window.history.pushState({}, '', targetUrl);
    
    // 4. Déclencher un événement de navigation
    window.dispatchEvent(new PopStateEvent('popstate'));
    
    console.log('✅ Navigation effectuée!');
    console.log('🔍 URL actuelle:', window.location.href);
    
    // 5. Vérifier que l'URL a changé
    setTimeout(() => {
      console.log('🔍 URL après navigation:', window.location.href);
      if (window.location.pathname === targetUrl) {
        console.log('✅ Navigation réussie!');
        alert('🧭 Navigation vers la discussion réussie!');
      } else {
        console.log('❌ Navigation échouée');
      }
    }, 1000);
  }); 