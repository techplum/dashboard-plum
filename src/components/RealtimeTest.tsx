import React, { useState, useEffect } from "react";
import { Card, Button, Space, Typography, Alert, Divider } from "antd";
import {
  WifiOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
} from "@ant-design/icons";
import {
  supabaseClient,
  testRealtimeConnection,
  checkRealtimeConnection,
  cleanupAllChannels,
  reconnectRealtime,
} from "../utility/supabaseClient";
import {
  setupNotificationChannel,
  fetchClaimChannels,
  getActiveNotificationChannels,
} from "../services/notification/notificationApi";

const { Text, Title } = Typography;

const RealtimeTest: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [notificationTestStatus, setNotificationTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const runDiagnostic = async () => {
    setTestStatus("testing");
    addLog("🔍 Début du diagnostic...");

    try {
      // 1. Vérifier la configuration
      addLog(`URL: ${import.meta.env.VITE_SUPABASE_URL}`);
      addLog(`Anon Key exists: ${!!import.meta.env.VITE_SUPABASE_ANON_KEY}`);
      addLog(
        `Service Role Key exists: ${!!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
      );

      // 2. Vérifier l'état actuel
      const channels = checkRealtimeConnection();
      addLog(`Canaux actifs: ${channels.length}`);

      // 3. Nettoyer les canaux existants
      addLog("🧹 Nettoyage des canaux existants...");
      cleanupAllChannels();

      // 4. Tester la connexion
      addLog("🧪 Test de connexion realtime...");
      const testChannel = testRealtimeConnection();

      // 5. Attendre le résultat
      setTimeout(() => {
        const finalChannels = checkRealtimeConnection();
        if (finalChannels.length > 0) {
          setTestStatus("success");
          addLog("✅ Test réussi! Connexion realtime fonctionne.");
        } else {
          setTestStatus("error");
          addLog("❌ Test échoué. Aucun canal actif.");
        }
      }, 3000);
    } catch (error) {
      setTestStatus("error");
      addLog(`❌ Erreur: ${error}`);
    }
  };

  const testNotifications = async () => {
    setNotificationTestStatus("testing");
    addLog("🔔 Test des notifications...");

    try {
      // 1. Récupérer les canaux de réclamation
      const claimChannels = await fetchClaimChannels();
      addLog(`Canaux de réclamation trouvés: ${claimChannels.length}`);

      if (claimChannels.length === 0) {
        setNotificationTestStatus("error");
        addLog("❌ Aucun canal de réclamation trouvé");
        return;
      }

      // 2. Créer un canal de notification de test
      const testNotificationChannel = setupNotificationChannel(
        claimChannels,
        (newMessage) => {
          addLog(`🔔 Notification reçue: ${newMessage.message}`);
          setNotificationTestStatus("success");
        },
      );

      // 3. Vérifier l'état après 3 secondes
      setTimeout(() => {
        const activeChannels = getActiveNotificationChannels();
        addLog(`Canaux de notification actifs: ${activeChannels.length}`);

        if (activeChannels.length > 0) {
          setNotificationTestStatus("success");
          addLog("✅ Test des notifications réussi!");
        } else {
          setNotificationTestStatus("error");
          addLog("❌ Test des notifications échoué.");
        }
      }, 3000);
    } catch (error) {
      setNotificationTestStatus("error");
      addLog(`❌ Erreur test notifications: ${error}`);
    }
  };

  const handleReconnect = async () => {
    addLog("🔄 Tentative de reconnexion...");
    try {
      await reconnectRealtime();
      addLog("✅ Reconnexion terminée");
    } catch (error) {
      addLog(`❌ Erreur de reconnexion: ${error}`);
    }
  };

  const getStatusIcon = () => {
    switch (testStatus) {
      case "success":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "error":
        return <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />;
      case "testing":
        return <ReloadOutlined spin style={{ color: "#1890ff" }} />;
      default:
        return <WifiOutlined style={{ color: "#8c8c8c" }} />;
    }
  };

  const getStatusText = () => {
    switch (testStatus) {
      case "success":
        return "Connexion OK";
      case "error":
        return "Erreur de connexion";
      case "testing":
        return "Test en cours...";
      default:
        return "Non testé";
    }
  };

  const getNotificationStatusText = () => {
    switch (notificationTestStatus) {
      case "success":
        return "Notifications OK";
      case "error":
        return "Erreur notifications";
      case "testing":
        return "Test notifications...";
      default:
        return "Notifications non testées";
    }
  };

  if (!isVisible) {
    return (
      <Button
        type="text"
        icon={<WifiOutlined />}
        onClick={() => setIsVisible(true)}
        style={{
          position: "fixed",
          bottom: "50px",
          // right: '20px',
          zIndex: 1000,
        }}
      >
        Test Realtime
      </Button>
    );
  }

  return (
    <Card
      title={
        <Space>
          {getStatusIcon()}
          <Title level={5} style={{ margin: 0 }}>
            Test Realtime
          </Title>
        </Space>
      }
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "500px",
        zIndex: 1000,
        maxHeight: "600px",
        overflow: "auto",
      }}
      extra={
        <Button type="text" size="small" onClick={() => setIsVisible(false)}>
          ×
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* Statut Realtime */}
        <Alert
          message={getStatusText()}
          type={
            testStatus === "success"
              ? "success"
              : testStatus === "error"
                ? "error"
                : "info"
          }
          showIcon={false}
        />

        {/* Statut Notifications */}
        <Alert
          message={getNotificationStatusText()}
          type={
            notificationTestStatus === "success"
              ? "success"
              : notificationTestStatus === "error"
                ? "error"
                : "info"
          }
          icon={<BellOutlined />}
          showIcon
        />

        {/* Actions */}
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={runDiagnostic}
            loading={testStatus === "testing"}
          >
            Test Realtime
          </Button>
          <Button
            icon={<BellOutlined />}
            onClick={testNotifications}
            loading={notificationTestStatus === "testing"}
          >
            Test Notifications
          </Button>
          <Button icon={<WifiOutlined />} onClick={handleReconnect}>
            Reconnecter
          </Button>
          <Button onClick={() => setLogs([])}>Effacer Logs</Button>
        </Space>

        <Divider />

        {/* Logs */}
        <div>
          <Text strong>Logs de diagnostic:</Text>
          <div
            style={{
              maxHeight: "300px",
              overflow: "auto",
              marginTop: "8px",
              padding: "8px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            {logs.length === 0 ? (
              <Text type="secondary">Aucun log pour le moment</Text>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ marginBottom: "4px" }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conseils */}
        {testStatus === "error" && (
          <Alert
            message="Problème Realtime"
            description="Vérifiez les variables d'environnement et les politiques RLS dans Supabase."
            type="warning"
            showIcon
          />
        )}

        {notificationTestStatus === "error" && (
          <Alert
            message="Problème Notifications"
            description="Vérifiez les canaux de réclamation et les permissions sur la table message_chat."
            type="warning"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

export default RealtimeTest;
