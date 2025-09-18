import { DatePicker, Spin } from "antd";
import { useContext, useEffect } from "react";
import { Claim } from "../../types/claim";
import { useState } from "react";
import { Order } from "../../types/orderTypes";
import { ColorModeContext } from "../../contexts/color-mode";
import { fetchAllOrderInPeriod } from "../../services/analytics/order/allOrderApi";
import { fetchAllClaimInPeriod } from "../../services/claims/claimApi";
import { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const { RangePicker } = DatePicker;

const ClaimAndOrderChart: React.FC = () => {
  const { mode } = useContext(ColorModeContext);
  const [isOrderLoading, setIsOrderLoading] = useState<boolean>(false);
  const [isClaimLoading, setIsClaimLoading] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<Date[]>([]);
  const [claimData, setClaimData] = useState<Date[]>([]);
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
    fetchClaimsByDate(defaultStartDate, defaultEndDate);
  }, []);

  // Fonction pour récupérer les commandes
  const fetchOrdersByDate = async (startDate: string, endDate: string) => {
    setIsOrderLoading(true);
    setError(null);
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

  const fetchClaimsByDate = async (startDate: string, endDate: string) => {
    setIsClaimLoading(true);
    setError(null);
    try {
      const claims = await fetchAllClaimInPeriod(startDate, endDate);
      setClaimData(claims);
    } catch (error) {
      console.error(
        "------ Error on fetch claim by date (claimAndOrderChart): ",
        error,
      );
      setError("Failed to fetch claims. Please try again.");
    } finally {
      setIsClaimLoading(false);
    }
  };

  const handleDateChange: RangePickerProps["onChange"] = (dates) => {
    if (dates) {
      const [start, end] = dates;
      const startDatePicker = start?.format("YYYY-MM-DD") || "";
      const endDatePicker = end?.format("YYYY-MM-DD") || "";
      setStartDate(startDatePicker);
      setEndDate(endDatePicker);

      // Appeler les fonctions pour récupérer les données
      fetchOrdersByDate(startDatePicker, endDatePicker);
      fetchClaimsByDate(startDatePicker, endDatePicker);
    }
  };

  // Préparer les données pour Recharts - Graphique en ligne
  const prepareChartData = (orders: Date[], claims: Date[]) => {
    // Filtrer les dates invalides
    const validClaims = claims.filter((date) => dayjs(date).isValid());

    // Combiner toutes les dates uniques
    const allDates = [
      ...validClaims.map((date) => dayjs(date).format("YYYY-MM-DD")),
      ...orders.map((order) => dayjs(order).format("YYYY-MM-DD")),
    ];

    // Créer un ensemble de dates uniques et les trier
    const uniqueDates = Array.from(new Set(allDates)).sort();

    // Créer les données pour le graphique en ligne
    const chartData = uniqueDates.map((date) => {
      const claimCount = claims.filter(
        (claimDate) => dayjs(claimDate).format("YYYY-MM-DD") === date,
      ).length;

      const orderCount = orders.filter(
        (order) => dayjs(order).format("YYYY-MM-DD") === date,
      ).length;

      return {
        date,
        Commandes: orderCount,
        Réclamations: claimCount,
      };
    });

    console.log("Chart Data:", chartData);
    return chartData;
  };

  const chartData = prepareChartData(orderData || [], claimData || []);

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
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
            <strong>Date:</strong> {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              style={{
                color: entry.color,
                margin: "5px 0",
              }}
            >
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
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
      {isOrderLoading || isClaimLoading ? (
        <Spin tip="Loading..." />
      ) : chartData.length > 0 ? (
        <div style={{ width: "100%", height: "300px", flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="Commandes"
                stroke="#1890ff"
                strokeWidth={3}
                dot={{ fill: "#1890ff", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="Réclamations"
                stroke="#ff4d4f"
                strokeWidth={3}
                dot={{ fill: "#ff4d4f", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
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

export default ClaimAndOrderChart;
