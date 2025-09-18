import React, { useContext, useMemo } from "react";
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
import { ColorModeContext } from "../../contexts/color-mode";
import { useDashboardData } from "../../contexts/dashboard-data/DashboardDataContext";

const { RangePicker } = DatePicker;

const OptimizedSearchAndOrdersChart: React.FC = () => {
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

  // Préparer les données pour Recharts - Camembert avec useMemo pour optimiser
  const chartData = useMemo(() => {
    // Filtrer les dates invalides
    const validSearchDates = data.searches.filter((date) =>
      dayjs(date).isValid(),
    );

    // Compter le total des recherches et commandes
    const totalSearches = validSearchDates.length;
    const totalOrders = data.orders.length;

    if (totalSearches === 0 && totalOrders === 0) {
      return [];
    }

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
  }, [data.searches, data.orders]);

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

export default OptimizedSearchAndOrdersChart;