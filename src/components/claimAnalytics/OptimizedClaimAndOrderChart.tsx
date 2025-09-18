import React, { useContext, useMemo } from "react";
import { DatePicker, Spin } from "antd";
import { ColorModeContext } from "../../contexts/color-mode";
import { useDashboardData } from "../../contexts/dashboard-data/DashboardDataContext";
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

const OptimizedClaimAndOrderChart: React.FC = () => {
  const { mode } = useContext(ColorModeContext);
  const { data, updateDateRange } = useDashboardData();

  const handleDateChange: RangePickerProps["onChange"] = (dates) => {
    if (dates) {
      const [start, end] = dates;
      const startDatePicker = start?.format("YYYY-MM-DD") || "";
      const endDatePicker = end?.format("YYYY-MM-DD") || "";
      updateDateRange(startDatePicker, endDatePicker);
    }
  };

  // Préparer les données pour Recharts - Graphique en ligne avec useMemo pour optimiser
  const chartData = useMemo(() => {
    // Filtrer les dates invalides
    const validClaims = data.claims.filter((date) => dayjs(date).isValid());

    // Combiner toutes les dates uniques
    const allDates = [
      ...validClaims.map((date) => dayjs(date).format("YYYY-MM-DD")),
      ...data.orders.map((order) => dayjs(order.created_at).format("YYYY-MM-DD")),
    ];

    // Créer un ensemble de dates uniques et les trier
    const uniqueDates = Array.from(new Set(allDates)).sort();

    if (uniqueDates.length === 0) {
      return [];
    }

    // Créer les données pour le graphique en ligne
    const chartData = uniqueDates.map((date) => {
      const claimCount = data.claims.filter(
        (claimDate) => dayjs(claimDate).format("YYYY-MM-DD") === date,
      ).length;

      const orderCount = data.orders.filter(
        (order) => dayjs(order.created_at).format("YYYY-MM-DD") === date,
      ).length;

      return {
        date,
        Commandes: orderCount,
        Réclamations: claimCount,
      };
    });

    console.log("Chart Data:", chartData);
    return chartData;
  }, [data.orders, data.claims]);

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
      {data.error && <div style={{ color: "red" }}>{data.error}</div>}
      <RangePicker
        onChange={handleDateChange}
        value={
          data.startDate && data.endDate 
            ? [dayjs(data.startDate), dayjs(data.endDate)] 
            : undefined
        }
        style={{ marginBottom: "10px" }}
      />
      {data.isLoading ? (
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

export default OptimizedClaimAndOrderChart;