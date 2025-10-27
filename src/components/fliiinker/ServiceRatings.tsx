import React, { useState, useEffect } from "react";
import { Card, Typography, Rate, Avatar, Empty, Spin, Tag, Divider } from "antd";
import { UserOutlined, StarOutlined } from "@ant-design/icons";
import { supabaseClient } from "../../utility/supabaseClient";
import { serviceRoleClient } from "../../utility/supabaseServiceRole";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

interface ServiceRating {
  id: number;
  service_id: number;
  rating: number;
  comment: string | null;
  comment_is_visible: boolean;
  created_at: string;
  customer_id: string;
  order_id: number | null;
  customer?: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
  };
}

interface Service {
  service_id: number;
  service_type?: string;
}

interface ServiceRatingsProps {
  services: Service[];
  fliiinkerId: string;
}

export const ServiceRatings: React.FC<ServiceRatingsProps> = ({ services, fliiinkerId }) => {
  const [ratings, setRatings] = useState<ServiceRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [averageRatings, setAverageRatings] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    if (fliiinkerId) {
      fetchServiceRatings();
    }
  }, [fliiinkerId]);

  // Recalculer les moyennes quand les services changent
  useEffect(() => {
    if (ratings.length > 0) {
      const averages: { [key: number]: number } = {};
      const allServiceIds = [...new Set(ratings.map(r => r.service_id))];
      
      allServiceIds.forEach(serviceId => {
        const serviceRatings = ratings.filter(r => r.service_id === serviceId);
        if (serviceRatings.length > 0) {
          const sum = serviceRatings.reduce((acc, r) => acc + r.rating, 0);
          averages[serviceId] = sum / serviceRatings.length;
        }
      });
      
      setAverageRatings(averages);
    }
  }, [ratings]);

  const fetchServiceRatings = async () => {
    setLoading(true);
    console.log("🔍 Récupération des ratings pour fliiinkerId:", fliiinkerId);
    
    try {
      // Essayer d'abord avec le client normal
      let { data, error } = await supabaseClient
        .from("fliiinker_service_rating")
        .select(`
          *,
          customer:public_profile!public_fliiinker_service_rating_customer_id_fkey(
            id,
            first_name,
            last_name,
            avatar
          )
        `)
        .eq("fliiinker_id", fliiinkerId)
        .order("created_at", { ascending: false });

      // Si erreur d'autorisation (codes possibles: 42501, PGRST116, etc.), essayer avec service role
      if (error && (error.code === "42501" || error.code === "PGRST116" || error.message?.includes("permission") || error.message?.includes("insufficient"))) {
        console.log("⚠️ Erreur d'autorisation détectée:", error.code, error.message);
        console.log("⚠️ Tentative avec service role client");
        const result = await serviceRoleClient
          .from("fliiinker_service_rating")
          .select(`
            *,
            customer:public_profile!public_fliiinker_service_rating_customer_id_fkey(
              id,
              first_name,
              last_name,
              avatar
            )
          `)
          .eq("fliiinker_id", fliiinkerId)
          .order("created_at", { ascending: false });
        
        data = result.data;
        error = result.error;
        
        if (result.error) {
          console.log("❌ Échec également avec service role:", result.error);
        } else {
          console.log("✅ Succès avec service role client");
        }
      }

      if (error) {
        console.error("❌ Erreur finale lors de la récupération des ratings:", error);
        // On continue quand même pour afficher le composant avec un message
        setRatings([]);
        setAverageRatings({});
        return;
      }

      console.log("✅ Ratings récupérés:", data?.length || 0);
      console.log("📊 Données ratings:", data);

      setRatings(data || []);
      
      // Calculer les moyennes pour TOUS les services (pas seulement les actifs)
      const averages: { [key: number]: number } = {};
      const allServiceIds = [...new Set((data || []).map(r => r.service_id))];
      
      allServiceIds.forEach(serviceId => {
        const serviceRatings = (data || []).filter(r => r.service_id === serviceId);
        if (serviceRatings.length > 0) {
          const sum = serviceRatings.reduce((acc, r) => acc + r.rating, 0);
          averages[serviceId] = sum / serviceRatings.length;
        }
      });
      
      console.log("📈 Moyennes calculées:", averages);
      setAverageRatings(averages);

    } catch (error) {
      console.error("❌ Erreur lors de la récupération des ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceTypeName = (serviceId: number) => {
    const service = services.find(s => s.service_id === serviceId);
    if (service?.service_type) {
      return service.service_type;
    }
    
    // Mapping par défaut des service IDs
    switch (serviceId) {
      case 24: return "Garde d'animaux";
      case 25: return "Ménage/Linge";
      case 26: return "Garde d'enfant";
      default: return `Service #${serviceId}`;
    }
  };

  const getRatingsByService = (serviceId: number) => {
    return ratings.filter(r => r.service_id === serviceId);
  };

  if (loading) {
    return (
      <Card>
        <Title level={5}>Évaluations des Services</Title>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (ratings.length === 0) {
    return (
      <Card>
        <Title level={5}>Évaluations des Services</Title>
        <Empty 
          description="Aucune évaluation pour le moment"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  // Grouper les ratings par service
  const ratingsByService = ratings.reduce((acc, rating) => {
    if (!acc[rating.service_id]) {
      acc[rating.service_id] = [];
    }
    acc[rating.service_id].push(rating);
    return acc;
  }, {} as { [key: number]: ServiceRating[] });

  // Récupérer tous les IDs de services qui ont des ratings
  const allServiceIdsWithRatings = Object.keys(ratingsByService).map(id => parseInt(id));

  return (
    <Card>
      <Title level={5}>Évaluations des Services</Title>
      
      {allServiceIdsWithRatings.length === 0 ? (
        <Empty 
          description="Aucune évaluation pour le moment"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        allServiceIdsWithRatings.map(serviceId => {
          const serviceRatings = ratingsByService[serviceId] || [];
          const average = averageRatings[serviceId];
          const isActiveService = services.some(s => s.service_id === serviceId);
          
          if (serviceRatings.length === 0) return null;

          return (
            <div key={serviceId} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <StarOutlined style={{ color: "#faad14", marginRight: 8 }} />
                <Title level={5} style={{ margin: 0, opacity: isActiveService ? 1 : 0.7 }}>
                  {getServiceTypeName(serviceId)}
                  {!isActiveService && (
                    <Tag color="orange" style={{ marginLeft: 8 }}>
                      Service inactif
                    </Tag>
                  )}
                </Title>
                {average && (
                  <div style={{ marginLeft: 16, display: "flex", alignItems: "center" }}>
                    <Rate disabled value={average} allowHalf />
                    <Text strong style={{ marginLeft: 8 }}>
                      {average.toFixed(1)} ({serviceRatings.length} évaluation{serviceRatings.length > 1 ? 's' : ''})
                    </Text>
                  </div>
                )}
              </div>

              {serviceRatings.map(rating => (
                <Card
                  key={rating.id}
                  size="small"
                  style={{ 
                    marginBottom: 12, 
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    opacity: isActiveService ? 1 : 0.8
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <Avatar
                      size={40}
                      src={rating.customer?.avatar ? 
                        `${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${rating.customer.avatar}` : 
                        undefined
                      }
                      icon={!rating.customer?.avatar && <UserOutlined />}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                        <Text strong>
                          {rating.customer?.first_name || rating.customer?.last_name 
                            ? `${rating.customer.first_name || ''} ${rating.customer.last_name || ''}`.trim()
                            : 'Client anonyme'
                          }
                        </Text>
                        <Rate 
                          disabled 
                          value={rating.rating} 
                          style={{ marginLeft: 12, fontSize: 14 }} 
                        />
                        <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
                          {dayjs(rating.created_at).format("DD/MM/YYYY")}
                        </Text>
                      </div>
                      
                      {rating.comment && rating.comment_is_visible && (
                        <div style={{ 
                          marginTop: 8,
                          padding: "8px 12px",
                          backgroundColor: "rgba(24, 144, 255, 0.05)",
                          borderRadius: "8px",
                          borderLeft: "3px solid #1890ff"
                        }}>
                          <Text italic style={{ fontSize: 14 }}>
                            "{rating.comment}"
                          </Text>
                        </div>
                      )}
                      
                      {rating.order_id && (
                        <Tag color="blue" style={{ marginTop: 8 }}>
                          Commande #{rating.order_id}
                        </Tag>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              
              <Divider />
            </div>
          );
        })
      )}
    </Card>
  );
};
