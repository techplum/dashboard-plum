# Refactorisation ClaimManagementPage

## 🎯 **Objectif**
Diviser le fichier `ClaimManagementPage.tsx` (1484 lignes) en composants plus petits et réutilisables, suivant les conventions du projet.

## 📁 **Structure des fichiers**

### **Composants principaux**
- `ClaimList.tsx` - Liste des réclamations avec filtrage
- `ClaimChat.tsx` - Interface de chat TalkJS
- `ClaimDetails.tsx` - Panneau de détails à droite
- `ClaimModals.tsx` - Modals pour les détails client/prestataire

### **Hooks personnalisés**
- `useClaimFilters.ts` - Logique de filtrage (recherche + statut)
- `useOrderTimeline.ts` - Logique de la chronologie des commandes

### **Fichiers de sortie**
- `ClaimManagementPageRefactored.tsx` - Version refactorisée (300 lignes vs 1484)
- `index.ts` - Export centralisé des composants

## 🔧 **Composants créés**

### **1. ClaimList.tsx**
**Responsabilités :**
- Affichage de la liste des réclamations
- Filtrage par recherche textuelle
- Filtrage par statut
- Interface responsive (mobile/desktop)
- Badges des filtres actifs

**Props :**
```typescript
interface ClaimListProps {
  claims: any[];
  filteredClaims: any[];
  selectedClaim: any | null;
  searchFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClaimSelect: (claim: any) => void;
  onClearAllFilters: () => void;
  isMobile: boolean;
  isNarrow: boolean;
  showMobileChat: boolean;
  cloudflareUrl: string;
}
```

### **2. ClaimChat.tsx**
**Responsabilités :**
- Header du chat avec avatar et infos client
- Sélecteur de statut avec mise à jour
- Intégration TalkJS
- Gestion responsive (bouton retour mobile)

**Props :**
```typescript
interface ClaimChatProps {
  selectedClaim: any | null;
  isMobile: boolean;
  showMobileChat: boolean;
  onBackToList: () => void;
  onStatusChange: (newStatus: string) => void;
  talkAppId: string;
  currentAdminId: string;
  cloudflareUrl: string;
  talkUser: Talk.User | null;
  syncUserFn: () => Talk.User;
  syncConversation: (session: Talk.Session) => any;
  handleAfterSendMessage: () => void;
  mode: string;
}
```

### **3. ClaimDetails.tsx**
**Responsabilités :**
- Détails de la commande
- Chronologie des statuts (Steps)
- Informations client/prestataire
- Boutons d'ouverture des modals

**Props :**
```typescript
interface ClaimDetailsProps {
  selectedClaim: any | null;
  orderDetails: any | null;
  orderLoading: boolean;
  providerProfile: any | null;
  isNarrow: boolean;
  isMobile: boolean;
  cloudflareUrl: string;
  createOrderTimeline: any[];
  onOpenClientModal: () => void;
  onOpenProviderModal: () => void;
}
```

### **4. ClaimModals.tsx**
**Responsabilités :**
- Modal détails client
- Modal détails prestataire
- Affichage des informations complètes

**Props :**
```typescript
interface ClaimModalsProps {
  selectedClaim: any | null;
  providerProfile: any | null;
  isClientModalOpen: boolean;
  isProviderModalOpen: boolean;
  onCloseClientModal: () => void;
  onCloseProviderModal: () => void;
  cloudflareUrl: string;
}
```

## 🎣 **Hooks personnalisés**

### **useClaimFilters.ts**
Gère la logique de filtrage combinée (recherche + statut) :
```typescript
const {
  searchFilter,
  setSearchFilter,
  statusFilter,
  setStatusFilter,
  filteredClaims,
  clearAllFilters,
} = useClaimFilters(claims);
```

### **useOrderTimeline.ts**
Gère la création de la chronologie des statuts :
```typescript
const { createOrderTimeline } = useOrderTimeline(orderDetails);
```

## 📊 **Avantages de la refactorisation**

### **1. Lisibilité**
- **Avant :** 1484 lignes dans un seul fichier
- **Après :** 300 lignes dans le fichier principal + composants spécialisés

### **2. Maintenabilité**
- Chaque composant a une responsabilité unique
- Tests unitaires plus faciles à écrire
- Debugging simplifié

### **3. Réutilisabilité**
- Composants réutilisables dans d'autres pages
- Hooks personnalisés exportables

### **4. Performance**
- Re-renders optimisés par composant
- Mémoisation des calculs coûteux

### **5. Conventions du projet**
- Structure similaire aux autres composants
- Hooks personnalisés dans `/hooks/`
- Composants dans `/components/`

## 🚀 **Utilisation**

### **Import des composants :**
```typescript
import { ClaimList, ClaimChat, ClaimDetails, ClaimModals } from "../../components/claim-management";
```

### **Import des hooks :**
```typescript
import { useClaimFilters } from "../../hooks/useClaimFilters";
import { useOrderTimeline } from "../../hooks/useOrderTimeline";
```

### **Remplacement du fichier original :**
1. Sauvegarder l'ancien fichier
2. Remplacer par `ClaimManagementPageRefactored.tsx`
3. Adapter les imports si nécessaire
4. Tester toutes les fonctionnalités

## 🔄 **Migration**

### **Étapes recommandées :**
1. ✅ Créer les nouveaux composants
2. ✅ Créer les hooks personnalisés
3. ✅ Tester chaque composant individuellement
4. 🔄 Remplacer le fichier principal
5. 🔄 Tester l'intégration complète
6. 🔄 Supprimer l'ancien fichier

### **Tests à effectuer :**
- [ ] Filtrage par recherche
- [ ] Filtrage par statut
- [ ] Changement de statut
- [ ] Responsive design
- [ ] Modals client/prestataire
- [ ] Chronologie des commandes
- [ ] Chat TalkJS
- [ ] Performance générale
