import React from 'react';
import { Typography } from 'antd';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { FliiinkerCompleteProfile } from '../../types/FliiinkerCompleteProfile';

const { Title, Text } = Typography;

interface MeetingDetailsProps {
  meetingData: any;
  profileData: FliiinkerCompleteProfile;
}

export const MeetingDetails: React.FC<MeetingDetailsProps> = ({
  meetingData,
  profileData,
}) => {
  if (!meetingData) return null;

  const meetingDate = meetingData?.date_to_call
    ? dayjs(meetingData.date_to_call)
    : null;

  return (
    <div className="glass-section">
      <Title level={5}>Détails du rendez-vous</Title>
      <div className="detail-item">
        <CalendarOutlined style={{ color: "#1890ff" }} />
        <Text>
          {meetingDate
            ? meetingDate.format("DD MMMM YYYY")
            : "Date non définie"}
        </Text>
      </div>
      <div className="detail-item">
        <ClockCircleOutlined style={{ color: "#52c41a" }} />
        <Text>{meetingData.hour_to_call || "Heure non définie"}</Text>
      </div>
      <div className="detail-item">
        <EnvironmentOutlined style={{ color: "#faad14" }} />
        <Text>
          Fuseau horaire: {meetingData.timezone || "Non spécifié"}
        </Text>
      </div>
      <div className="detail-item">
        <MailOutlined style={{ color: "#eb2f96" }} />
        <Text>{profileData.email}</Text>
      </div>
      {profileData.phone && (
        <div className="detail-item">
          <PhoneOutlined style={{ color: "#722ed1" }} />
          <Text>{profileData.phone}</Text>
        </div>
      )}
    </div>
  );
};
