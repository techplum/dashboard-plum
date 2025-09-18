import React, { useState, useContext, useMemo } from "react";
import { DatePicker, Spin } from "antd";
import { Order } from "../../types/orderTypes";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import { ColorModeContext } from "../../contexts/color-mode";
import { useDashboardData } from "../../contexts/dashboard-data/DashboardDataContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../../styles/allOrder.css";

const { RangePicker } = DatePicker;

const OptimizedOrderEvolutionChart: React.FC = () => {
  const { mode } = useContext(ColorModeContext);
  const { data, updateDateRange } = useDashboardData();

  const getOrdersByPeriod = (
    orders: Order[],
    startDate: string,
    endDate: string,
  ): { period: string; count: number }[] => {
    const periodCounts: Record<string, number> = {};
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    // Générer toutes les dates dans la plage sélectionnée
    for (
      let date = start;
      date.isBefore(end) || date.isSame(end);
      date = date.add(1, "day")
    ) {
      const formattedDate = date.format("YYYY-MM-DD");
      periodCounts[formattedDate] = 0;
    }

    // Compter les orders pour chaque période
    orders.forEach((order) => {
      const orderDate = dayjs(order.created_at).format("YYYY-MM-DD");
      if (periodCounts[orderDate] !== undefined) {
        periodCounts[orderDate]++;
      }
    });

    // Convertir en tableau pour le graphique
    return Object.entries(periodCounts).map(([period, count]) => ({
      period,
      count,
    }));
  };

  const handleDateChange: RangePickerProps["onChange"] = (dates) => {
    if (dates) {
      const [start, end] = dates;
      const startDatePicker = start?.format("YYYY-MM-DD") || "";
      const endDatePicker = end?.format("YYYY-MM-DD") || "";
      updateDateRange(startDatePicker, endDatePicker);
    }
  };

  // Utiliser useMemo pour éviter les recalculs inutiles
  const chartData = useMemo(() => {
    if (data.orders.length > 0 && data.startDate && data.endDate) {
      return getOrdersByPeriod(data.orders, data.startDate, data.endDate);
    }
    return [];
  }, [data.orders, data.startDate, data.endDate]);

  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((item) => item.count)) : 10;

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
          <p style={{ color: mode === "dark" ? "#fff" : "#000" }}>
            <strong>Commandes:</strong> {payload[0].value}
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Spin tip={data.loadingProgress || "Chargement..."} />
          {data.loadingProgress && (
            <p style={{ 
              marginTop: 10, 
              fontSize: "12px", 
              color: mode === "dark" ? "#888" : "#666",
              textAlign: "center"
            }}>
              {data.loadingProgress}
            </p>
          )}
        </div>
      ) : data.error ? (
        <div style={{ color: "red", textAlign: "center" }}>
          {data.error}
        </div>
      ) : chartData.length > 0 ? (
        <div style={{ width: "100%", height: "300px", flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={[0, maxValue + Math.ceil(maxValue * 0.1)]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="count"
                fill="#1890ff"
                radius={[4, 4, 0, 0]}
                name="Commandes"
              />
            </BarChart>
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

export default OptimizedOrderEvolutionChart;