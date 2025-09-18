import React, { useEffect, useState, useContext } from "react";
import { OrderCounterCard } from "./OrderCounterCard";
import {
  fetchTodayOrderCounters,
  OrderCounters,
} from "../../services/analytics/order/orderCountersApi";
import { ColorModeContext } from "../../contexts/color-mode";

export const OrderCountersSection: React.FC = () => {
  const [counters, setCounters] = useState<OrderCounters>({
    ordersInProgress: 0,
    ordersCompleted: 0,
    ordersWaitingToStart: 0,
    totalOrders: 0,
    totalSearches: 0,
    unsolvedClaims: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useContext(ColorModeContext);

  useEffect(() => {
    const loadCounters = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchTodayOrderCounters();
        setCounters(data);
      } catch (err) {
        console.error("Erreur lors du chargement des compteurs:", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    loadCounters();

    // Actualiser toutes les 5 minutes
    const interval = setInterval(loadCounters, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Icônes SVG optimisées
  const InProgressIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );

  const CompletedIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );

  const TotalIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
    </svg>
  );

  const WaitingIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z" />
    </svg>
  );

  const SearchIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
    </svg>
  );

  const ClaimIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z" />
    </svg>
  );

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: mode === "dark" ? "#ff6b6b" : "#d63384",
          backgroundColor: mode === "dark" ? "#2d1b1b" : "#f8d7da",
          borderRadius: "8px",
          border: `1px solid ${mode === "dark" ? "#5c2626" : "#f5c2c7"}`,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        justifyContent: "center",
        marginBottom: "24px",
        width: "100%",
        padding: "0 20px",
      }}
    >
      {/* Carte Orders en attente de démarrage */}
      <OrderCounterCard
        title="En attente de démarrage"
        count={counters.ordersWaitingToStart}
        icon={<WaitingIcon />}
        gradient="linear-gradient(135deg, #0076FF 0%, #A259FF 33%, #F95DA8 66%, #FF543E 100%)"
        isLoading={isLoading}
        mode={mode}
      />

      {/* Carte Orders en cours */}
      <OrderCounterCard
        title="Orders en cours"
        count={counters.ordersInProgress}
        icon={<InProgressIcon />}
        gradient="linear-gradient(135deg, #0076FF 0%, #A259FF 33%, #F95DA8 66%, #FF543E 100%)"
        isLoading={isLoading}
        mode={mode}
      />

      {/* Carte Orders terminées */}
      <OrderCounterCard
        title="Orders terminées"
        count={counters.ordersCompleted}
        icon={<CompletedIcon />}
        gradient="linear-gradient(135deg, #0076FF 0%, #A259FF 33%, #F95DA8 66%, #FF543E 100%)"
        isLoading={isLoading}
        mode={mode}
      />

      {/* Carte Total des orders */}
      <OrderCounterCard
        title="Total des orders"
        count={counters.totalOrders}
        icon={<TotalIcon />}
        gradient="linear-gradient(135deg, #0076FF 0%, #A259FF 33%, #F95DA8 66%, #FF543E 100%)"
        isLoading={isLoading}
        mode={mode}
      />

      {/* Carte Total des recherches */}
      <OrderCounterCard
        title="Total des recherches"
        count={counters.totalSearches}
        icon={<SearchIcon />}
        gradient="linear-gradient(135deg, #0076FF 0%, #A259FF 33%, #F95DA8 66%, #FF543E 100%)"
        isLoading={isLoading}
        mode={mode}
      />

      {/* Carte Claims non résolus */}
      <OrderCounterCard
        title="Claims non résolus"
        count={counters.unsolvedClaims}
        icon={<ClaimIcon />}
        gradient="linear-gradient(135deg, #0076FF 0%, #A259FF 33%, #F95DA8 66%, #FF543E 100%)"
        isLoading={isLoading}
        mode={mode}
      />
    </div>
  );
};