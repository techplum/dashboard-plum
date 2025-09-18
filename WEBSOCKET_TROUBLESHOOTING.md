# 🔌 Guide de Dépannage - Problèmes WebSocket Supabase

## 🚨 Problème Principal : Connexion WebSocket Échoue

### **Symptômes :**
```
Firefox ne peut établir de connexion avec le serveur à l'adresse wss://...
La connexion avec wss://... a été interrompue pendant le chargement de la page
```

### **Cause Racine :**
Utilisation de la **clé de service** (`service_role`) au lieu de la **clé anonyme** (`anon`) pour le realtime.

## 🔧 **Solution Appliquée :**

### 1. **Correction de la Configuration Client**

```typescript
// ❌ AVANT (causait l'erreur)
export const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY, // Clé de service - PAS pour le realtime
  { /* config */ }
);

// ✅ APRÈS (corrigé)
export const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY, // Clé anonyme - REQUISE pour le realtime
  { /* config */ }
);
```

### 2. **Séparation des Clients**

```typescript
// Client principal pour le realtime (clé anonyme)
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 20,
      timeout: 60000,
    },
  },
  // ... autres configs
});

// Client admin pour les opérations sensibles (clé de service)
export const supabaseAdminClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    // Pas de realtime ici
    db: { schema: "public" },
    auth: { persistSession: false },
  },
);
```

## 🔍 **Différence entre les Clés :**

| Clé | Usage | Realtime | Sécurité |
|-----|-------|----------|----------|
| `anon` | Client-side | ✅ Oui | Contrôlée par RLS |
| `service_role` | Server-side | ❌ Non | Accès complet |

## 🛠️ **Vérifications à Faire :**

### 1. **Variables d'Environnement**
```bash
# Vérifier que ces variables existent
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. **Permissions RLS**
```sql
-- Vérifier que les politiques RLS permettent l'accès
SELECT * FROM pg_policies WHERE tablename = 'message_chat';

-- Exemple de politique pour message_chat
CREATE POLICY "Enable read access for authenticated users" ON message_chat
FOR SELECT USING (auth.role() = 'authenticated');
```

### 3. **Triggers de Base de Données**
```sql
-- Vérifier que les triggers sont activés pour le realtime
SELECT * FROM pg_trigger WHERE tgname LIKE '%realtime%';
```

## 🔄 **Processus de Diagnostic :**

### **Étape 1 : Vérifier la Configuration**
```typescript
// Dans la console du navigateur
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

### **Étape 2 : Tester la Connexion Simple**
```typescript
// Test basique de connexion
const testChannel = supabaseClient
  .channel('test')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'message_chat' }, 
    (payload) => console.log('Test message:', payload)
  )
  .subscribe((status) => {
    console.log('Test channel status:', status);
  });
```

### **Étape 3 : Vérifier les Logs**
```typescript
// Activer les logs détaillés
localStorage.setItem('supabase.debug', 'true');
```

## 🚀 **Bonnes Pratiques :**

### 1. **Utiliser les Bonnes Clés**
```typescript
// ✅ Pour le realtime côté client
const client = createClient(url, anonKey);

// ✅ Pour les opérations admin côté serveur
const admin = createClient(url, serviceRoleKey);
```

### 2. **Gestion d'Erreurs**
```typescript
const channel = supabaseClient
  .channel('my-channel')
  .on('postgres_changes', { /* ... */ })
  .subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('Erreur de canal:', status);
      // Logique de retry
    }
  });
```

### 3. **Nettoyage des Canaux**
```typescript
useEffect(() => {
  const channel = subscribeToMessages(channelId, onMessage, setMessages);
  
  return () => {
    unsubscribeFromMessages(channelId);
  };
}, [channelId]);
```

## 📋 **Checklist de Résolution :**

- [ ] Utiliser `VITE_SUPABASE_ANON_KEY` pour le realtime
- [ ] Vérifier que les variables d'environnement sont chargées
- [ ] S'assurer que les politiques RLS sont correctes
- [ ] Tester avec un canal simple
- [ ] Vérifier les logs de la console
- [ ] Redémarrer l'application après les changements

## 🔗 **Ressources Utiles :**

- [Documentation Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Guide des Clés API](https://supabase.com/docs/guides/api/keys)
- [Politiques RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**Note :** Après avoir appliqué ces corrections, redémarre complètement l'application pour que les changements prennent effet. 