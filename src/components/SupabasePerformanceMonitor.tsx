import React, { useEffect, useState } from 'react';
import { Card, Badge, Space, Typography, Button, Alert } from 'antd';
import { 
  WifiOutlined, 
  ReloadOutlined, 
  ExclamationCircleOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import { supabaseClient, checkRealtimeConnection, cleanupAllChannels, reconnectRealtime } from '../utility/supabaseClient';
import { getActiveNotificationChannels } from '../services/notification/notificationApi';
import { getActiveChatChannels } from '../services/chat/chatApi';

const { Text, Title } = Typography;

interface ConnectionStatus {
  realtime: boolean;
  channels: any[];
  notificationChannels: string[];
  chatChannels: string[];
  lastCheck: Date;
}

const SupabasePerformanceMonitor: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    realtime: false,
    channels: [],
    notificationChannels: [],
    chatChannels: [],
    lastCheck: new Date(),
  });
  const [isVisible, setIsVisible] = useState(false);

  const checkStatus = () => {
    const channels = checkRealtimeConnection();
    const notificationChannels = getActiveNotificationChannels();
    const chatChannels = getActiveChatChannels();
    
    setStatus({
      realtime: supabaseClient.realtime?.isConnected?.() || false,
      channels,
      notificationChannels,
      chatChannels,
      lastCheck: new Date(),
    });
  };

  useEffect(() => {
    // Vérifier le statut toutes les 10 secondes
    const interval = setInterval(checkStatus, 10000);
    checkStatus(); // Vérification initiale

    return () => clearInterval(interval);
  }, []);

  const handleReconnect = async () => {
    try {
      await reconnectRealtime();
      setTimeout(checkStatus, 2000); // Re-vérifier après 2 secondes
    } catch (error) {
      console.error('Erreur lors de la reconnexion:', error);
    }
  };

  const handleCleanup = () => {
    cleanupAllChannels();
    setTimeout(checkStatus, 1000);
  };

  const getConnectionIcon = () => {
    if (status.realtime) {
      return <WifiOutlined style={{ color: '#52c41a' }} />;
    }
  };

  const getConnectionText = () => {
    if (status.realtime) {
      return 'Connecté';
    }
    return 'Déconnecté';
  };

  if (!isVisible) {
    return (
      <Button
        type="text"
        icon={<WifiOutlined />}
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          background: status.realtime ? '#f6ffed' : '#fff2f0',
          border: status.realtime ? '1px solid #b7eb8f' : '1px solid #ffccc7',
        }}
      />
    );
  }

  return (
    <Card
      title={
        <Space>
          {getConnectionIcon()}
          <Title level={5} style={{ margin: 0 }}>
            Monitoring Realtime
          </Title>
        </Space>
      }
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        zIndex: 1000,
        maxHeight: '500px',
        overflow: 'auto',
      }}
      extra={
        <Button
          type="text"
          size="small"
          onClick={() => setIsVisible(false)}
        >
          ×
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Statut de connexion */}
        <Alert
          message={
            <Space>
              <Badge 
                status={status.realtime ? 'success' : 'error'} 
                text={getConnectionText()}
              />
              <Text type="secondary">
                Dernière vérification: {status.lastCheck.toLocaleTimeString()}
              </Text>
            </Space>
          }
          type={status.realtime ? 'success' : 'error'}
          showIcon={false}
        />

        {/* Canaux actifs */}
        <div>
          <Text strong>Canaux actifs:</Text>
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary">Realtime: {status.channels.length}</Text>
            <br />
            <Text type="secondary">Notifications: {status.notificationChannels.length}</Text>
            <br />
            <Text type="secondary">Chat: {status.chatChannels.length}</Text>
          </div>
        </div>

        {/* Détails des canaux */}
        {status.channels.length > 0 && (
          <div>
            <Text strong>Détails des canaux:</Text>
            <div style={{ maxHeight: '150px', overflow: 'auto', marginTop: '8px' }}>
                             {status.channels.map((channel, index) => (
                 <div key={index} style={{ fontSize: '12px', marginBottom: '4px' }}>
                   <Text code>{channel.topic}</Text>
                   <Badge 
                     status={channel.state === 'SUBSCRIBED' ? 'success' : 'default'} 
                     text={channel.state}
                     style={{ marginLeft: '8px' }}
                   />
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <Space>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={checkStatus}
          >
            Vérifier
          </Button>
          <Button
            size="small"
            icon={<WifiOutlined />}
            onClick={handleReconnect}
            disabled={status.realtime}
          >
            Reconnecter
          </Button>
          <Button
            size="small"
            icon={<ExclamationCircleOutlined />}
            onClick={handleCleanup}
            danger
          >
            Nettoyer
          </Button>
        </Space>

        {/* Conseils */}
        {!status.realtime && (
          <Alert
            message="Connexion perdue"
            description="La connexion realtime est interrompue. Essayez de reconnecter ou vérifiez votre connexion internet."
            type="warning"
            showIcon
          />
        )}

        {status.channels.length > 10 && (
          <Alert
            message="Trop de canaux"
            description="Il y a beaucoup de canaux actifs. Considérez nettoyer les canaux inutilisés."
            type="info"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

export default SupabasePerformanceMonitor;