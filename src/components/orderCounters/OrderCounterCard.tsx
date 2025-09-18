import React from "react";

interface OrderCounterCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  gradient: string;
  isLoading?: boolean;
  mode?: string;
}

export const OrderCounterCard: React.FC<OrderCounterCardProps> = ({
  title,
  count,
  icon,
  gradient,
  isLoading = false,
  mode = "light",
}) => {
  const textColor = mode === "dark" ? "#ffffff" : "#000000";
  const backgroundColor = mode === "dark" ? "#000000" : "#ffffff";
  const loadingBarColor = mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)";

  return (
    <div
      style={{
        background: gradient,
        borderRadius: "14px",
        padding: "2px", // Padding pour la bordure dégradée
        flex: "1",
        minWidth: "0",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        cursor: "pointer",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.16)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.12)";
      }}
    >
      {/* Contenu de la carte avec fond noir/blanc */}
      <div
        style={{
          backgroundColor: backgroundColor,
          borderRadius: "12px",
          padding: "16px",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Effet de brillance */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "-100%",
            width: "100%",
            height: "100%",
            background: mode === "dark" 
              ? "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)"
              : "linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent)",
            animation: "shine 3s infinite",
          }}
        />
        
        {/* Contenu de la carte */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Icône */}
          <div
            style={{
              fontSize: "22px",
              marginBottom: "8px",
              color: textColor,
              opacity: 0.8,
              textAlign: "center",
            }}
          >
            {icon}
          </div>

          {/* Titre */}
          <h3
            style={{
              color: textColor,
              fontSize: "12px",
              fontWeight: "600",
              margin: "0 0 6px 0",
              lineHeight: "1.2",
              opacity: 0.7,
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </h3>

          {/* Compteur */}
          <div
            style={{
              color: textColor,
              fontSize: "24px",
              fontWeight: "700",
              margin: "0",
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              textAlign: "center",
            }}
          >
            {isLoading ? (
              <div
                style={{
                  width: "30px",
                  height: "4px",
                  backgroundColor: loadingBarColor,
                  borderRadius: "2px",
                  animation: "pulse 2s infinite",
                  margin: "0 auto",
                }}
              />
            ) : (
              count.toLocaleString()
            )}
          </div>
        </div>
      </div>

      {/* Styles CSS inline pour les animations */}
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};