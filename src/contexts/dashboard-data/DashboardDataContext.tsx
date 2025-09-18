import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import dayjs from "dayjs";
import { Order } from "../../types/orderTypes";
import { fetchAllOrderInPeriodForAnalytics } from "../../services/analytics/order/allOrderApi";
import { fetchAllClaimInPeriod } from "../../services/claims/claimApi";
import { fetchSearchAnalyticsByPeriod } from "../../services/search/searchApi";

interface DashboardData {
  orders: Order[];
  claims: Date[];
  searches: Date[];
  startDate: string;
  endDate: string;
  isLoading: boolean;
  error: string | null;
  loadingProgress?: string; // Pour afficher le progrès de la pagination
}

interface DashboardDataContextType {
  data: DashboardData;
  updateDateRange: (start: string, end: string) => void;
  refetchData: () => void;
}

const DashboardDataContext = createContext<
  DashboardDataContextType | undefined
>(undefined);

interface DashboardDataProviderProps {
  children: ReactNode;
}

export const DashboardDataProvider: React.FC<DashboardDataProviderProps> = ({
  children,
}) => {
  const [data, setData] = useState<DashboardData>({
    orders: [],
    claims: [],
    searches: [],
    startDate: "",
    endDate: "",
    isLoading: false,
    error: null,
    loadingProgress: undefined,
  });

  // Initialiser avec une période d'un mois par défaut
  useEffect(() => {
    const today = dayjs();
    const oneMonthAgo = today.subtract(1, "month");
    const defaultStartDate = oneMonthAgo.format("YYYY-MM-DD");
    const defaultEndDate = today.format("YYYY-MM-DD");

    setData((prev) => ({
      ...prev,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    }));

    fetchAllData(defaultStartDate, defaultEndDate);
  }, []);

  const fetchAllData = async (startDate: string, endDate: string) => {
    setData((prev) => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      loadingProgress: "Initialisation..." 
    }));

    try {
      console.log(
        "🚀 Récupération centralisée des données pour:",
        startDate,
        endDate,
      );

      // Mettre à jour le progrès
      setData((prev) => ({
        ...prev,
        loadingProgress: "Récupération des commandes (peut prendre du temps si beaucoup de données)...",
      }));

      // Récupérer les commandes en premier (avec pagination)
      const ordersData = await fetchAllOrderInPeriodForAnalytics(startDate, endDate).catch((err) => {
        console.error("Erreur lors de la récupération des commandes:", err);
        return [];
      });

      // Mettre à jour le progrès
      setData((prev) => ({
        ...prev,
        loadingProgress: "Récupération des réclamations...",
      }));

      // Récupérer les réclamations
      const claimsData = await fetchAllClaimInPeriod(startDate, endDate).catch((err) => {
        console.error("Erreur lors de la récupération des réclamations:", err);
        return [];
      });

      // Mettre à jour le progrès
      setData((prev) => ({
        ...prev,
        loadingProgress: "Récupération des recherches...",
      }));

      // Récupérer les recherches
      const searchesData = await fetchSearchAnalyticsByPeriod(startDate, endDate).catch((err) => {
        console.error("Erreur lors de la récupération des recherches:", err);
        return [];
      });

      setData((prev) => ({
        ...prev,
        orders: ordersData,
        claims: claimsData,
        searches: searchesData,
        startDate,
        endDate,
        isLoading: false,
        loadingProgress: undefined,
      }));

      console.log("✅ Données centralisées récupérées:", {
        orders: ordersData.length,
        claims: claimsData.length,
        searches: searchesData.length,
      });

      // Alerte si on a atteint la limite potentielle
      if (ordersData.length >= 50000) {
        console.warn("⚠️ Limite de sécurité atteinte pour les commandes. Il pourrait y avoir plus de données.");
      }

    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      setData((prev) => ({
        ...prev,
        error: "Erreur lors de la récupération des données",
        isLoading: false,
        loadingProgress: undefined,
      }));
    }
  };

  const updateDateRange = (startDate: string, endDate: string) => {
    if (startDate === data.startDate && endDate === data.endDate) {
      return; // Éviter les appels inutiles
    }
    fetchAllData(startDate, endDate);
  };

  const refetchData = () => {
    fetchAllData(data.startDate, data.endDate);
  };

  const contextValue: DashboardDataContextType = {
    data,
    updateDateRange,
    refetchData,
  };

  return (
    <DashboardDataContext.Provider value={contextValue}>
      {children}
    </DashboardDataContext.Provider>
  );
};

export const useDashboardData = (): DashboardDataContextType => {
  const context = useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error(
      "useDashboardData must be used within a DashboardDataProvider",
    );
  }
  return context;
};