import { supabaseClient } from "../../../utility/supabaseClient";

export interface OrderCounters {
  ordersInProgress: number;
  ordersCompleted: number;
  ordersWaitingToStart: number;
  totalOrders: number;
  totalSearches: number;
  unsolvedClaims: number;
}

// Statuts pour les orders en cours
const IN_PROGRESS_STATUSES = [
  'fliiinker_on_the_way',
  'service_started', 
  'service_start_confirmed'
];

// Statuts pour les orders terminées
const COMPLETED_STATUSES = [
  'service_completed_before_due_date',
  'customer_confirmed_ending',
  'service_completed'
];

// Statuts pour les orders en attente de démarrage
const WAITING_TO_START_STATUSES = [
  'payment_confirmed',
  'awaiting_start'
];

let countCache: {
  data: OrderCounters;
  timestamp: number;
  date: string;
} | null = null;

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

/**
 * Récupère les compteurs d'orders d'aujourd'hui depuis Supabase
 */
const fetchOrderCountersFromSupabase = async (today: string): Promise<OrderCounters> => {
  try {
    console.log(`🔍 Récupération des compteurs d'orders pour ${today}`);

    // Récupérer tous les orders d'aujourd'hui basés sur start_date
    const { data: orders, error } = await supabaseClient
      .from('order')
      .select('status')
      .gte('start_date', `${today}T00:00:00`)
      .lte('start_date', `${today}T23:59:59`);

    // Récupérer le nombre total de recherches
    const { count: searchCount, error: searchError } = await supabaseClient
      .from('search')
      .select('*', { count: 'exact', head: true });

    // Récupérer les claims non résolus
    const { count: claimCount, error: claimError } = await supabaseClient
      .from('claim')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'RESOLVED');

    if (error) {
      console.error("❌ Erreur lors de la récupération des compteurs d'orders:", error);
      throw error;
    }

    if (searchError) {
      console.error("❌ Erreur lors de la récupération des recherches:", searchError);
      throw searchError;
    }

    if (claimError) {
      console.error("❌ Erreur lors de la récupération des claims:", claimError);
      throw claimError;
    }

    if (!orders) {
      console.log("⚠️ Aucune donnée retournée pour les orders");
      return {
        ordersInProgress: 0,
        ordersCompleted: 0,
        ordersWaitingToStart: 0,
        totalOrders: 0,
        totalSearches: searchCount || 0,
        unsolvedClaims: claimCount || 0
      };
    }

    // Compter les orders par catégorie
    const ordersInProgress = orders.filter(order => 
      IN_PROGRESS_STATUSES.includes(order.status)
    ).length;

    const ordersCompleted = orders.filter(order => 
      COMPLETED_STATUSES.includes(order.status)
    ).length;

    const ordersWaitingToStart = orders.filter(order => 
      WAITING_TO_START_STATUSES.includes(order.status)
    ).length;

    const totalOrders = orders.length;
    const totalSearches = searchCount || 0;
    const unsolvedClaims = claimCount || 0;

    console.log(`✅ Compteurs récupérés: ${ordersInProgress} en cours, ${ordersCompleted} terminées, ${ordersWaitingToStart} en attente, ${totalOrders} total orders, ${totalSearches} recherches, ${unsolvedClaims} claims non résolus`);

    return {
      ordersInProgress,
      ordersCompleted,
      ordersWaitingToStart,
      totalOrders,
      totalSearches,
      unsolvedClaims
    };

  } catch (error) {
    console.error("❌ Erreur détaillée:", error);
    throw error;
  }
};

/**
 * Récupère les compteurs d'orders d'aujourd'hui avec cache
 */
export const fetchTodayOrderCounters = async (): Promise<OrderCounters> => {
  const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

  // Vérifier le cache
  if (countCache && 
      Date.now() - countCache.timestamp < CACHE_DURATION && 
      countCache.date === today) {
    console.log('🎯 Utilisation du cache pour les compteurs');
    return countCache.data;
  }

  console.log("📡 Récupération des compteurs depuis Supabase");
  const counters = await fetchOrderCountersFromSupabase(today);

  // Mettre en cache
  countCache = {
    data: counters,
    timestamp: Date.now(),
    date: today
  };

  return counters;
};