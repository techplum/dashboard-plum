import React from "react";
import { Card, Space, Row, Col } from "antd";
import { Line } from "@ant-design/charts";
import { fetchAllOrderInPeriodForAnalytics } from "../../api/order";
import { fetchAllClaimInPeriod } from "../../services/claims/claimApi";

const OrderDashboard: React.FC = () => {
  const fetchFunctions = {
    orders: fetchAllOrderInPeriodForAnalytics,
    claims: fetchAllClaimInPeriod,
  };

  const prepareChartData = (data: { [key: string]: any[] }) => {
    const chartData: any[] = [];

    if (data.orders && data.orders.length > 0) {
      // Regrouper les commandes par date
      const ordersByDate: { [date: string]: number } = {};
      data.orders.forEach((order) => {
        const date = new Date(order.createdAt).toISOString().split("T")[0];
        ordersByDate[date] = (ordersByDate[date] || 0) + 1;
      });

      // Convertir en format pour Ant Design Charts
      Object.entries(ordersByDate).forEach(([date, count]) => {
        chartData.push({
          date,
          type: "Commandes",
          count,
        });
      });
    }

    if (data.claims && data.claims.length > 0) {
      // Regrouper les réclamations par date
      const claimsByDate: { [date: string]: number } = {};
      data.claims.forEach((claim) => {
        const date = new Date(claim.createdAt).toISOString().split("T")[0];
        claimsByDate[date] = (claimsByDate[date] || 0) + 1;
      });

      // Convertir en format pour Ant Design Charts
      Object.entries(claimsByDate).forEach(([date, count]) => {
        chartData.push({
          date,
          type: "Réclamations",
          count,
        });
      });
    }

    return chartData.sort((a, b) => a.date.localeCompare(b.date));
  };

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Tableau de bord des commandes" bordered={false}>
            <div style={{ height: "400px" }}>
              <Line
                data={[]} // Les données seront chargées dynamiquement
                xField="date"
                yField="count"
                seriesField="type"
                color={["#1890ff", "#ff4d4f"]}
                point={{
                  size: 5,
                  shape: "circle",
                }}
                line={{
                  style: {
                    lineWidth: 3,
                  },
                }}
                legend={{
                  position: "top",
                }}
                xAxis={{
                  title: {
                    text: "Date",
                  },
                }}
                yAxis={{
                  title: {
                    text: "Nombre",
                  },
                }}
                smooth={true}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OrderDashboard;
