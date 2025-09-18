import React from "react";
import dayjs from "dayjs";
import { Order } from "../../types/orderTypes";

interface OrderTrackingModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

interface TrackingStep {
  status: string;
  label: string;
  description: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  isOpen,
  onClose,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  // Définir les étapes de suivi dans l'ordre chronologique
  const trackingSteps: TrackingStep[] = [
    {
      status: "created",
      label: "Commande créée",
      description: "La commande a été créée",
    },
    {
      status: "payment_confirmed",
      label: "Paiement confirmé",
      description: "Le paiement a été validé",
    },
    {
      status: "awaiting_start",
      label: "En attente de début",
      description: "En attente du début du service",
    },
    {
      status: "fliiinker_on_the_way",
      label: "Fliiinker en route",
      description: "Le Fliiinker est en route",
    },
    {
      status: "service_started",
      label: "Service démarré",
      description: "Le service a commencé",
    },
    {
      status: "service_start_confirmed",
      label: "Début confirmé",
      description: "Le début du service a été confirmé",
    },
    {
      status: "service_completed_before_due_date",
      label: "Service terminé",
      description: "Le service a été terminé avant l'heure prévue",
    },
    {
      status: "customer_confirmed_ending",
      label: "Fin confirmée",
      description: "Le client a confirmé la fin du service",
    },
    {
      status: "service_completed",
      label: "Service finalisé",
      description: "Le service est complètement terminé",
    },
  ];

  // Mapper les noms d'events aux statuts
  const eventToStatusMap: { [key: string]: string } = {
    confirm_payment: "payment_confirmed",
    awaiting_start: "awaiting_start",
    fliiinker_on_the_way: "fliiinker_on_the_way",
    fliiinker_start_service: "service_started",
    customer_confirm_start_service: "service_start_confirmed",
    fliiinker_complete_service: "service_completed_before_due_date",
    customer_complete_service: "customer_confirmed_ending",
  };

  // Analyser les events pour déterminer les étapes complétées
  const getCompletedSteps = () => {
    const completedSteps = new Set<string>();

    // Toujours marquer "created" comme complété si la commande existe
    completedSteps.add("created");

    // Analyser les events
    if (order.events && Array.isArray(order.events)) {
      order.events.forEach((event: any) => {
        if (event.name && eventToStatusMap[event.name]) {
          completedSteps.add(eventToStatusMap[event.name]);
        }
      });
    }

    return completedSteps;
  };

  // Obtenir la date d'un event spécifique
  const getEventDate = (targetStatus: string) => {
    if (targetStatus === "created") {
      return dayjs(order.created_at);
    }

    if (order.events && Array.isArray(order.events)) {
      for (const event of order.events) {
        if (event.name && eventToStatusMap[event.name] === targetStatus) {
          return dayjs(event.created_at);
        }
      }
    }

    return null;
  };

  const completedSteps = getCompletedSteps();

  const isStepCompleted = (status: string) => completedSteps.has(status);
  const getCurrentStepIndex = () => {
    for (let i = trackingSteps.length - 1; i >= 0; i--) {
      if (isStepCompleted(trackingSteps[i].status)) {
        return i;
      }
    }
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: isDarkMode ? "#1f1f1f" : "#fff",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: `1px solid ${isDarkMode ? "#444" : "#e0e0e0"}`,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: isDarkMode ? "#fff" : "#000",
              fontSize: "24px",
            }}
          >
            Suivi de commande
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: isDarkMode ? "#fff" : "#000",
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Order Info */}
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
            borderRadius: "8px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px 0",
              color: isDarkMode ? "#fff" : "#000",
            }}
          >
            <strong>ID:</strong> {String(order.id)}
          </p>
          <p
            style={{
              margin: "0 0 8px 0",
              color: isDarkMode ? "#fff" : "#000",
            }}
          >
            <strong>Client:</strong> {order.customer?.first_name}{" "}
            {order.customer?.last_name}
          </p>
          <p
            style={{
              margin: "0 0 8px 0",
              color: isDarkMode ? "#fff" : "#000",
            }}
          >
            <strong>Fliiinker:</strong>{" "}
            {order.fliiinker_profile?.public_profile?.first_name}{" "}
            {order.fliiinker_profile?.public_profile?.last_name}
          </p>
          <p style={{ margin: "0", color: isDarkMode ? "#fff" : "#000" }}>
            <strong>Créée le:</strong>{" "}
            {dayjs(order.created_at).format("DD/MM/YYYY à HH:mm")}
          </p>
        </div>

        {/* Timeline */}
        <div style={{ position: "relative" }}>
          <h3
            style={{
              marginBottom: "20px",
              color: isDarkMode ? "#fff" : "#000",
            }}
          >
            Chronologie du service
          </h3>

          {trackingSteps.map((step, index) => {
            const isCompleted = isStepCompleted(step.status);
            const isCurrent =
              index === currentStepIndex &&
              !isStepCompleted(trackingSteps[index + 1]?.status);
            const eventDate = getEventDate(step.status);

            return (
              <div
                key={step.status}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                  position: "relative",
                }}
              >
                {/* Timeline line */}
                {index < trackingSteps.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: "15px",
                      top: "30px",
                      width: "2px",
                      height: "40px",
                      backgroundColor: isCompleted ? "#4caf50" : "#e0e0e0",
                    }}
                  />
                )}

                {/* Step indicator */}
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor: isCompleted
                      ? "#4caf50"
                      : isCurrent
                        ? "#ff9800"
                        : "#e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "16px",
                    flexShrink: 0,
                    zIndex: 1,
                    position: "relative",
                  }}
                >
                  {isCompleted ? (
                    <span style={{ color: "#fff", fontSize: "16px" }}>✓</span>
                  ) : (
                    <span
                      style={{
                        color: isCurrent ? "#fff" : "#999",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Step content */}
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      margin: "0 0 4px 0",
                      color: isCompleted
                        ? "#4caf50"
                        : isCurrent
                          ? "#ff9800"
                          : isDarkMode
                            ? "#999"
                            : "#666",
                      fontSize: "16px",
                    }}
                  >
                    {step.label}
                  </h4>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      color: isDarkMode ? "#ccc" : "#666",
                      fontSize: "14px",
                    }}
                  >
                    {step.description}
                  </p>
                  {isCompleted && eventDate && (
                    <p
                      style={{
                        margin: 0,
                        color: "#4caf50",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {eventDate.format("DD/MM/YYYY à HH:mm:ss")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Debug info - Events data */}
        {order.events && order.events.length > 0 && (
          <details
            style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                color: isDarkMode ? "#fff" : "#000",
                marginBottom: "12px",
              }}
            >
              Données techniques (events)
            </summary>
            <pre
              style={{
                fontSize: "12px",
                color: isDarkMode ? "#ccc" : "#666",
                background: isDarkMode ? "#1a1a1a" : "#fff",
                padding: "12px",
                borderRadius: "4px",
                overflow: "auto",
              }}
            >
              {JSON.stringify(order.events, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};