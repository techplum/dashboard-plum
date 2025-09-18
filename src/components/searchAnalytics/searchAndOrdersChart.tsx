import React, { useContext, useState, useEffect } from "react";
import { DatePicker, Spin } from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Order } from "../../types/orderTypes";
import { ColorModeContext } from "../../contexts/color-mode";
import { fetchAllOrderInPeriod } from "../../services/analytics/order/allOrderApi";
import { fetchSearchAnalyticsByPeriod } from "../../services/search/searchApi";

const { RangePicker } = DatePicker;

const SearchAndOrdersChart: React.FC = () => {
  const { mode } = useContext(ColorModeContext);
  const [isOrderLoading, setIsOrderLoading] = useState<boolean>(false);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<Date[]>([]);
  const [searchData, setSearchData] = useState<Date[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Initialiser avec une période d'un mois à partir d'aujourd'hui
  useEffect(() => {
    const today = dayjs();
    const oneMonthAgo = today.subtract(1, "month");

    const defaultStartDate = oneMonthAgo.format("YYYY-MM-DD");
    const defaultEndDate = today.format("YYYY-MM-DD");

    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);

    // Charger les données par défaut
    fetchOrdersByDate(defaultStartDate, defaultEndDate);
    fetchSearchByDate(defaultStartDate, defaultEndDate);
  }, []);

  /**
   * Fonction pour récupérer les commandes par date.
   */
  const fetchOrdersByDate = async (startDate: string, endDate: string) => {
    setIsOrderLoading(true);
    setError(null);
    console.log("🛑🛑🛑🛑🛑🛑🛑🛑");
    console.log("Fetching orders for period:", startDate, endDate);
    try {
      const orders = await fetchAllOrderInPeriod(startDate, endDate);
      setOrderData(orders);
    } catch (error) {
      console.error(
        "------ Error on fetch order by date (allOrderComponent): ",
        error,
      );
      setError("Failed to fetch orders. Please try again.");
    } finally {
      setIsOrderLoading(false);
    }
  };

  // Fonction pour récupérer les recherches
  const fetchSearchByDate = async (startDate: string, endDate: string) => {
    setIsSearchLoading(true);
    setError(null);
    try {
      const searches = await fetchSearchAnalyticsByPeriod(startDate, endDate);
      setSearchData(searches);
    } catch (error) {
      console.error(
        "------ Error on fetch search by date (searchCircle): ",
        error,
      );
      setError("Failed to fetch search data. Please try again.");
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Gestion du changement de date
  const handleDateChange: RangePickerProps["onChange"] = (dates) => {
    if (dates) {
      const [start, end] = dates;
      const startDatePicker = start?.format("YYYY-MM-DD") || "";
      const endDatePicker = end?.format("YYYY-MM-DD") || "";
      setStartDate(startDatePicker);
      setEndDate(endDatePicker);

      // Appeler les fonctions pour récupérer les données
      fetchOrdersByDate(startDatePicker, endDatePicker);
      fetchSearchByDate(startDatePicker, endDatePicker);
    }
  };

  // Préparer les données pour Recharts - Camembert
  const prepareChartData = (searchDates: Date[], orders: Date[]) => {
    // Filtrer les dates invalides
    const validSearchDates = searchDates.filter((date) =>
      dayjs(date).isValid(),
    );

    // Compter le total des recherches et commandes
    const totalSearches = validSearchDates.length;
    const totalOrders = orders.length;

    return [
      {
        name: "Recherches",
        value: totalSearches,
        color: "#148EFF",
      },
      {
        name: "Commandes",
        value: totalOrders,
        color: "#faad14",
      },
    ];
  };

  // Préparer les données pour le graphique
  const chartData = prepareChartData(searchData || [], orderData || []);

  // Couleurs personnalisées
  const COLORS = ["#148EFF", "#faad14"];

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: mode === "dark" ? "#333" : "#fff",
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          <p style={{ color: mode === "dark" ? "#fff" : "#000" }}>
            {`${payload[0].name}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      {error && <div style={{ color: "red" }}>{error}</div>}
      <RangePicker
        onChange={handleDateChange}
        value={
          startDate && endDate ? [dayjs(startDate), dayjs(endDate)] : undefined
        }
        style={{ marginBottom: "10px" }}
      />
      {isOrderLoading || isSearchLoading ? (
        <Spin tip="Loading..." />
      ) : chartData.length > 0 ? (
        <div style={{ width: "100%", height: "300px", flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p>Sélectionnez une période pour voir les données</p>
        </div>
      )}
    </div>
  );
};

export default SearchAndOrdersChart;
