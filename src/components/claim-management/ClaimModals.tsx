import React from "react";
import { Modal, Avatar, Typography, Descriptions } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface ClaimModalsProps {
  selectedClaim: any | null;
  providerProfile: any | null;
  isClientModalOpen: boolean;
  isProviderModalOpen: boolean;
  onCloseClientModal: () => void;
  onCloseProviderModal: () => void;
  cloudflareUrl: string;
}

export const ClaimModals: React.FC<ClaimModalsProps> = ({
  selectedClaim,
  providerProfile,
  isClientModalOpen,
  isProviderModalOpen,
  onCloseClientModal,
  onCloseProviderModal,
  cloudflareUrl,
}) => {
  return (
    <>
      {/* Modal détails client */}
      <Modal
        title="Détails du client"
        open={isClientModalOpen}
        onCancel={onCloseClientModal}
        footer={null}
        width={500}
      >
        {selectedClaim?.public_profile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Avatar
                size={64}
                src={
                  selectedClaim.public_profile.avatar && cloudflareUrl
                    ? `${cloudflareUrl}${
                        selectedClaim.public_profile.avatar.startsWith("/")
                          ? ""
                          : "/"
                      }${selectedClaim.public_profile.avatar}`
                    : undefined
                }
                icon={
                  !selectedClaim.public_profile.avatar ? (
                    <UserOutlined />
                  ) : undefined
                }
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {selectedClaim.public_profile.first_name}{" "}
                  {selectedClaim.public_profile.last_name}
                </Title>
                <Text type="secondary">Client</Text>
              </div>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="Nom complet">
                {selectedClaim.public_profile.first_name}{" "}
                {selectedClaim.public_profile.last_name}
              </Descriptions.Item>
              {selectedClaim.public_profile.email && (
                <Descriptions.Item label="Email">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <MailOutlined />
                    <a href={`mailto:${selectedClaim.public_profile.email}`}>
                      {selectedClaim.public_profile.email}
                    </a>
                  </div>
                </Descriptions.Item>
              )}
              {selectedClaim.public_profile.phone && (
                <Descriptions.Item label="Téléphone">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <PhoneOutlined />
                    <a href={`tel:${selectedClaim.public_profile.phone}`}>
                      {selectedClaim.public_profile.phone}
                    </a>
                  </div>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="ID utilisateur">
                {selectedClaim.user_id}
              </Descriptions.Item>
              {selectedClaim.public_profile.date_of_birth && (
                <Descriptions.Item label="Date de naissance">
                  {new Date(
                    selectedClaim.public_profile.date_of_birth,
                  ).toLocaleDateString()}
                </Descriptions.Item>
              )}
              {selectedClaim.public_profile.address && (
                <Descriptions.Item label="Adresse">
                  {selectedClaim.public_profile.address}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Modal détails prestataire */}
      <Modal
        title="Détails du prestataire"
        open={isProviderModalOpen}
        onCancel={onCloseProviderModal}
        footer={null}
        width={500}
      >
        {providerProfile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Avatar
                size={64}
                src={
                  providerProfile.avatar && cloudflareUrl
                    ? `${cloudflareUrl}${
                        providerProfile.avatar.startsWith("/")
                          ? ""
                          : "/"
                      }${providerProfile.avatar}`
                    : undefined
                }
                icon={
                  !providerProfile.avatar ? <UserOutlined /> : undefined
                }
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {providerProfile.first_name} {providerProfile.last_name}
                </Title>
                <Text type="secondary">Prestataire</Text>
              </div>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="Nom complet">
                {providerProfile.first_name} {providerProfile.last_name}
              </Descriptions.Item>
              {providerProfile.email && (
                <Descriptions.Item label="Email">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <MailOutlined />
                    <a href={`mailto:${providerProfile.email}`}>
                      {providerProfile.email}
                    </a>
                  </div>
                </Descriptions.Item>
              )}
              {providerProfile.phone && (
                <Descriptions.Item label="Téléphone">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <PhoneOutlined />
                    <a href={`tel:${providerProfile.phone}`}>
                      {providerProfile.phone}
                    </a>
                  </div>
                </Descriptions.Item>
              )}
              {providerProfile.date_of_birth && (
                <Descriptions.Item label="Date de naissance">
                  {new Date(providerProfile.date_of_birth).toLocaleDateString()}
                </Descriptions.Item>
              )}
              {providerProfile.address && (
                <Descriptions.Item label="Adresse">
                  {providerProfile.address}
                </Descriptions.Item>
              )}
              {providerProfile.bio && (
                <Descriptions.Item label="Biographie">
                  {providerProfile.bio}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </>
  );
};
