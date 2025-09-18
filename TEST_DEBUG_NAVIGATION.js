// Script de debug pour la navigation des réclamations
// Copie-colle ce script dans la console du navigateur

console.log('🔍 Debug de la navigation des réclamations...');

// 1. Vérifier l'URL actuelle
console.log('📍 URL actuelle:', window.location.href);

// 2. Récupérer les réclamations disponibles
window.supabaseClient
  .from('claim')
  .select('id, claim_id, channel_id')
  .not('channel_id', 'is', null)
  .limit(5)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    console.log('📋 Réclamations disponibles:', data);
    
    if (data && data.length > 0) {
      const firstClaim = data[0];
      console.log('🎯 Première réclamation:', firstClaim);
      
      // 3. Tester la navigation vers cette réclamation
      const targetUrl = `/claim/${firstClaim.claim_id}`;
      console.log('🧭 Navigation vers:', targetUrl);
      
      // 4. Utiliser window.location pour une navigation complète
      window.location.href = targetUrl;
      
      console.log('✅ Navigation lancée!');
    } else {
      console.log('❌ Aucune réclamation trouvée');
    }
  });

// 5. Vérifier les paramètres d'URL après 2 secondes
setTimeout(() => {
  console.log('🔍 URL après navigation:', window.location.href);
  console.log('🔍 Pathname:', window.location.pathname);
  
  // Extraire l'ID de la réclamation de l'URL
  const pathParts = window.location.pathname.split('/');
  const claimIdFromUrl = pathParts[pathParts.length - 1];
  console.log('🔍 Claim ID extrait de l\'URL:', claimIdFromUrl);
}, 2000); 