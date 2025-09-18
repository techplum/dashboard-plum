import React, { useState, useContext, useEffect } from "react";
import { DatePicker, Spin } from "antd";
import { fetchAllOrderInPeriodForAnalytics } from "../../services/analytics/order/allOrderApi";
import { Order } from "../../types/orderTypes";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import { ColorModeContext } from "../../contexts/color-mode";
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

const OrderEvolutionBarChart: React.FC = () => {
  const { mode } = useContext(ColorModeContext);
  const [loading, setLoading] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<Order[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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
  }, []);

  const fetchOrdersByDate = async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      const orders = await fetchAllOrderInPeriodForAnalytics(
        startDate,
        endDate,
      );
      setOrderData(orders);
    } catch (error) {
      console.error(
        "------ Error on fetch order by date (allOrderComponent): ",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

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
      setStartDate(startDatePicker);
      setEndDate(endDatePicker);
      fetchOrdersByDate(startDatePicker, endDatePicker);
    }
  };

  const data =
    orderData.length > 0
      ? getOrdersByPeriod(orderData, startDate, endDate)
      : [];

  const maxValue = data.length > 0 ? Math.max(...data.map((item) => item.count)) : 10;

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
          startDate && endDate ? [dayjs(startDate), dayjs(endDate)] : undefined
        }
        style={{ marginBottom: "10px" }}
      />
      {loading ? (
        <Spin tip="Loading..." />
      ) : data.length > 0 ? (
        <div style={{ width: "100%", height: "300px", flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
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

export default OrderEvolutionBarChart;
