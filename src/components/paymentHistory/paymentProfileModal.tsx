import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  Typography,
  Avatar,
  Tag,
  Divider,
  Spin,
  Space,
  Row,
  Col,
  Card,
  Button,
  message,
  Tabs,
  Table,
  Statistic,
  Alert,
  Input,
  ConfigProvider,
  App,
  theme,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  DollarCircleOutlined,
  TagsOutlined,
  BankOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  CalendarOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { FliiinkerCompleteProfile } from "../../types/FliiinkerCompleteProfile";
import { PlumPayment } from "../../types/plumPayment";
import { fetchFliiinkerCompleteProfile } from "../../services/meeting/meetingService";
import { updateMultiplePaymentsStatus } from "../../services/payment/paymentApi";
import { ColorModeContext } from "../../contexts/color-mode";
import { useAppSelector } from "../../hooks/useAppDispatch";
import { Public_profile } from "../../types/public_profileTypes";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import "../../styles/meetingModal.css";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface PaymentProfileModalProps {
  isVisible: boolean;
  fliiinkerId: string | null;
  payments: PlumPayment[];
  onClose: () => void;
  onPaymentsProcessed: () => void;
}

const PaymentProfileModal: React.FC<PaymentProfileModalProps> = ({
  isVisible,
  fliiinkerId,
  payments,
  onClose,
  onPaymentsProcessed,
}) => {
  const { mode } = useContext(ColorModeContext);
  const [profile, setProfile] = useState<FliiinkerCompleteProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<number[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [searchValue, setSearchValue] = useState("");
  const [ibanCopied, setIbanCopied] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const appInstance = App.useApp();

  // État pour gérer l'IBAN manuel
  const [manualIban, setManualIban] = useState<string>("");
  const [showManualIbanInput, setShowManualIbanInput] = useState(false);

  // Récupérer les données du Redux store
  const publicProfiles = useAppSelector(
    (state: any) => state.publicProfiles.profiles,
  ) as { [key: string]: Public_profile };

  // Récupérer les données complètes du fliiinker
  useEffect(() => {
    if (isVisible && fliiinkerId) {
      setLoading(true);
      fetchFliiinkerCompleteProfile(fliiinkerId)
        .then((profileData) => {
          if (profileData) {
            console.log("📊 Données de profil complètes:", profileData);
            setProfile(profileData);
            console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥");
            console.log(profileData);
            console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥");
            console.log(profileData.administrative_data);
            console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥");
          } else {
            // Si pas de données complètes, créer un profil basique avec les données Redux
            const basicProfile = createBasicProfileFromRedux(fliiinkerId);
            if (basicProfile) {
              console.log(
                "📊 Utilisation du profil basique depuis Redux:",
                basicProfile,
              );
              setProfile(basicProfile);
            }
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement du profil:", error);
          // En cas d'erreur, essayer d'utiliser les données Redux
          const basicProfile = createBasicProfileFromRedux(fliiinkerId);
          if (basicProfile) {
            console.log(
              "📊 Utilisation du profil basique depuis Redux (fallback):",
              basicProfile,
            );
            setProfile(basicProfile);
          } else {
            messageApi.error(
              "Impossible de charger les informations du prestataire",
            );
          }
          setLoading(false);
        });
    } else {
      // Réinitialiser l'état lors de la fermeture
      setProfile(null);
      setSelectedPaymentIds([]);
      setActiveTab("profile");
    }
  }, [isVisible, fliiinkerId, publicProfiles]);

  // Créer un profil basique à partir des données Redux
  const createBasicProfileFromRedux = (
    id: string,
  ): FliiinkerCompleteProfile | null => {
    const publicProfile = publicProfiles[id];
    if (!publicProfile) {
      console.log("❌ Aucun profil public trouvé dans Redux pour:", id);
      return null;
    }

    console.log("✅ Profil public trouvé dans Redux:", publicProfile);

    return {
      id: publicProfile.id,
      created_at: publicProfile.created_at,
      email: publicProfile.email || "email@exemple.com",
      email_confirmed_at: publicProfile.email_confirmed_at,
      phone: publicProfile.phone,
      phone_confirmed_at: publicProfile.phone_confirmed_at,
      last_name: publicProfile.last_name || "Nom",
      first_name: publicProfile.first_name || "Prénom",
      is_fliiinker: publicProfile.is_fliiinker || false,
      avatar: publicProfile.avatar,
      gender: publicProfile.gender || "other",
      birthday: publicProfile.birthday,

      // Données par défaut pour les champs manquants
      description: "Description non disponible",
      degree: undefined,
      tagline: "Prestataire Fliiink",
      status: "created",
      is_pro: false,
      is_validated: false,
      spoken_languages: [],
      status_config: undefined,
      supa_powa: undefined,
      fliiinker_pictures: undefined,
      Pictures1: undefined,
      Pictures2: undefined,
      Pictures3: undefined,

      // Données administratives par défaut
      administrative_data: {
        country: "Non spécifié",
        social_security_number: undefined,
        ssn_is_valid: false,
        has_driver_liscence: false,
        has_car: false,
        iban: undefined,
        siret: undefined,
        id_card_verification_status: "pending",
        is_entrepreneur: false,
      },

      // Services vides
      services: [],

      // Adresses vides
      addresses: [],

      // Données du rendez-vous vides
      meeting: undefined,

      // Données administratives vides
      administrative_images: [],
    };
  };

  // Filtrer les paiements par statut
  const filterPaymentsByStatus = (status: string) => {
    return payments.filter(
      (p) => p.fliiinker_id === fliiinkerId && p.status === status,
    );
  };

  // Filtrer les paiements par recherche
  const getFilteredPayments = (status: string) => {
    const statusPayments = filterPaymentsByStatus(status);
    if (!searchValue) return statusPayments;

    return statusPayments.filter((payment) => {
      const searchLower = searchValue.toLowerCase();

      // Recherche par ID de paiement
      if (payment.id.toString().includes(searchLower)) {
        return true;
      }

      // Recherche par ID de commande
      if (payment.order_id.toString().includes(searchLower)) {
        return true;
      }

      // Recherche par nom de service
      if (
        payment.service_name &&
        payment.service_name.toLowerCase().includes(searchLower)
      ) {
        return true;
      }

      return false;
    });
  };

  // Calculer le total des paiements
  const calculateTotal = (payments: PlumPayment[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount_earned, 0);
  };

  // Calculer le total des paiements sélectionnés
  const calculateSelectedTotal = () => {
    return payments
      .filter((payment) => selectedPaymentIds.includes(payment.id))
      .reduce((sum, payment) => sum + payment.amount_earned, 0);
  };

  // Gérer la sélection des paiements
  const handleSelectPayment = (
    paymentId: number,
    checked: boolean,
    isFinished: boolean,
  ) => {
          if (!isFinished && checked) {
        // Utiliser modal.confirm au lieu de AntModal.confirm
        appInstance.modal.confirm({
        title: (
          <span>
            <ExclamationCircleOutlined
              style={{ marginRight: 8, color: "#faad14" }}
            />
            Prestation non terminée
          </span>
        ),
        content: "Voulez-vous vraiment payer une prestation non terminée ?",
        okText: "Oui, continuer",
        cancelText: "Annuler",
        onOk() {
          setSelectedPaymentIds((prev) => [...prev, paymentId]);
        },
      });
    } else if (checked) {
      setSelectedPaymentIds((prev) => [...prev, paymentId]);
    } else {
      setSelectedPaymentIds((prev) => prev.filter((id) => id !== paymentId));
    }
  };

  // Sélectionner tous les paiements en attente
  const handleSelectAllPendingPayments = () => {
    const pendingPaymentIds = filterPaymentsByStatus("payment_pending").map(
      (p) => p.id,
    );
    setSelectedPaymentIds(pendingPaymentIds);
  };

  // Traiter les paiements sélectionnés
  const handleProcessPayments = async () => {
    if (selectedPaymentIds.length === 0) {
      messageApi.warning("Veuillez sélectionner au moins un paiement");
      return;
    }

    setProcessingPayment(true);
    try {
      await updateMultiplePaymentsStatus(selectedPaymentIds, "paid");
      messageApi.success(
        `${selectedPaymentIds.length} paiement(s) traité(s) avec succès`,
      );
      setSelectedPaymentIds([]);
      onPaymentsProcessed();
    } catch (error) {
      console.error("Erreur lors du traitement des paiements:", error);
      messageApi.error("Erreur lors du traitement des paiements");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Copier l'IBAN dans le presse-papier
  const copyIbanToClipboard = () => {
    const iban = getIban();
    if (iban && iban !== "Non renseigné") {
      navigator.clipboard
        .writeText(iban)
        .then(() => {
          setIbanCopied(true);
          messageApi.success("IBAN copié dans le presse-papier");
          setTimeout(() => setIbanCopied(false), 3000);
        })
        .catch((err) => {
          console.error("Erreur lors de la copie de l'IBAN:", err);
          messageApi.error("Impossible de copier l'IBAN");
        });
    } else {
      messageApi.warning("Aucun IBAN disponible à copier");
    }
  };

  // Colonnes pour le tableau des paiements
  const paymentColumns = [
    {
      title: " ",
      key: "selection",
      width: 50,
      render: (record: PlumPayment) => (
        console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥"),
        console.log(record),
        record.status === "payment_pending" ? (
          <input
            type="checkbox"
            checked={selectedPaymentIds.includes(record.id)}
            onChange={(e) =>
              handleSelectPayment(
                record.id,
                e.target.checked,
                record.is_finished ?? false,
              )
            }
          />
        ) : null
      ),
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a: PlumPayment, b: PlumPayment) => a.id - b.id,
    },
    {
      title: "Commande",
      dataIndex: "order_id",
      key: "order_id",
    },
    {
      title: "Terminée ?",
      dataIndex: "is_finished",
      key: "is_finished",
      render: (isFinished: boolean) => (
        <Tag color={isFinished ? "green" : "orange"}>
          {isFinished ? "Oui" : "Non"}
        </Tag>
      ),
    },
    {
      title: "Montant",
      dataIndex: "amount_earned",
      key: "amount_earned",
      render: (amount: number) => <Text strong>{amount.toFixed(2)}€</Text>,
      sorter: (a: PlumPayment, b: PlumPayment) =>
        a.amount_earned - b.amount_earned,
    },
    {
      title: "Date de fin",
      dataIndex: "service_end_date",
      key: "service_end_date",
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
      sorter: (a: PlumPayment, b: PlumPayment) => {
        if (!a.service_end_date) return -1;
        if (!b.service_end_date) return 1;
        return (
          dayjs(a.service_end_date).unix() - dayjs(b.service_end_date).unix()
        );
      },
    },
    {
      title: "Date de paiement",
      dataIndex: "date_payment",
      key: "date_payment",
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
  ];

  // Obtenir l'IBAN depuis le profil
  const getIban = () => {
    // Si un IBAN manuel a été saisi, l'utiliser en priorité
    if (manualIban) {
      return manualIban;
    }

    if (!profile) return "Non renseigné";

    // Maintenant que le meetingService.ts est corrigé, l'IBAN devrait être directement accessible
    const iban = profile.administrative_data?.iban;
    
    if (iban) {
      console.log("✅ IBAN trouvé dans profile.administrative_data.iban:", iban);
      return iban;
    }

    console.log("❌ Aucun IBAN trouvé dans profile.administrative_data.iban");
    return "Non renseigné";
  };

  // Déterminer si l'IBAN est valide
  const isIbanValid = () => {
    const iban = getIban();
    return iban && iban !== "Non renseigné";
  };

  // Gérer la saisie manuelle de l'IBAN
  const handleManualIbanSubmit = () => {
    if (!manualIban || manualIban.trim().length < 15) {
      messageApi.error("Veuillez saisir un IBAN valide");
      return;
    }

    messageApi.success("IBAN temporaire enregistré pour cette session");
    setShowManualIbanInput(false);
  };

  // Ajouter le bloc de l'IBAN à l'interface
  const renderIbanSection = () => {
    return (
      <Card
        title={
          <Space align="center">
            <BankOutlined style={{ fontSize: "20px", color: "#722ed1" }} />
            <span>Informations bancaires</span>
          </Space>
        }
        style={{ marginBottom: "20px" }}
        className="glass-section"
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>IBAN:</Text>
              {showManualIbanInput ? (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Input
                    placeholder="Saisir l'IBAN manuellement"
                    value={manualIban}
                    onChange={(e) => setManualIban(e.target.value)}
                    style={{ width: "100%" }}
                  />
                  <Space>
                    <Button type="primary" onClick={handleManualIbanSubmit}>
                      Enregistrer
                    </Button>
                    <Button
                      onClick={() => {
                        setShowManualIbanInput(false);
                        setManualIban("");
                      }}
                    >
                      Annuler
                    </Button>
                  </Space>
                </Space>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px",
                      background: isIbanValid() 
                        ? (mode === 'dark' ? '#1f1f1f' : '#f6ffed')
                        : (mode === 'dark' ? '#2a1f1f' : '#fff2e8'),
                      border: `1px solid ${isIbanValid() 
                        ? (mode === 'dark' ? '#434343' : '#b7eb8f')
                        : (mode === 'dark' ? '#5a3a3a' : '#ffccc7')}`,
                      borderRadius: "4px",
                    }}
                  >
                    <Input.Password
                      value={getIban()}
                      readOnly
                      style={{
                        flex: 1,
                        fontSize: "16px",
                        border: "none",
                        // background: 'transparent'
                      }}
                      visibilityToggle={true}
                    />
                    {isIbanValid() ? (
                      <Button
                        icon={
                          ibanCopied ? (
                            <CheckCircleOutlined />
                          ) : (
                            <CopyOutlined />
                          )
                        }
                        onClick={copyIbanToClipboard}
                        type={ibanCopied ? "primary" : "default"}
                        style={{ marginLeft: "8px" }}
                      >
                        {ibanCopied ? "Copié" : "Copier"}
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        style={{ marginLeft: "8px" }}
                        onClick={() => setShowManualIbanInput(true)}
                      >
                        Ajouter un IBAN
                      </Button>
                    )}
                  </div>

                  {!isIbanValid() && (
                    <Alert
                      message="IBAN manquant"
                      description="Le prestataire n'a pas encore renseigné son IBAN. Vous pouvez saisir un IBAN manuellement pour cette session."
                      type="warning"
                      showIcon
                      style={{ marginTop: "10px" }}
                    />
                  )}
                </>
              )}

              {profile?.administrative_data?.siret ||
              profile?.fliiinker_profile?.administrative_data?.siret ? (
                <div style={{ marginTop: "10px" }}>
                  <Text strong>SIRET:</Text>
                  <Text style={{ marginLeft: "8px" }}>
                    {profile.administrative_data?.siret ||
                      profile.fliiinker_profile?.administrative_data?.siret}
                  </Text>
                </div>
              ) : null}
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  const [showWarningModal, setShowWarningModal] = useState<number | null>(null);

  if (loading) {
    return (
      <ConfigProvider
        theme={{
          algorithm:
            mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <Modal
          title="Profil de paiement"
          open={isVisible}
          onCancel={onClose}
          footer={null}
          width={900}
          centered
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            <Spin size="large" />
          </div>
        </Modal>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm:
          mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <App>
        <Modal
          className="styled-modal"
          title={
            <Title level={4}>
              Profil de paiement
              {profile && (
                <Tag color="blue" style={{ marginLeft: 10 }}>
                  {profile.first_name} {profile.last_name}
                </Tag>
              )}
            </Title>
          }
          open={isVisible}
          onCancel={onClose}
          footer={null}
          centered
          width={900}
          data-theme={mode}
        >
          {contextHolder}

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Profil" key="profile">
              {profile ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      marginBottom: "20px",
                    }}
                  >
                    <Avatar
                      size={80}
                      icon={<UserOutlined />}
                      src={
                        profile.avatar
                          ? `${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${profile.avatar}`
                          : undefined
                      }
                      style={{ marginRight: "20px" }}
                    />
                    <div>
                      <Title level={3} style={{ margin: 0 }}>
                        {profile.first_name} {profile.last_name}
                        {profile.is_pro && (
                          <Tag color="gold" style={{ marginLeft: 10 }}>
                            PRO
                          </Tag>
                        )}
                      </Title>
                      <Text type="secondary" style={{ fontSize: "16px" }}>
                        {profile.tagline ||
                          (profile.description
                            ? profile.description.substring(0, 50) + "..."
                            : "Prestataire Fliiink")}
                      </Text>

                      <div style={{ marginTop: "10px" }}>
                        <Space direction="vertical" size="small">
                          <div>
                            <MailOutlined
                              style={{ marginRight: "8px", color: "#1890ff" }}
                            />
                            <Text>{profile.email}</Text>
                          </div>
                          {profile.phone && (
                            <div>
                              <PhoneOutlined
                                style={{ marginRight: "8px", color: "#52c41a" }}
                              />
                              <Text>{profile.phone}</Text>
                            </div>
                          )}
                          {!profile.phone && (
                            <div>
                              <PhoneOutlined
                                style={{ marginRight: "8px", color: "#d9d9d9" }}
                              />
                              <Text type="secondary">
                                Téléphone non renseigné
                              </Text>
                            </div>
                          )}
                        </Space>
                      </div>
                    </div>
                  </div>

                  {renderIbanSection()}

                  {/* Informations supplémentaires si disponibles */}
                  {profile.addresses && profile.addresses.length > 0 && (
                    <Card title="Adresses" style={{ marginTop: "16px" }}>
                      {profile.addresses.map((address, index) => (
                                                 <div key={index} style={{ marginBottom: "8px" }}>
                           <EnvironmentOutlined
                             style={{ marginRight: "8px", color: "#722ed1" }}
                           />
                           <Text>
                             {address.street}, {address.city}{" "}
                             {(address as any).postal_code || ""}
                           </Text>
                         </div>
                      ))}
                    </Card>
                  )}

                  {profile.services && profile.services.length > 0 && (
                    <Card
                      title="Services proposés"
                      style={{ marginTop: "16px" }}
                    >
                      <Space wrap>
                        {profile.services.map((service, index) => (
                          <Tag key={index} color="blue">
                            {service.service_type || `Service ${index + 1}`}
                          </Tag>
                        ))}
                      </Space>
                    </Card>
                  )}

                  {/* Informations administratives si disponibles */}
                  {(profile.administrative_data?.siret ||
                    profile.administrative_data?.country !==
                      "Non spécifié") && (
                    <Card
                      title="Informations administratives"
                      style={{ marginTop: "16px" }}
                    >
                      <Space direction="vertical" size="small">
                        {profile.administrative_data?.siret && (
                          <div>
                            <BankOutlined
                              style={{ marginRight: "8px", color: "#13c2c2" }}
                            />
                            <Text>
                              SIRET: {profile.administrative_data.siret}
                            </Text>
                          </div>
                        )}
                        {profile.administrative_data?.country &&
                          profile.administrative_data.country !==
                            "Non spécifié" && (
                            <div>
                              <EnvironmentOutlined
                                style={{ marginRight: "8px", color: "#722ed1" }}
                              />
                              <Text>
                                Pays: {profile.administrative_data.country}
                              </Text>
                            </div>
                          )}
                        {profile.administrative_data?.is_entrepreneur && (
                          <Tag color="green">Entrepreneur</Tag>
                        )}
                      </Space>
                    </Card>
                  )}

                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Card className="stat-card">
                        <DollarCircleOutlined
                          style={{
                            fontSize: 24,
                            color: "#faad14",
                            marginBottom: 8,
                          }}
                        />
                        <Statistic
                          title="En attente"
                          value={calculateTotal(
                            filterPaymentsByStatus("payment_pending"),
                          )}
                          precision={2}
                          suffix="€"
                          valueStyle={{ color: "#faad14" }}
                        />
                        <Text type="secondary">
                          {filterPaymentsByStatus("payment_pending").length}{" "}
                          paiement(s)
                        </Text>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card className="stat-card">
                        <LockOutlined
                          style={{
                            fontSize: 24,
                            color: "#ff4d4f",
                            marginBottom: 8,
                          }}
                        />
                        <Statistic
                          title="Bloqué"
                          value={calculateTotal(
                            filterPaymentsByStatus("blocked_by_claim"),
                          )}
                          precision={2}
                          suffix="€"
                          valueStyle={{ color: "#ff4d4f" }}
                        />
                        <Text type="secondary">
                          {filterPaymentsByStatus("blocked_by_claim").length}{" "}
                          paiement(s)
                        </Text>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card className="stat-card">
                        <CheckCircleOutlined
                          style={{
                            fontSize: 24,
                            color: "#52c41a",
                            marginBottom: 8,
                          }}
                        />
                        <Statistic
                          title="Payé"
                          value={calculateTotal(filterPaymentsByStatus("paid"))}
                          precision={2}
                          suffix="€"
                          valueStyle={{ color: "#52c41a" }}
                        />
                        <Text type="secondary">
                          {filterPaymentsByStatus("paid").length} paiement(s)
                        </Text>
                      </Card>
                    </Col>
                  </Row>
                </>
              ) : (
                <Alert
                  message="Aucune information disponible"
                  description="Impossible de charger les informations du prestataire"
                  type="error"
                  showIcon
                />
              )}
            </TabPane>

            <TabPane
              tab={
                <span>
                  En attente{" "}
                  <Tag color="orange">
                    {filterPaymentsByStatus("payment_pending").length}
                  </Tag>
                </span>
              }
              key="pending"
            >
              <div style={{ marginBottom: "16px" }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col>
                    <Button
                      type="primary"
                      onClick={handleSelectAllPendingPayments}
                      disabled={
                        filterPaymentsByStatus("payment_pending").length === 0
                      }
                    >
                      Tout sélectionner
                    </Button>
                  </Col>
                  <Col flex="1">
                    <Input
                      placeholder="Rechercher par ID, commande ou service"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      allowClear
                      prefix={<SearchOutlined />}
                    />
                  </Col>
                </Row>
              </div>

              <Table
                columns={paymentColumns}
                dataSource={getFilteredPayments("payment_pending")}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                footer={() => {
                  const total = calculateTotal(
                    getFilteredPayments("payment_pending"),
                  );
                  return <Text strong>Total: {total.toFixed(2)}€</Text>;
                }}
              />

              {selectedPaymentIds.length > 0 && (
                <div
                  style={{
                    background: mode === 'dark' ? '#1f1f1f' : '#f6ffed',
                    border: `1px solid ${mode === 'dark' ? '#434343' : '#b7eb8f'}`,
                    padding: "16px",
                    borderRadius: "8px",
                    marginTop: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Space>
                    <Statistic
                      title="Sélection"
                      value={selectedPaymentIds.length}
                      suffix="paiement(s)"
                      style={{ marginRight: "24px" }}
                      valueStyle={{ 
                        color: mode === 'dark' ? '#ffffff' : '#000000',
                        fontWeight: "bold" 
                      }}
                    />
                    <Statistic
                      title="Montant total"
                      value={calculateSelectedTotal()}
                      precision={2}
                      suffix="€"
                      valueStyle={{ 
                        color: mode === 'dark' ? '#52c41a' : '#52c41a', 
                        fontWeight: "bold" 
                      }}
                    />
                  </Space>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={handleProcessPayments}
                    loading={processingPayment}
                    size="large"
                    disabled={!isIbanValid()}
                  >
                    Marquer comme payé
                  </Button>
                </div>
              )}

              {!isIbanValid() && selectedPaymentIds.length > 0 && (
                <Alert
                  message="IBAN manquant"
                  description="Le prestataire n'a pas encore renseigné son IBAN. Impossible d'effectuer un paiement."
                  type="warning"
                  showIcon
                  style={{ marginTop: "16px" }}
                />
              )}
            </TabPane>

            <TabPane
              tab={
                <span>
                  Bloqué{" "}
                  <Tag color="red">
                    {filterPaymentsByStatus("blocked_by_claim").length}
                  </Tag>
                </span>
              }
              key="blocked"
            >
              <Input
                placeholder="Rechercher par ID, commande ou service"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                allowClear
                prefix={<SearchOutlined />}
                style={{ marginBottom: "16px" }}
              />

              <Table
                columns={paymentColumns.filter(
                  (col) => col.key !== "selection",
                )}
                dataSource={getFilteredPayments("blocked_by_claim")}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                footer={() => {
                  const filteredPayments = getFilteredPayments("blocked_by_claim");
                  const total = calculateTotal(filteredPayments);
                  return <Text strong>Total: {total.toFixed(2)}€</Text>;
                }}
              />

              <Alert
                message="Paiements bloqués"
                description="Ces paiements sont bloqués en raison de réclamations en cours. Ils ne peuvent pas être traités tant que les réclamations ne sont pas résolues."
                type="warning"
                showIcon
                style={{ marginTop: "16px" }}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  Payé{" "}
                  <Tag color="green">
                    {filterPaymentsByStatus("paid").length}
                  </Tag>
                </span>
              }
              key="paid"
            >
              <Input
                placeholder="Rechercher par ID, commande ou service"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                allowClear
                prefix={<SearchOutlined />}
                style={{ marginBottom: "16px" }}
              />

              <Table
                columns={paymentColumns.filter(
                  (col) => col.key !== "selection",
                )}
                dataSource={getFilteredPayments("paid")}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                footer={() => {
                  const filteredPayments = getFilteredPayments("paid");
                  const total = calculateTotal(filteredPayments);
                  return <Text strong>Total: {total.toFixed(2)}€</Text>;
                }}
              />
            </TabPane>

            <TabPane tab="Tous les paiements" key="all">
              <Input
                placeholder="Rechercher par ID, commande ou service"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                allowClear
                prefix={<SearchOutlined />}
                style={{ marginBottom: "16px" }}
              />

              <Table
                columns={paymentColumns.filter(
                  (col) => col.key !== "selection",
                )}
                dataSource={payments.filter(
                  (p) => p.fliiinker_id === fliiinkerId,
                )}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                footer={() => {
                  const allPayments = payments.filter((p) => p.fliiinker_id === fliiinkerId);
                  const filteredPayments = searchValue 
                    ? allPayments.filter((payment) => {
                        const searchLower = searchValue.toLowerCase();
                        if (payment.id.toString().includes(searchLower)) return true;
                        if (payment.order_id.toString().includes(searchLower)) return true;
                        if (payment.service_name && payment.service_name.toLowerCase().includes(searchLower)) return true;
                        return false;
                      })
                    : allPayments;
                  const total = calculateTotal(filteredPayments);
                  return <Text strong>Total: {total.toFixed(2)}€</Text>;
                }}
              />
            </TabPane>
          </Tabs>
        </Modal>
      </App>
    </ConfigProvider>
  );
};

export default PaymentProfileModal;
