import React from "react";
import { Card, Typography, Table, Tag } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { Public_profile } from "../../types/public_profileTypes";

const { Title, Text } = Typography;

interface AdminInfoProps {
  publicProfile: Public_profile;
}

export const AdminInfo: React.FC<AdminInfoProps> = ({ publicProfile }) => {
  const dataSource = [
    {
      key: "id",
      label: "Identifier",
      value: publicProfile.id,
      readOnly: true,
    },
    {
      key: "email",
      label: "Email",
      value: publicProfile.email,
      readOnly: true,
    },
    {
      key: "status",
      label: "Status",
      value: publicProfile.fliiinker_profile?.status || "Non spécifié",
      readOnly: false,
    },
    {
      key: "status_config", 
      label: "Status Config",
      value: publicProfile.fliiinker_profile?.status_config ? "Oui" : "Non",
      readOnly: true,
    },
    {
      key: "is_pro",
      label: "Is Pro",
      value: publicProfile.fliiinker_profile?.is_pro ? "Oui" : "Non",
      readOnly: true,
    },
    {
      key: "is_validated",
      label: "Is Validated", 
      value: publicProfile.fliiinker_profile?.is_validated ? "Oui" : "Non",
      readOnly: true,
    },
    {
      key: "created_at",
      label: "Créé le",
      value: new Date(publicProfile.created_at).toLocaleDateString(),
      readOnly: true,
    },
    {
      key: "fliiinker_created_at",
      label: "Profil Fliiinker créé le",
      value: publicProfile.fliiinker_profile?.created_at 
        ? new Date(publicProfile.fliiinker_profile.created_at).toLocaleDateString()
        : "N/A",
      readOnly: true,
    },
  ];

  const columns = [
    {
      title: "Champ",
      dataIndex: "label",
      key: "label",
      width: "40%",
      render: (text: string) => <Text strong>{text}:</Text>,
    },
    {
      title: "Valeur", 
      dataIndex: "value",
      key: "value",
      render: (value: string, record: any) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <Text>{value}</Text>
          {record.readOnly && (
            <LockOutlined style={{ color: "#999", marginLeft: "8px" }} />
          )}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <Title level={5}>Informations Administratives</Title>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        size="small"
        showHeader={false}
        style={{ marginTop: 16 }}
      />
    </Card>
  );
};
