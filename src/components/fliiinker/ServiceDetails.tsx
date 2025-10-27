import React, { useState } from "react";
import { Card, Typography, Row, Col, Tag, Button, Input, InputNumber, message, Space } from "antd";
import { 
  DollarCircleOutlined, 
  TagsOutlined, 
  EditOutlined, 
  SaveOutlined, 
  CloseOutlined,
  SettingOutlined 
} from "@ant-design/icons";
import { useUpdate } from "@refinedev/core";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Service {
  id?: number;
  service_id: number;
  hourly_rate?: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  options?: any;
  tags?: string[];
  service_type?: string;
  fliiinker_id?: string;
}

interface ServiceDetailsProps {
  services: Service[];
  fliiinkerId: string;
}

export const ServiceDetails: React.FC<ServiceDetailsProps> = ({ services, fliiinkerId }) => {
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [tempDescription, setTempDescription] = useState("");
  const [tempHourlyRate, setTempHourlyRate] = useState<number>(0);
  const [messageApi, contextHolder] = message.useMessage();
  const { mutate: updateService } = useUpdate();

  const getServiceTypeName = (serviceId: number) => {
    switch (serviceId) {
      case 24: return "Garde d'animaux";
      case 25: return "Ménage/Linge";
      case 26: return "Garde d'enfant";
      default: return `Service #${serviceId}`;
    }
  };

  const handleEditService = (service: Service) => {
    setEditingServiceId(service.service_id);
    setTempDescription(service.description || "");
    setTempHourlyRate(service.hourly_rate || 0);
  };

  const handleSaveService = async (serviceId: number) => {
    try {
      await updateService({
        resource: "fliiinker_service_mtm",
        id: { service_id: serviceId, fliiinker_id: fliiinkerId },
        values: {
          description: tempDescription,
          hourly_rate: tempHourlyRate,
        },
      });

      messageApi.success("Service mis à jour avec succès");
      setEditingServiceId(null);

      // Mettre à jour l'objet local
      const serviceIndex = services.findIndex(s => s.service_id === serviceId);
      if (serviceIndex !== -1) {
        services[serviceIndex].description = tempDescription;
        services[serviceIndex].hourly_rate = tempHourlyRate;
      }
    } catch (error) {
      messageApi.error("Erreur lors de la mise à jour du service");
      console.error("Erreur mise à jour service:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingServiceId(null);
    setTempDescription("");
    setTempHourlyRate(0);
  };

  if (!services || services.length === 0) {
    return (
      <Card>
        <Title level={5}>Services proposés</Title>
        <Text type="secondary">Aucun service proposé</Text>
      </Card>
    );
  }

  return (
    <Card>
      {contextHolder}
      <Title level={5}>Services proposés</Title>
      
      {services.map((service, index) => (
        <Card
          key={`${service.service_id}-${index}`}
          className="service-card"
          title={
            <Space>
              <DollarCircleOutlined
                style={{ color: service.is_active ? "#52c41a" : "#ff4d4f" }}
              />
              <Text>{service.service_type || getServiceTypeName(service.service_id)}</Text>
              <Tag color={service.is_active ? "success" : "error"}>
                {service.is_active ? "Actif" : "Inactif"}
              </Tag>
              {editingServiceId !== service.service_id && (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleEditService(service)}
                />
              )}
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div className="contact-item">
                <Text strong>Tarif horaire:</Text>
                <br />
                {editingServiceId === service.service_id ? (
                  <InputNumber
                    value={tempHourlyRate}
                    onChange={(value) => setTempHourlyRate(value || 0)}
                    min={0}
                    max={999}
                    step={0.5}
                    style={{ width: "100%" }}
                    addonAfter="€/h"
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
                    <div className="price-tag">
                      <DollarCircleOutlined />
                      {service.hourly_rate ? `${service.hourly_rate} €/h` : "Non défini"}
                    </div>
                  </div>
                )}
              </div>
            </Col>

            <Col span={12}>
              <div className="contact-item">
                <Text strong>Date création:</Text>
                <br />
                <div style={{ marginTop: 8 }}>
                  <Tag 
                    color="blue" 
                    style={{ 
                      fontSize: "12px",
                      padding: "2px 8px",
                      borderRadius: "12px"
                    }}
                  >
                    {service.created_at
                      ? dayjs(service.created_at).format("DD/MM/YYYY")
                      : "Non définie"}
                  </Tag>
                </div>
              </div>
            </Col>

            {service.options && (
              <Col span={24}>
                <div className="contact-item">
                  <Text strong>Super Pouvoirs:</Text>
                  <br />
                  <div style={{ marginTop: 8 }}>
                    {Array.isArray(service.options?.superpowers) ? (
                      <Space wrap>
                        {service.options.superpowers.map((power: any, idx: number) => (
                          <div key={idx} className="superpower-tag">
                            <span>{power.emoji}</span>
                            {power.name}
                          </div>
                        ))}
                      </Space>
                    ) : (
                      <Tag icon={<SettingOutlined />} color="blue">
                        {typeof service.options === "object" 
                          ? JSON.stringify(service.options) 
                          : service.options}
                      </Tag>
                    )}
                  </div>
                </div>
              </Col>
            )}

            <Col span={24}>
              <div className="contact-item">
                <Text strong>Description:</Text>
                <br />
                {editingServiceId === service.service_id ? (
                  <div style={{ marginTop: 8 }}>
                    <TextArea
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      rows={3}
                      placeholder="Description du service..."
                      maxLength={300}
                    />
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        size="small"
                        onClick={() => handleSaveService(service.service_id)}
                      >
                        Sauvegarder
                      </Button>
                      <Button
                        icon={<CloseOutlined />}
                        size="small"
                        onClick={handleCancelEdit}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Text>{service.description || "Aucune description"}</Text>
                )}
              </div>
            </Col>

            {service.tags && service.tags.length > 0 && (
              <Col span={24}>
                <div className="contact-item">
                  <Space style={{ marginTop: 8 }}>
                    <TagsOutlined />
                    <Text strong>Tags:</Text>
                    {service.tags.map((tag, i) => (
                      <Tag key={i} color="blue">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
              </Col>
            )}
          </Row>
        </Card>
      ))}
    </Card>
  );
};
