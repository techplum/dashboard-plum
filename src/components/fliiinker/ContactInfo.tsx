import React, { useState } from "react";
import { Card, Typography, Row, Col, Avatar, Tag, Button, Input, message } from "antd";
import { UserOutlined, PhoneOutlined, MailOutlined, EditOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { useUpdate } from "@refinedev/core";
import { Public_profile } from "../../types/public_profileTypes";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ContactInfoProps {
  publicProfile: Public_profile;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ publicProfile }) => {
  const supabase_url_storage_images = import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES;
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(publicProfile.fliiinker_profile?.description || "");
  const [messageApi, contextHolder] = message.useMessage();
  const { mutate: updateProfile } = useUpdate();

  const handleSaveDescription = async () => {
    try {
      await updateProfile({
        resource: "fliiinker_profile",
        id: publicProfile.fliiinker_profile?.id,
        values: { description: tempDescription },
      });
      
      messageApi.success("Description mise à jour avec succès");
      setIsEditingDescription(false);
      
      // Mettre à jour l'objet local
      if (publicProfile.fliiinker_profile) {
        publicProfile.fliiinker_profile.description = tempDescription;
      }
    } catch (error) {
      messageApi.error("Erreur lors de la mise à jour de la description");
      console.error("Erreur mise à jour description:", error);
    }
  };

  const handleCancelEdit = () => {
    setTempDescription(publicProfile.fliiinker_profile?.description || "");
    setIsEditingDescription(false);
  };

  return (
    <Card>
      {contextHolder}
      <Title level={5}>Informations de Contact</Title>
      
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        {publicProfile.avatar ? (
          <Avatar
            size={120}
            src={`${supabase_url_storage_images}/${publicProfile.avatar}`}
            style={{ border: "4px solid #f0f0f0" }}
          />
        ) : (
          <Avatar
            size={120}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          />
        )}
        <div style={{ marginTop: 12 }}>
          <Title level={4} style={{ margin: 0 }}>
            {publicProfile.first_name} {publicProfile.last_name}
          </Title>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <div className="contact-item">
            <MailOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            <Text strong>Email:</Text>
            <br />
            <Text copyable>{publicProfile.email}</Text>
          </div>
        </Col>
        
        <Col span={12}>
          <div className="contact-item">
            <PhoneOutlined style={{ marginRight: 8, color: "#52c41a" }} />
            <Text strong>Téléphone:</Text>
            <br />
            <Text copyable>{publicProfile.phone || "Non spécifié"}</Text>
          </div>
        </Col>

        <Col span={12}>
          <div className="contact-item">
            <Text strong>Date de naissance:</Text>
            <br />
            <Text>{publicProfile.birthday || "Non spécifiée"}</Text>
          </div>
        </Col>

        <Col span={12}>
          <div className="contact-item">
            <Text strong>Genre:</Text>
            <br />
            <Tag color={
              publicProfile.gender === "male" ? "blue" : 
              publicProfile.gender === "female" ? "pink" : "default"
            }>
              {publicProfile.gender === "male" ? "Homme" : 
               publicProfile.gender === "female" ? "Femme" : 
               publicProfile.gender || "Non spécifié"}
            </Tag>
          </div>
        </Col>

        {publicProfile.fliiinker_profile?.degree && (
          <Col span={12}>
            <div className="contact-item">
              <Text strong>Diplôme:</Text>
              <br />
              <Text>{publicProfile.fliiinker_profile.degree}</Text>
            </div>
          </Col>
        )}

        {publicProfile.fliiinker_profile?.spoken_languages && (
          <Col span={12}>
            <div className="contact-item">
              <Text strong>Langues parlées:</Text>
              <br />
              <div style={{ marginTop: 4 }}>
                {publicProfile.fliiinker_profile.spoken_languages.map((lang, index) => (
                  <Tag key={index} color="blue">
                    {typeof lang === "object" ? (lang as any).name || "Langue" : lang}
                  </Tag>
                ))}
              </div>
            </div>
          </Col>
        )}

        <Col span={24}>
          <div className="contact-item">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text strong>Description:</Text>
              {!isEditingDescription && (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => setIsEditingDescription(true)}
                />
              )}
            </div>
            {isEditingDescription ? (
              <div>
                <TextArea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  rows={4}
                  placeholder="Ajoutez une description..."
                  maxLength={500}
                />
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    size="small"
                    onClick={handleSaveDescription}
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
              <Text>{publicProfile.fliiinker_profile?.description || "Aucune description"}</Text>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
};
