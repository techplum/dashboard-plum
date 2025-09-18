# 🔧 Guide de Dépannage - Problèmes Realtime

## 🚨 Problèmes Courants

### 1. **Connexion Realtime Intermittente**

**Symptômes :**
- Les messages n'arrivent pas en temps réel
- Les notifications sont manquées
- Connexion qui se coupe et se reconnecte

**Causes possibles :**
- Problème de réseau instable
- Trop de canaux actifs
- Configuration Supabase incorrecte
- Timeout de connexion

**Solutions :**

#### A. Vérifier la configuration Supabase
```typescript
// Dans src/utility/supabaseClient.ts
export const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      params: {
        eventsPerSecond: 20, // Augmenté de 10 à 20
        timeout: 60000, // Augmenté de 30s à 60s
        heartbeat: {
          interval: 10000, // Réduit de 15s à 10s
        },
        reconnect: {
          retries: 5, // Augmenté de 3 à 5
          delay: 1000, // Réduit de 3s à 1s
          maxDelay: 30000, // Augmenté de 15s à 30s
        },
      },
    },
  },
);
```

#### B. Utiliser le Monitoring
```typescript
// Ajouter le composant de monitoring dans votre app
import SupabasePerformanceMonitor from './components/SupabasePerformanceMonitor';

// Dans votre composant principal
<SupabasePerformanceMonitor />
```

#### C. Nettoyer les canaux manuellement
```typescript
import { cleanupAllChannels } from '../utility/supabaseClient';

// Nettoyer tous les canaux
cleanupAllChannels();
```

### 2. **Messages Dupliqués**

**Symptômes :**
- Le même message apparaît plusieurs fois
- Notifications répétées

**Causes possibles :**
- Plusieurs canaux pour la même table
- Re-souscription sans nettoyage
- Événements multiples

**Solutions :**

#### A. Utiliser les gestionnaires centralisés
```typescript
// Au lieu de créer des canaux manuellement
const channel = supabaseClient.channel('manual_channel');

// Utiliser les services centralisés
import { subscribeToMessages } from '../services/chat/chatApi';
import { setupNotificationChannel } from '../services/notification/notificationApi';

const channel = subscribeToMessages(channelId, onMessage, setMessages);
```

#### B. Nettoyer les canaux avant de créer de nouveaux
```typescript
// Dans les composants
useEffect(() => {
  // Nettoyer l'ancien canal
  if (channelRef.current) {
    unsubscribeFromMessages(channelId);
  }
  
  // Créer le nouveau canal
  const newChannel = subscribeToMessages(channelId, onMessage, setMessages);
  channelRef.current = newChannel;
  
  return () => {
    unsubscribeFromMessages(channelId);
  };
}, [channelId]);
```

### 3. **Perte de Connexion**

**Symptômes :**
- Messages qui n'arrivent plus
- Interface qui ne se met pas à jour
- Erreurs de connexion

**Solutions :**

#### A. Reconnexion automatique
```typescript
// Le gestionnaire centralisé gère déjà les retries
const channel = subscribeToMessages(channelId, onMessage, setMessages, (error) => {
  console.error('Erreur de connexion:', error);
  // Le système va automatiquement retenter
});
```

#### B. Reconnexion manuelle
```typescript
import { reconnectRealtime } from '../utility/supabaseClient';

// Forcer une reconnexion
await reconnectRealtime();
```

#### C. Vérifier l'état de la connexion
```typescript
import { checkRealtimeConnection } from '../utility/supabaseClient';

// Vérifier l'état
const channels = checkRealtimeConnection();
console.log('Canaux actifs:', channels);
```

## 🛠️ Outils de Diagnostic

### 1. **Monitoring en Temps Réel**

Le composant `SupabasePerformanceMonitor` fournit :
- État de la connexion realtime
- Nombre de canaux actifs
- Détails de chaque canal
- Actions de nettoyage et reconnexion

### 2. **Logs Détaillés**

Les services centralisés émettent des logs détaillés :
```typescript
// Exemple de logs
console.log("📨 Canal créé: chat_123_1234567890 pour channel_id: 123");
console.log("✅ Canal de chat connecté: chat_123_1234567890");
console.log("❌ Erreur de connexion au canal de chat: chat_123_1234567890");
```

### 3. **Fonctions Utilitaires**

```typescript
// Vérifier l'état global
checkRealtimeConnection();

// Nettoyer tous les canaux
cleanupAllChannels();

// Reconnecter manuellement
reconnectRealtime();

// Obtenir les canaux actifs par type
getActiveNotificationChannels();
getActiveChatChannels();
```

## 🔍 Checklist de Diagnostic

### Avant de signaler un problème :

1. **Vérifier la console du navigateur**
   - Y a-t-il des erreurs ?
   - Les logs de connexion sont-ils présents ?

2. **Utiliser le monitoring**
   - La connexion realtime est-elle active ?
   - Combien de canaux sont actifs ?

3. **Tester la reconnexion**
   - Utiliser le bouton "Reconnecter" du monitoring
   - Vérifier si le problème persiste

4. **Nettoyer les canaux**
   - Utiliser le bouton "Nettoyer" du monitoring
   - Recharger la page

5. **Vérifier le réseau**
   - La connexion internet est-elle stable ?
   - Y a-t-il des restrictions de pare-feu ?

## 🚀 Bonnes Pratiques

### 1. **Gestion des Canaux**
```typescript
// ✅ Bon : Utiliser les services centralisés
const channel = subscribeToMessages(channelId, onMessage, setMessages);

// ❌ Mauvais : Créer des canaux manuellement
const channel = supabaseClient.channel('manual');
```

### 2. **Nettoyage**
```typescript
// ✅ Bon : Nettoyer dans useEffect
useEffect(() => {
  const channel = subscribeToMessages(channelId, onMessage, setMessages);
  
  return () => {
    unsubscribeFromMessages(channelId);
  };
}, [channelId]);

// ❌ Mauvais : Pas de nettoyage
useEffect(() => {
  subscribeToMessages(channelId, onMessage, setMessages);
}, [channelId]);
```

### 3. **Gestion d'Erreurs**
```typescript
// ✅ Bon : Gérer les erreurs
const channel = subscribeToMessages(
  channelId, 
  onMessage, 
  setMessages, 
  (error) => {
    console.error('Erreur de connexion:', error);
    // Logique de fallback si nécessaire
  }
);
```

## 📞 Support

Si les problèmes persistent après avoir suivi ce guide :

1. **Collecter les informations :**
   - Screenshot du monitoring
   - Logs de la console
   - Description détaillée du problème

2. **Tester dans un environnement propre :**
   - Mode incognito
   - Navigateur différent
   - Réseau différent

3. **Vérifier la configuration Supabase :**
   - URL et clés correctes
   - Permissions RLS
   - Triggers de base de données

---

**Note :** Ce guide est mis à jour régulièrement. Vérifiez toujours la version la plus récente. 