import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import { Order } from "../../types/orderTypes";
import { OrderTrackingModal } from "./OrderTrackingModal";

interface TodayOrdersTableProps {
  orders: Order[];
  isDarkMode: boolean;
}

export const TodayOrdersTable: React.FC<TodayOrdersTableProps> = ({
  orders,
  isDarkMode,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filtrer les commandes d'aujourd'hui non terminées
  const todayUnfinishedOrders = useMemo(() => {
    const today = dayjs().format("YYYY-MM-DD");

    return orders.filter((order) => {
      const orderDate = dayjs(order.created_at).format("YYYY-MM-DD");
      const isToday = orderDate === today;
      const isNotCompleted =
        order.status !== "service_completed" && order.status !== "cancelled";

      return isToday && isNotCompleted;
    });
  }, [orders]);

  const getStatusLabel = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      created: "Créée",
      payment_confirmed: "Paiement confirmé",
      awaiting_start: "En attente de début",
      fliiinker_on_the_way: "Fliiinker en route",
      service_started: "Service démarré",
      service_start_confirmed: "Début confirmé",
      service_completed_before_due_date: "Service terminé en avance",
      customer_confirmed_ending: "Fin confirmée par client",
      service_completed: "Service terminé",
      cancelled: "Annulée",
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      created: "#ff9800",
      payment_confirmed: "#2196f3",
      awaiting_start: "#ffeb3b",
      fliiinker_on_the_way: "#9c27b0",
      service_started: "#ff5722",
      service_start_confirmed: "#4caf50",
      service_completed_before_due_date: "#8bc34a",
      customer_confirmed_ending: "#cddc39",
      service_completed: "#4caf50",
      cancelled: "#f44336",
    };
    return statusColors[status] || "#9e9e9e";
  };

  if (todayUnfinishedOrders.length === 0) {
    return (
      <div
        style={{
          backgroundColor: isDarkMode ? "#1f1f1f" : "#f5f5f5",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
          color: isDarkMode ? "#fff" : "#000",
        }}
      >
        <h3>Commandes d'aujourd'hui en cours</h3>
        <p>Aucune commande en cours pour aujourd'hui</p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          backgroundColor: isDarkMode ? "#1f1f1f" : "#f5f5f5",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            marginBottom: "20px",
            textAlign: "center",
            color: isDarkMode ? "#fff" : "#000",
          }}
        >
          Commandes d'aujourd'hui en cours ({todayUnfinishedOrders.length})
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
              borderRadius: "8px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: isDarkMode ? "#3a3a3a" : "#f8f9fa",
                }}
              >
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${
                      isDarkMode ? "#444" : "#dee2e6"
                    }`,
                    color: isDarkMode ? "#fff" : "#000",
                  }}
                >
                  ID Commande
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${
                      isDarkMode ? "#444" : "#dee2e6"
                    }`,
                    color: isDarkMode ? "#fff" : "#000",
                  }}
                >
                  Client
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${
                      isDarkMode ? "#444" : "#dee2e6"
                    }`,
                    color: isDarkMode ? "#fff" : "#000",
                  }}
                >
                  Fliiinker
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${
                      isDarkMode ? "#444" : "#dee2e6"
                    }`,
                    color: isDarkMode ? "#fff" : "#000",
                  }}
                >
                  Statut
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${
                      isDarkMode ? "#444" : "#dee2e6"
                    }`,
                    color: isDarkMode ? "#fff" : "#000",
                  }}
                >
                  Heure de création
                </th>
              </tr>
            </thead>
            <tbody>
              {todayUnfinishedOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode
                      ? "#3a3a3a"
                      : "#f8f9fa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode
                      ? "#2a2a2a"
                      : "#fff";
                  }}
                >
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: `1px solid ${
                        isDarkMode ? "#444" : "#dee2e6"
                      }`,
                      color: isDarkMode ? "#fff" : "#000",
                    }}
                  >
                    {String(order.id).slice(0, 8)}...
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: `1px solid ${
                        isDarkMode ? "#444" : "#dee2e6"
                      }`,
                      color: isDarkMode ? "#fff" : "#000",
                    }}
                  >
                    {order.customer?.first_name} {order.customer?.last_name}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: `1px solid ${
                        isDarkMode ? "#444" : "#dee2e6"
                      }`,
                      color: isDarkMode ? "#fff" : "#000",
                    }}
                  >
                    {order.fliiinker_profile?.public_profile?.first_name}{" "}
                    {order.fliiinker_profile?.public_profile?.last_name}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: `1px solid ${
                        isDarkMode ? "#444" : "#dee2e6"
                      }`,
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: getStatusColor(order.status),
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: `1px solid ${
                        isDarkMode ? "#444" : "#dee2e6"
                      }`,
                      color: isDarkMode ? "#fff" : "#000",
                    }}
                  >
                    {dayjs(order.created_at).format("HH:mm")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <OrderTrackingModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
};