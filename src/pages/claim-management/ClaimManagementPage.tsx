import React, { useState, useEffect, useContext } from "react";
import { Spin, message } from "antd";
import { ColorModeContext } from "../../contexts/color-mode";
import { updateClaimStatus as updateClaimStatusApi } from "../../services/claims/claimApi";
import Talk from "talkjs";

// Composants refactorisés
import { ClaimList } from "../../components/claim-management/ClaimList";
import { ClaimChat } from "../../components/claim-management/ClaimChat";
import { ClaimDetails } from "../../components/claim-management/ClaimDetails";
import { ClaimModals } from "../../components/claim-management/ClaimModals";

// Hooks personnalisés
import { useClaimFilters } from "../../hooks/useClaimFilters";
import { useOrderTimeline } from "../../hooks/useOrderTimeline";

// Services
import { fetchClaimsBasic } from "../../services/claims/claimApi";
import { fetchOrderWithBilling } from "../../services/order/orderApi";
import { fetchPublicProfileByIdService } from "../../services/public_profile/publicProfileApi";

// Styles
import "../../styles/chat.css";
import "../../styles/ClaimList.css";

const ClaimManagementPage = () => {
  const { mode } = useContext(ColorModeContext);
  const [claims, setClaims] = useState<any[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [orderLoading, setOrderLoading] = useState<boolean>(false);
  const [providerProfile, setProviderProfile] = useState<any | null>(null);
  const [showMobileChat, setShowMobileChat] = useState<boolean>(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [isProviderModalOpen, setIsProviderModalOpen] =
    useState<boolean>(false);

  // TalkJS
  const [talkUser, setTalkUser] = useState<Talk.User | null>(null);
  const talkAppId = (import.meta as any).env?.VITE_TALKJS_APP_ID;
  const currentAdminId = (import.meta as any).env?.VITE_CURRENT_USER_ID;

  // Responsive
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isNarrow, setIsNarrow] = useState<boolean>(false);

  // Cloudflare URL
  const cloudflareUrl = "https://plüm.re";

  // Utilisation du hook de filtrage
  const {
    searchFilter,
    setSearchFilter,
    statusFilter,
    setStatusFilter,
    filteredClaims,
    clearAllFilters,
  } = useClaimFilters(claims);

  // Utilisation du hook de timeline
  const { createOrderTimeline } = useOrderTimeline(orderDetails);

  // Initialisation TalkJS
  useEffect(() => {
    const initTalkJS = async () => {
      await Talk.ready;
      const user = new Talk.User({
        id: currentAdminId,
        name: "Equipe Plüm",
        email: "contact@plumservices.fr",
        role: "admin",
      });
      setTalkUser(user);
    };

    initTalkJS();
  }, [currentAdminId]);

  // Gestion responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsNarrow(window.innerWidth < 1200);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Chargement des réclamations
  useEffect(() => {
    const loadClaims = async () => {
      try {
        const claimsData = await fetchClaimsBasic();
        setClaims(claimsData);
      } catch (error) {
        console.error("Erreur lors du chargement des réclamations:", error);
        message.error("Erreur lors du chargement des réclamations");
      }
    };

    loadClaims();
  }, []);

  // Chargement des détails de la commande
  useEffect(() => {
        if (!selectedClaim?.order_id) {
          setOrderDetails(null);
      setProviderProfile(null);
          return;
        }

    const loadOrderDetails = async () => {
        setOrderLoading(true);
      try {
        const orderData = await fetchOrderWithBilling(selectedClaim.order_id);
        setOrderDetails(orderData);

        if (orderData?.fliiinker_id) {
          const { data: provider } = await fetchPublicProfileByIdService(
            orderData.fliiinker_id,
          );
          setProviderProfile(provider);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des détails:", error);
        message.error("Erreur lors du chargement des détails");
      } finally {
        setOrderLoading(false);
      }
    };

    loadOrderDetails();
  }, [selectedClaim?.order_id]);

  // Gestion de la sélection d'une réclamation
  const handleSelectClaim = (claim: any) => {
    setSelectedClaim(claim);
    if (isMobile) {
      setShowMobileChat(true);
    }
  };

  // Gestion du retour à la liste (mobile)
  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  // Gestion du changement de statut
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedClaim) return;

    const oldStatus = selectedClaim.status;
    console.log("🔄 Changement de statut:", { oldStatus, newStatus });

    try {
      const claimId =
        typeof selectedClaim.claim_id === "bigint"
          ? Number(selectedClaim.claim_id)
          : selectedClaim.claim_id;

      console.log("📝 claim_id:", claimId);
      console.log("📝 claim_id type:", typeof claimId);

      const updatedClaim = await updateClaimStatusApi(claimId, newStatus);
      console.log("✅ Statut mis à jour dans Supabase:", updatedClaim);

      const updatedClaims = claims.map((claim) =>
        claim.claim_id === selectedClaim.claim_id
          ? { ...claim, status: newStatus }
          : claim,
      );

      setClaims(updatedClaims);
      setSelectedClaim({ ...selectedClaim, status: newStatus });

      message.success("Statut mis à jour avec succès");

      setTimeout(async () => {
        try {
          const refreshedClaims = await fetchClaimsBasic();
          setClaims(refreshedClaims);
        } catch (error) {
          console.error("Erreur lors du rafraîchissement:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du statut:", error);
      message.error("Erreur lors de la mise à jour du statut");
    }
  };

  // TalkJS sync functions
  const syncUserFn = () => {
    return new Talk.User({
      id: currentAdminId,
      name: "Admin Support",
      email: "admin@example.com",
      role: "admin",
    });
  };

  const syncConversation = (session: any) => {
    if (!selectedClaim) return null;
    const rawChannel = (selectedClaim as any).channel_id;
    const channelStr =
      typeof rawChannel === "string"
        ? rawChannel
        : rawChannel == null
          ? ""
          : String(rawChannel);
    const cleanedChannel = channelStr.trim();
    const fallbackId = `claim-${String(
      (selectedClaim as any).claim_id ?? (selectedClaim as any).id ?? "unknown",
    )}`;
    const conversationId = cleanedChannel || fallbackId;

    const conversation = session.getOrCreateConversation(conversationId);

    conversation.setParticipant(syncUserFn());

    if (selectedClaim.public_profile) {
      conversation.setParticipant(
        new Talk.User({
          id: selectedClaim.user_id,
          name: `${selectedClaim.public_profile.first_name} ${selectedClaim.public_profile.last_name}`,
          email: selectedClaim.public_profile.email,
          role: "customer",
        }),
      );
    }

    return conversation;
  };

  const handleAfterSendMessage = () => {
    // Logique après envoi de message si nécessaire
  };

  // Gestion des modals
  const handleOpenClientModal = () => setIsClientModalOpen(true);
  const handleCloseClientModal = () => setIsClientModalOpen(false);
  const handleOpenProviderModal = () => setIsProviderModalOpen(true);
  const handleCloseProviderModal = () => setIsProviderModalOpen(false);

  if (!talkUser) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 100px)",
        minHeight: 0,
        backgroundColor: mode === "dark" ? "#1f1f1f" : "#fff",
        overflow: "hidden",
      }}
    >
      <ClaimList
        claims={claims}
        filteredClaims={filteredClaims}
        selectedClaim={selectedClaim}
        searchFilter={searchFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearchFilter}
        onStatusFilterChange={setStatusFilter}
        onClaimSelect={handleSelectClaim}
        onClearAllFilters={clearAllFilters}
        isMobile={isMobile}
        isNarrow={isNarrow}
        showMobileChat={showMobileChat}
        cloudflareUrl={cloudflareUrl}
      />

      <ClaimChat
        selectedClaim={selectedClaim}
        isMobile={isMobile}
        showMobileChat={showMobileChat}
        onBackToList={handleBackToList}
        onStatusChange={handleStatusChange}
        talkAppId={talkAppId}
        currentAdminId={currentAdminId}
        cloudflareUrl={cloudflareUrl}
        talkUser={talkUser}
        syncUserFn={syncUserFn}
        syncConversation={syncConversation}
        handleAfterSendMessage={handleAfterSendMessage}
        mode={mode}
      />

      <ClaimDetails
        selectedClaim={selectedClaim}
        orderDetails={orderDetails}
        orderLoading={orderLoading}
        providerProfile={providerProfile}
        isNarrow={isNarrow}
        isMobile={isMobile}
        cloudflareUrl={cloudflareUrl}
        createOrderTimeline={createOrderTimeline}
        onOpenClientModal={handleOpenClientModal}
        onOpenProviderModal={handleOpenProviderModal}
      />

      <ClaimModals
        selectedClaim={selectedClaim}
        providerProfile={providerProfile}
        isClientModalOpen={isClientModalOpen}
        isProviderModalOpen={isProviderModalOpen}
        onCloseClientModal={handleCloseClientModal}
        onCloseProviderModal={handleCloseProviderModal}
        cloudflareUrl={cloudflareUrl}
      />
    </div>
  );
};

export default ClaimManagementPage;
