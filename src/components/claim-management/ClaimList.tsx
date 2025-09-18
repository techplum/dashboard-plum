import React from "react";
import {
  List,
  Avatar,
  Tag,
  Typography,
  Input,
  Select,
  Button,
  Empty,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { ColorModeContext } from "../../contexts/color-mode";
import { useContext } from "react";

const { Title } = Typography;

interface ClaimListProps {
  claims: any[];
  filteredClaims: any[];
  selectedClaim: any | null;
  searchFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClaimSelect: (claim: any) => void;
  onClearAllFilters: () => void;
  isMobile: boolean;
  isNarrow: boolean;
  showMobileChat: boolean;
  cloudflareUrl: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN_UNPROCESSED":
      return "#ea4335";
    case "OPEN_IN_PROGRESS":
      return "#1a73e8";
    case "RESOLVED":
      return "#34a853";
    case "PENDING_RESPONSE":
      return "#fbbc04";
    default:
      return "#9aa0a6";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "OPEN_UNPROCESSED":
      return <ExclamationCircleOutlined />;
    case "OPEN_IN_PROGRESS":
      return <ClockCircleOutlined />;
    case "RESOLVED":
      return <CheckCircleOutlined />;
    case "PENDING_RESPONSE":
      return <CommentOutlined />;
    default:
      return <MessageOutlined />;
  }
};

export const ClaimList: React.FC<ClaimListProps> = ({
  claims,
  filteredClaims,
  selectedClaim,
  searchFilter,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onClaimSelect,
  onClearAllFilters,
  isMobile,
  isNarrow,
  showMobileChat,
  cloudflareUrl,
}) => {
  const { mode } = useContext(ColorModeContext);

  return (
    <div
      className="claims-list"
      style={{
        width: isMobile
          ? showMobileChat
            ? "0%"
            : "100%"
          : isNarrow
            ? 280
            : 300,
        borderRight:
          mode === "dark" ? "1px solid #303030" : "1px solid #e0e0e0",
        backgroundColor: mode === "dark" ? "#1f1f1f" : "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: isMobile && showMobileChat ? "hidden" : "auto",
        transition: "width 0.3s ease",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          padding: "1rem",
          backgroundColor: mode === "dark" ? "#1f1f1f" : "#fff",
        }}
      >
        <Title
          level={4}
          style={{
            margin: 0,
            color: mode === "dark" ? "#e8eaed" : "#202124",
          }}
        >
          Gestion de Réclamation
        </Title>
        <Input
          placeholder="Rechercher par nom, prénom, Order ID ou Claim ID..."
          prefix={<SearchOutlined />}
          value={searchFilter}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            marginTop: "0.5rem",
            marginBottom: "0.5rem",
          }}
          allowClear
        />

        {/* Filtre par statut */}
        <Select
          placeholder="Filtrer par statut"
          value={statusFilter}
          onChange={onStatusFilterChange}
          style={{
            width: "100%",
            marginBottom: "1rem",
          }}
          allowClear
          options={[
            { value: "all", label: "Tous les statuts" },
            {
              value: "OPEN_UNPROCESSED",
              label: "Non traité",
              style: { color: "#ea4335" },
            },
            {
              value: "OPEN_IN_PROGRESS",
              label: "En cours",
              style: { color: "#1a73e8" },
            },
            {
              value: "PENDING_RESPONSE",
              label: "En attente de réponse",
              style: { color: "#fbbc04" },
            },
            {
              value: "RESOLVED",
              label: "Résolu",
              style: { color: "#34a853" },
            },
          ]}
        />

        {/* Compteur de résultats */}
        {(searchFilter || statusFilter !== "all") && (
          <div style={{ marginTop: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <Typography.Text
                style={{
                  fontSize: 12,
                  color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                }}
              >
                {filteredClaims.length} résultat(s) trouvé(s)
              </Typography.Text>

              <Button
                type="text"
                size="small"
                onClick={onClearAllFilters}
                style={{ fontSize: 10, padding: "0 4px" }}
              >
                Effacer tout
              </Button>
            </div>

            {/* Badges des filtres actifs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {searchFilter && (
                <Tag
                  closable
                  onClose={() => onSearchChange("")}
                  style={{ fontSize: 10 }}
                >
                  Recherche: "{searchFilter}"
                </Tag>
              )}
              {statusFilter !== "all" && (
                <Tag
                  closable
                  onClose={() => onStatusFilterChange("all")}
                  color={getStatusColor(statusFilter)}
                  style={{ fontSize: 10 }}
                >
                  {statusFilter.replace(/_/g, " ")}
                </Tag>
              )}
            </div>
          </div>
        )}
      </div>

      {filteredClaims.length === 0 ? (
        <Empty
          description={
            <span style={{ color: mode === "dark" ? "#e8eaed" : "#202124" }}>
              {searchFilter || statusFilter !== "all"
                ? "Aucun résultat trouvé"
                : "Aucune réclamation trouvée"}
            </span>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: "2rem 0" }}
        />
      ) : (
        <div className="claims-list-container" style={{ flex: 1, overflowY: "auto" }}>
          <List
            dataSource={filteredClaims}
            renderItem={(claim: any) => {
              const isSelected =
                selectedClaim &&
                (selectedClaim.id === claim.id ||
                  selectedClaim.claim_id === claim.claim_id);
              const customer = claim.public_profile || {};
              return (
                <div
                  key={`${claim.claim_id}-${claim.status}-${claim.updated_at || claim.created_at}`}
                  className={`claim-item ${isSelected ? "selected" : ""}`}
                  onClick={() => onClaimSelect(claim)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom:
                      mode === "dark"
                        ? "1px solid #303030"
                        : "1px solid #e0e0e0",
                    backgroundColor:
                      mode === "dark"
                        ? isSelected
                          ? "rgba(26,115,232,0.15)"
                          : "#242424"
                        : isSelected
                          ? "rgba(26,115,232,0.08)"
                          : "#fff",
                  }}
                >
                  <div style={{ display: "flex", width: "100%" }}>
                    <div style={{ marginRight: 12 }}>
                      <Avatar
                        src={
                          customer.avatar && cloudflareUrl
                            ? `${cloudflareUrl}${
                                customer.avatar.startsWith("/") ? "" : "/"
                              }${customer.avatar}`
                            : undefined
                        }
                        icon={!customer.avatar ? <UserOutlined /> : undefined}
                        size={40}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            color: mode === "dark" ? "#e8eaed" : "#202124",
                            fontWeight: 500,
                          }}
                        >
                          {(customer.first_name || "") +
                            " " +
                            (customer.last_name || "")}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                              fontSize: 12,
                            }}
                          >
                            {claim.lastMessageTimestamp
                              ? new Date(
                                  claim.lastMessageTimestamp,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                          <Tag color={getStatusColor(claim.status)}>
                            {getStatusIcon(claim.status)}
                          </Tag>
                        </div>
                      </div>
                      <div
                        style={{
                          color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {claim.lastMessagePreview || ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}
    </div>
  );
};
