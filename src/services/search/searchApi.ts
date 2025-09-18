import { ArchiveSearchResult } from "../../types/searchAnalytics";
import { supabaseClient } from "../../utility/supabaseClient";

interface CacheEntry {
  data: ArchiveSearchResult[];
  timestamp: number;
  startDate?: string;
  endDate?: string;
}

let searchAnalyticsCache: CacheEntry | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 1000; // Taille de la page (peut être réduite si nécessaire)

// Fonctions de validation du cache
const isCacheExpired = (cache: CacheEntry | null): boolean => {
  return !cache || Date.now() - cache.timestamp >= CACHE_DURATION;
};

const isCacheEmpty = (cache: CacheEntry | null): boolean => {
  return !cache || cache.data.length === 0;
};

const areDatesInCache = (startDate: string, endDate: string, cache: CacheEntry | null): boolean => {
  if (!cache || cache.data.length === 0) return false;

  const requestStart = new Date(`${startDate}T00:00:00`);
  const requestEnd = new Date(`${endDate}T23:59:59`);

  const cacheDates = cache.data
    .map(item => new Date(item.created_at!))
    .filter(date => !isNaN(date.getTime()));

  if (cacheDates.length === 0) return false;

  const cacheStart = new Date(Math.min(...cacheDates.map(date => date.getTime())));
  const cacheEnd = new Date(Math.max(...cacheDates.map(date => date.getTime())));

  return cacheStart <= requestStart && cacheEnd >= requestEnd;
};

const validateCache = (startDate?: string, endDate?: string): boolean => {
  if (isCacheExpired(searchAnalyticsCache)) {
    console.log('Cache expiré');
    return false;
  }

  if (isCacheEmpty(searchAnalyticsCache)) {
    console.log('Cache vide');
    return false;
  }

  if (!startDate || !endDate) {
    console.log('Pas de dates spécifiées, cache valide');
    return true;
  }

  const datesInCache = areDatesInCache(startDate, endDate, searchAnalyticsCache);
  if (!datesInCache) {
    console.log('Dates non présentes dans le cache');
    return false;
  }

  console.log('Cache valide');
  return true;
};

// Fonction pour récupérer les données avec filtrage par date
const fetchDataForPeriod = async (
  startDate: string,
  endDate: string,
  limit: number = PAGE_SIZE // Limite le nombre de résultats
): Promise<ArchiveSearchResult[]> => {
  const { data, error } = await supabaseClient
    .from('archive_search_results')
    .select('*')
    .gte('created_at', `${startDate}T00:00:00`)
    .lte('created_at', `${endDate}T23:59:59`)
    .order('created_at', { ascending: true })
    .limit(limit); // Limite le nombre de résultats récupérés

  if (error) {
    console.error("Erreur lors de la récupération des données:", error);
    throw error;
  }

  console.log(`Données récupérées : ${data?.length || 0} résultats`);
  return data || [];
};

