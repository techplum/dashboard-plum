import React from "react";
import { Avatar, Typography, Select, Button } from "antd";
import { MessageOutlined, UserOutlined } from "@ant-design/icons";
import { ColorModeContext } from "../../contexts/color-mode";
import { useContext } from "react";
import { Chatbox, Session } from "@talkjs/react";
import Talk from "talkjs";

const { Title } = Typography;

interface ClaimChatProps {
  selectedClaim: any | null;
  isMobile: boolean;
  showMobileChat: boolean;
  onBackToList: () => void;
  onStatusChange: (newStatus: string) => void;
  talkAppId: string;
  currentAdminId: string;
  cloudflareUrl: string;
  talkUser: Talk.User | null;
  syncUserFn: () => Talk.User;
  syncConversation: (session: Talk.Session) => any;
  handleAfterSendMessage: () => void;
  mode: string;
}

export const ClaimChat: React.FC<ClaimChatProps> = ({
  selectedClaim,
  isMobile,
  showMobileChat,
  onBackToList,
  onStatusChange,
  talkAppId,
  currentAdminId,
  cloudflareUrl,
  talkUser,
  syncUserFn,
  syncConversation,
  handleAfterSendMessage,
  mode,
}) => {
  const { mode: colorMode } = useContext(ColorModeContext);

  return (
    <div
      className="chat-container"
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: mode === "dark" ? "#1f1f1f" : "#fff",
        height: "100%",
        minHeight: 0,
        padding: 0,
        display: isMobile && !showMobileChat ? "none" : "flex",
        flexDirection: "column",
      }}
    >
      {/* Header du chat: avatar, nom, Order ID, statut claim */}
      {selectedClaim && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderBottom:
              mode === "dark" ? "1px solid #303030" : "1px solid #e0e0e0",
            background: mode === "dark" ? "#1f1f1f" : "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <Button
                type="text"
                icon={
                  <MessageOutlined style={{ transform: "rotate(180deg)" }} />
                }
                onClick={onBackToList}
                style={{ marginRight: 8 }}
              />
            )}
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
              size={40}
            />
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: mode === "dark" ? "#e8eaed" : "#202124",
                }}
              >
                {selectedClaim.public_profile?.first_name}{" "}
                {selectedClaim.public_profile?.last_name}
              </div>
              {selectedClaim.order_id && (
                <div
                  style={{
                    fontSize: 12,
                    color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                  }}
                >
                  Order ID: {selectedClaim.order_id}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Select
              key={`status-select-${selectedClaim.claim_id}-${selectedClaim.status}`}
              size="small"
              value={selectedClaim.status}
              onChange={onStatusChange}
              style={{ width: 180 }}
              dropdownStyle={{
                backgroundColor: mode === "dark" ? "#1f1f1f" : "#fff",
              }}
              options={[
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
            {/* Debug - Current status */}
            <span
              style={{
                fontSize: 10,
                color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                marginLeft: 8,
              }}
            >
              [{selectedClaim.status}]
            </span>
          </div>
        </div>
      )}

      {selectedClaim?.channel_id && talkUser ? (
        <Session appId={talkAppId} syncUser={syncUserFn}>
          <div
            style={{
              position: "relative",
              width: "100%",
              display: "flex",
              flex: 1,
              minHeight: 0,
            }}
          >
            <style>{`
              .talkjs-container, .talkjs-container > div, .talkjs-container iframe { width: 100% !important; height: 100% !important; }
            `}</style>
            <Chatbox
              syncConversation={syncConversation as any}
              onSendMessage={() => handleAfterSendMessage()}
              theme={
                mode === "dark" ? ("default-dark" as any) : ("default" as any)
              }
              style={{
                flex: 1,
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </div>
        </Session>
      ) : (
        <div
          className="empty-state"
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <MessageOutlined
            className="empty-state-icon"
            style={{
              color: mode === "dark" ? "#9aa0a6" : "#5f6368",
              fontSize: 24,
            }}
          />
          <Title
            level={4}
            style={{
              color: mode === "dark" ? "#e8eaed" : "#202124",
              marginTop: 12,
            }}
          >
            Aucune réclamation sélectionnée
          </Title>
          <Typography.Text
            style={{ color: mode === "dark" ? "#9aa0a6" : "#5f6368" }}
          >
            Sélectionnez une réclamation dans la liste pour ouvrir le chat
          </Typography.Text>
        </div>
      )}
    </div>
  );
};
