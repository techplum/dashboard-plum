import React from 'react';
import { Typography, Avatar, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { FliiinkerCompleteProfile } from '../../types/FliiinkerCompleteProfile';

const { Title, Text } = Typography;

interface ProfileInfoProps {
  profileData: FliiinkerCompleteProfile;
  onImageClick: (imageUrl: string) => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({
  profileData,
  onImageClick,
}) => {
  const description =
    profileData.fliiinker_profile?.description || profileData.description;

  return (
    <div className="profile-card">
      <Avatar
        className="large-avatar"
        src={
          profileData.avatar
            ? `${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${profileData.avatar}`
            : undefined
        }
        size={80}
        icon={<UserOutlined />}
        style={{
          borderRadius: "50%",
          minWidth: "80px",
          minHeight: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          objectFit: "cover",
          cursor: profileData.avatar ? "pointer" : "default",
        }}
        onClick={() =>
          profileData.avatar && onImageClick(profileData.avatar)
        }
        onError={() => {
          console.error(
            "Erreur de chargement de l'avatar:",
            profileData.avatar,
          );
          return false;
        }}
      />
      <div className="profile-info">
        <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          {profileData.first_name} {profileData.last_name}
          {(profileData.fliiinker_profile?.is_pro || profileData.is_pro) && (
            <Tag color="gold" style={{ marginLeft: 10 }}>
              PRO
            </Tag>
          )}
        </Title>
        <Text
          type="secondary"
          style={{ fontSize: 16, display: "block", marginBottom: 12 }}
        >
          {profileData.fliiinker_profile?.tagline ||
            profileData.tagline ||
            (description
              ? description.substring(0, 50) +
                (description.length > 50 ? "..." : "")
              : "Fliiinker")}
        </Text>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {Array.isArray(profileData.fliiinker_profile?.spoken_languages) &&
            profileData.fliiinker_profile?.spoken_languages.map(
              (lang: any, index: number) => (
                <Tag
                  key={index}
                  color="blue"
                  icon={lang.emoji ? <span>{lang.emoji}</span> : null}
                >
                  {typeof lang === "object" ? lang.name || "Langue" : lang}
                </Tag>
              ),
            )}
          {Array.isArray(profileData.spoken_languages) &&
            profileData.spoken_languages.map((lang: any, index: number) => (
              <Tag
                key={index}
                color="blue"
                icon={lang.emoji ? <span>{lang.emoji}</span> : null}
              >
                {typeof lang === "object" ? lang.name || "Langue" : lang}
              </Tag>
            ))}
        </div>
      </div>
    </div>
  );
};