// Fonction pour récupérer uniquement les dates pour une période avec pagination complète
const fetchDatesForPeriod = async (
  startDate: string,
  endDate: string,
  maxLimit: number = 50000 // Limite maximale de sécurité
): Promise<Date[]> => {
  let allDates: Date[] = [];
  let currentPage = 0;
  let hasMoreData = true;
  const pageSize = 1000; // Taille de page Supabase
  const maxPages = Math.ceil(maxLimit / pageSize);

  console.log(`🔍 Début de récupération paginée des recherches pour ${startDate} à ${endDate}`);

  while (hasMoreData && currentPage < maxPages) {
    try {
      const startRange = currentPage * pageSize;
      const endRange = (currentPage + 1) * pageSize - 1;
      
      console.log(`📄 Récupération page ${currentPage + 1} des recherches (range: ${startRange}-${endRange})`);

      const { data, error, count } = await supabaseClient
        .from('archive_search_results')
        .select('created_at', { count: 'exact' })
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: true })
        .range(startRange, endRange);

      if (error) {
        console.error("❌ Erreur lors de la récupération des dates:", error);
        throw error;
      }

      // Log pour la première page
      if (currentPage === 0 && count !== null) {
        console.log(`📊 Total estimé de recherches dans la période: ${count}`);
        console.log(`📈 Nombre de pages attendues: ${Math.ceil(count / pageSize)}`);
      }

      if (!data || data.length === 0) {
        console.log(`⚠️ Aucune donnée pour la page ${currentPage + 1}`);
        break;
      }

      const validDates = data
        .map(item => new Date(item.created_at))
        .filter(date => !isNaN(date.getTime()));

      allDates = [...allDates, ...validDates];
      currentPage++;

      console.log(`✅ Page ${currentPage} récupérée: ${validDates.length} recherches valides`);

      // Condition d'arrêt
      if (data.length < pageSize) {
        console.log(`🏁 Fin de pagination recherches: dernière page avec ${data.length} résultats`);
        hasMoreData = false;
      }

    } catch (error) {
      console.error(`❌ Erreur lors de la récupération de la page ${currentPage + 1}:`, error);
      throw error;
    }
  }

  if (currentPage >= maxPages) {
    console.warn(`⚠️ Limite de sécurité atteinte pour les recherches (${maxPages} pages)`);
  }

  console.log(`🎉 Récupération recherches terminée: ${allDates.length} recherches sur ${currentPage} pages`);
  return allDates;
};

// Fonction pour récupérer toutes les données (avec une limite)
const fetchAllData = async (limit: number = PAGE_SIZE): Promise<ArchiveSearchResult[]> => {
  const { data, error } = await supabaseClient
    .from('archive_search_results')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit); // Limite le nombre de résultats récupérés

  if (error) {
    console.error("Erreur lors de la récupération des données:", error);
    throw error;
  }

  console.log(`Données récupérées : ${data?.length || 0} résultats`);
  return data || [];
};

// Export des fonctions principales
export const fetchSearchAnalytics = async (
  startDate: string,
  endDate: string,
  limit: number = PAGE_SIZE // Limite le nombre de résultats
): Promise<ArchiveSearchResult[]> => {
  console.log("Appel de fetchSearchAnalytics");

  if (validateCache(startDate, endDate) && searchAnalyticsCache) {
    console.log('Utilisation du cache');
    return searchAnalyticsCache.data
      .filter(item => {
        const itemDate = new Date(item.created_at!);
        return itemDate >= new Date(`${startDate}T00:00:00`) && 
               itemDate <= new Date(`${endDate}T23:59:59`);
      })
      .slice(0, limit); // Limite les résultats retournés
  }

  const data = await fetchDataForPeriod(startDate, endDate, limit);
  
  searchAnalyticsCache = {
    data,
    timestamp: Date.now(),
    startDate,
    endDate
  };

  return data;
};

export const fetchAllSearch = async (
  limit: number = PAGE_SIZE // Limite le nombre de résultats
): Promise<ArchiveSearchResult[]> => {
  console.log("Appel de fetchAllSearch");

  if (validateCache() && searchAnalyticsCache) {
    console.log('Utilisation du cache pour toutes les données');
    return searchAnalyticsCache.data.slice(0, limit); // Limite les résultats retournés
  }

  const data = await fetchAllData(limit);
  
  searchAnalyticsCache = {
    data,
    timestamp: Date.now()
  };

  return data;
};

export const fetchSearchAnalyticsByPeriod = async (
  startDate: string,
  endDate: string
): Promise<Date[]> => {
  console.log("Appel de fetchSearchAnalyticsByPeriod");

  if (validateCache(startDate, endDate) && searchAnalyticsCache) {
    console.log('Utilisation du cache pour les recherches');
    return searchAnalyticsCache.data
      .filter(item => {
        const itemDate = new Date(item.created_at!);
        return itemDate >= new Date(`${startDate}T00:00:00`) && 
               itemDate <= new Date(`${endDate}T23:59:59`);
      })
      .map(item => new Date(item.created_at!))
      .filter(date => !isNaN(date.getTime()));
  }

  // Récupérer toutes les données avec pagination (pas de limite artificielle)
  return fetchDatesForPeriod(startDate, endDate);
};