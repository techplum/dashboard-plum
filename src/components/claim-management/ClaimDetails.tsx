import React from "react";
import {
  Typography,
  Descriptions,
  Card,
  Skeleton,
  Empty,
  Steps,
  Avatar,
  Button,
} from "antd";
import {
  UserOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { ColorModeContext } from "../../contexts/color-mode";
import { useContext } from "react";

const { Title } = Typography;

interface ClaimDetailsProps {
  selectedClaim: any | null;
  orderDetails: any | null;
  orderLoading: boolean;
  providerProfile: any | null;
  isNarrow: boolean;
  isMobile: boolean;
  cloudflareUrl: string;
  createOrderTimeline: any[];
  onOpenClientModal: () => void;
  onOpenProviderModal: () => void;
}

// Définition de la chronologie complète des statuts
const ORDER_STATUS_TIMELINE = [
  {
    key: "created",
    label: "Commande créée",
    description: "La commande a été créée",
  },
  {
    key: "payment_confirmed",
    label: "Paiement confirmé",
    description: "Le paiement a été validé",
  },
  {
    key: "awaiting_start",
    label: "En attente de début",
    description: "En attente du début du service",
  },
  {
    key: "fliiinker_on_the_way",
    label: "Prestataire en route",
    description: "Le prestataire se dirige vers le lieu",
  },
  {
    key: "service_started",
    label: "Service démarré",
    description: "Le service a commencé",
  },
  {
    key: "service_start_confirmed",
    label: "Début confirmé",
    description: "Le début du service est confirmé",
  },
  {
    key: "service_completed_before_due_date",
    label: "Service terminé en avance",
    description: "Le service s'est terminé avant la date prévue",
  },
  {
    key: "customer_confirmed_ending",
    label: "Fin confirmée par le client",
    description: "Le client a confirmé la fin du service",
  },
  {
    key: "service_completed",
    label: "Service terminé",
    description: "Le service est complètement terminé",
  },
];

export const ClaimDetails: React.FC<ClaimDetailsProps> = ({
  selectedClaim,
  orderDetails,
  orderLoading,
  providerProfile,
  isNarrow,
  isMobile,
  cloudflareUrl,
  createOrderTimeline,
  onOpenClientModal,
  onOpenProviderModal,
}) => {
  const { mode } = useContext(ColorModeContext);

  if (isMobile) return null;

  return (
    <div
      style={{
        width: isNarrow ? 320 : 360,
        borderLeft: mode === "dark" ? "1px solid #303030" : "1px solid #e0e0e0",
        backgroundColor: mode === "dark" ? "#1f1f1f" : "#fff",
        height: "100%",
        overflow: "auto",
      }}
    >
      <div style={{ padding: 12 }}>
        <Title
          level={5}
          style={{
            marginTop: 0,
            color: mode === "dark" ? "#e8eaed" : "#202124",
          }}
        >
          Détails de la commande
        </Title>
        {orderLoading ? (
          <Skeleton active />
        ) : orderDetails ? (
          <Card
            size="small"
            bordered={false}
            style={{ background: "transparent" }}
          >
            <Descriptions
              column={1}
              size="small"
              labelStyle={{
                color: mode === "dark" ? "#9aa0a6" : "#5f6368",
              }}
            >
              <Descriptions.Item label="Order ID">
                {orderDetails.id}
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                {orderDetails.status?.replace(/_/g, " ")}
              </Descriptions.Item>
              <Descriptions.Item label="Date & heure de début">
                {new Date(orderDetails.start_date).toLocaleString()}
              </Descriptions.Item>
              {orderDetails.slug && (
                <Descriptions.Item label="Slug">
                  {orderDetails.slug}
                </Descriptions.Item>
              )}
              {orderDetails?.billing && (
                <>
                  <Descriptions.Item label="Total">
                    {orderDetails.billing.total_amount} €
                  </Descriptions.Item>
                  <Descriptions.Item label="Paiement">
                    {orderDetails.billing.payment_status?.replace(/_/g, " ")}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </Card>
        ) : (
          <Empty description="Aucun détail" />
        )}

        {/* Chronologie complète */}
        {createOrderTimeline.length > 0 && (
          <>
            <Title
              level={5}
              style={{
                marginTop: 16,
                color: mode === "dark" ? "#e8eaed" : "#202124",
              }}
            >
              Chronologie de la commande
            </Title>
            <Steps
              direction="vertical"
              size="small"
              current={createOrderTimeline.findLastIndex(
                (item) => item.status === "finish",
              )}
              items={createOrderTimeline}
              style={{ marginTop: 12 }}
            />
          </>
        )}

        {/* Bloc client */}
        {selectedClaim && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Title
                level={5}
                style={{
                  color: mode === "dark" ? "#e8eaed" : "#202124",
                  margin: 0,
                }}
              >
                Client
              </Title>
              <Button
                type="text"
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={onOpenClientModal}
              />
            </div>
            <Card
              size="small"
              bordered={false}
              style={{ background: "transparent", cursor: "pointer" }}
              onClick={onOpenClientModal}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Avatar
                  src={
                    selectedClaim?.public_profile?.avatar && cloudflareUrl
                      ? `${cloudflareUrl}${
                          selectedClaim.public_profile.avatar.startsWith("/")
                            ? ""
                            : "/"
                        }${selectedClaim.public_profile.avatar}`
                      : undefined
                  }
                  icon={
                    !selectedClaim?.public_profile?.avatar ? (
                      <UserOutlined />
                    ) : undefined
                  }
                />
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedClaim.public_profile?.first_name}{" "}
                    {selectedClaim.public_profile?.last_name}
                  </div>
                  {selectedClaim.public_profile?.email && (
                    <div
                      style={{
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MailOutlined />
                      {selectedClaim.public_profile.email}
                    </div>
                  )}
                  {selectedClaim.public_profile?.phone && (
                    <div
                      style={{
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <PhoneOutlined />
                      {selectedClaim.public_profile.phone}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Prestataire */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <Title
                level={5}
                style={{
                  color: mode === "dark" ? "#e8eaed" : "#202124",
                  margin: 0,
                }}
              >
                Prestataire
              </Title>
              {providerProfile && (
                <Button
                  type="text"
                  size="small"
                  icon={<InfoCircleOutlined />}
                  onClick={onOpenProviderModal}
                />
              )}
            </div>
            {orderLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : providerProfile ? (
              <Card
                size="small"
                bordered={false}
                style={{ background: "transparent", cursor: "pointer" }}
                onClick={onOpenProviderModal}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Avatar
                    src={
                      providerProfile?.avatar && cloudflareUrl
                        ? `${cloudflareUrl}${
                            providerProfile.avatar.startsWith("/") ? "" : "/"
                          }${providerProfile.avatar}`
                        : undefined
                    }
                    icon={
                      !providerProfile?.avatar ? <UserOutlined /> : undefined
                    }
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {providerProfile?.first_name} {providerProfile?.last_name}
                    </div>
                    {providerProfile?.email && (
                      <div
                        style={{
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <MailOutlined />
                        {providerProfile.email}
                      </div>
                    )}
                    {providerProfile?.phone && (
                      <div
                        style={{
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <PhoneOutlined />
                        {providerProfile.phone}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Empty description="Prestataire introuvable" />
            )}
          </>
        )}
      </div>
    </div>
  );
};
