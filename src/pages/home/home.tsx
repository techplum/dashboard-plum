import React, { useContext } from "react";
import "../../styles/home.css";
import OptimizedOrderEvolutionChart from "../../components/orderAnalytics/OptimizedOrderEvolutionChart";
import OptimizedSearchAndOrdersChart from "../../components/searchAnalytics/OptimizedSearchAndOrdersChart";
import OptimizedClaimAndOrderChart from "../../components/claimAnalytics/OptimizedClaimAndOrderChart";
import { ColorModeContext } from "../../contexts/color-mode";
import {
  DashboardDataProvider,
  useDashboardData,
} from "../../contexts/dashboard-data/DashboardDataContext";
import { OrderCountersSection } from "../../components/orderCounters/OrderCountersSection";
import { TodayOrdersTable } from "../../components/orderTracking/TodayOrdersTable";

const HomePageContent: React.FC = () => {
  const { mode } = useContext(ColorModeContext);
  const { data } = useDashboardData();

  return (
    <div>
      {/* Section des compteurs d'orders d'aujourd'hui */}
      <OrderCountersSection />

      {/* Section des compteurs (commentée) */}
      {/* <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          width: "100%",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <CustomerConfirmedCounter />
        <FliiinkerRefuseCounter />
        <OrderConfirmedCounter />
        <SearchCounter />
        <RealtimeClaimComponentCounter />
      </div> */}

      {/* Section des graphiques */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "20px",
          width: "100%",
          marginTop: "20px",
        }}
      >
        {/* Graphique 1: Évolution des commandes */}
        <div
          style={{
            backgroundColor: mode === "dark" ? "#1f1f1f" : "#f5f5f5",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            height: "400px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3
            style={{
              marginBottom: "15px",
              textAlign: "center",
              color: mode === "dark" ? "#fff" : "#000",
              flexShrink: 0,
            }}
          >
            Évolution des commandes
          </h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <OptimizedOrderEvolutionChart />
          </div>
        </div>

        {/* Graphique 2: Recherches et commandes */}
        <div
          style={{
            backgroundColor: mode === "dark" ? "#1f1f1f" : "#f5f5f5",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            height: "400px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3
            style={{
              marginBottom: "15px",
              textAlign: "center",
              color: mode === "dark" ? "#fff" : "#000",
              flexShrink: 0,
            }}
          >
            Recherches et commandes
          </h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <OptimizedSearchAndOrdersChart />
          </div>
        </div>

        {/* Graphique 3: Réclamations et commandes */}
        <div
          style={{
            backgroundColor: mode === "dark" ? "#1f1f1f" : "#f5f5f5",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            height: "400px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3
            style={{
              marginBottom: "15px",
              textAlign: "center",
              color: mode === "dark" ? "#fff" : "#000",
              flexShrink: 0,
            }}
          >
            Réclamations et commandes
          </h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <OptimizedClaimAndOrderChart />
          </div>
        </div>
      </div>

      {/* Section de suivi des commandes d'aujourd'hui */}
      <div style={{ marginTop: "20px" }} className="today-orders-container">
        <TodayOrdersTable orders={data.orders} isDarkMode={mode === "dark"} />
      </div>
    </div>
  );
};

export const HomePage: React.FC = () => {
  return (
    <DashboardDataProvider>
      <HomePageContent />
    </DashboardDataProvider>
  );
};
