import { useEffect, useState } from "react";
import { PlumPayment } from "../../types/plumPayment";
import {
  fetchAllPayments,
  fetchPaymentsByStatus,
  updateMultiplePaymentsStatus,
} from "../../services/payment/paymentApi";
import {
  CalendarOutlined,
  CheckOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  LockOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  EnvironmentOutlined,
  TagsOutlined,
  DollarCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  MenuOutlined,
  FilterOutlined,
  FileExcelOutlined,
  CopyOutlined,
  CreditCardOutlined,
  RightOutlined,
  CloseOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  message,
  Typography,
  Modal,
  Tabs,
  Spin,
  Input,
  Space,
  Tag,
  Tooltip,
  Checkbox,
  Badge,
  Statistic,
  Alert,
  Avatar,
  Divider,
  Empty,
  App,
  Select,
  DatePicker,
} from "antd";
import { fetchFliiinkerNameById } from "../../services/fliiinker/fliiinkerApi";
import { fetchFliiinkerCompleteProfile } from "../../services/meeting/meetingService";
import { FliiinkerCompleteProfile } from "../../types/FliiinkerCompleteProfile";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppDispatch";
import {
  fetchAllPublicProfiles,
  fetchPublicProfilesIfNeeded,
} from "../../store/slices/publicProfileSlice";
import { Public_profile } from "../../types/public_profileTypes";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import PaymentProfileModal from "./paymentProfileModal";
import MeetingModal from "../calendar/meetingModal";
dayjs.locale("fr");

const { Title, Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Interface pour les données agrégées par prestataire
interface FliiinkerSummary {
  fliiinker_id: string;
  fliiinker_name: string;
  total_pending: number;
  total_blocked: number;
  total_paid: number;
  payments_count: number;
  pending_count: number;
  blocked_count: number;
  paid_count: number;
  has_pending: boolean;
}

export const PlumPaymentTable: React.FC = () => {
  // Redux hooks
  const dispatch = useAppDispatch();
  const publicProfiles = useAppSelector(
    (state: any) => state.publicProfiles.profiles,
  ) as { [key: string]: Public_profile };
  const publicProfilesLoading = useAppSelector(
    (state: any) => state.publicProfiles.loading,
  );

  // États pour les données
  const [allPayments, setAllPayments] = useState<PlumPayment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PlumPayment[]>([]);
  const [blockedPayments, setBlockedPayments] = useState<PlumPayment[]>([]);
  const [paidPayments, setPaidPayments] = useState<PlumPayment[]>([]);
  const [fliiinkerSummaries, setFliiinkerSummaries] = useState<
    FliiinkerSummary[]
  >([]);
  const [todayPayments, setTodayPayments] = useState<PlumPayment[]>([]);
  const [tomorrowPayments, setTomorrowPayments] = useState<PlumPayment[]>([]);
  const [latePayments, setLatePayments] = useState<PlumPayment[]>([]);
  const [blockedTotal, setBlockedTotal] = useState<number>(0);

  // États pour l'interface
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [currentFliiinkerId, setCurrentFliiinkerId] = useState<string | null>(
    null,
  );
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<number[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("pending");
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);
  const [selectedFliiinkerId, setSelectedFliiinkerId] = useState<string | null>(
    null,
  );
  const [messageApi, contextHolder] = message.useMessage();
  const { modal } = App.useApp();

  // Nouveaux états pour le MeetingModal
  const [isMeetingModalVisible, setIsMeetingModalVisible] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null,
  );

  // État pour le nouveau modal de profil de paiement
  const [isPaymentProfileModalVisible, setIsPaymentProfileModalVisible] =
    useState(false);

  // Nouvel état pour le modal du profil complet
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] =
    useState<FliiinkerCompleteProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Modal pour les paiements urgents (aujourd'hui/demain/en retard)
  const [urgentPaymentsModalVisible, setUrgentPaymentsModalVisible] =
    useState(false);
  const [urgentPaymentsType, setUrgentPaymentsType] = useState<
    "today" | "tomorrow" | "late"
  >("today");
  const [urgentPaymentsTitle, setUrgentPaymentsTitle] = useState("");
  const [urgentPayments, setUrgentPayments] = useState<PlumPayment[]>([]);

  // États pour le traitement des paiements urgents
  const [fliiinkersToProcess, setFliiinkersToProcess] = useState<string[]>([]);
  const [currentFliiinkerIndex, setCurrentFliiinkerIndex] = useState<number>(0);
  const [showExitConfirmation, setShowExitConfirmation] =
    useState<boolean>(false);

  // Nouveaux états pour le tri par période
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );

  // Fonction pour obtenir le nom complet d'un prestataire depuis Redux
  const getFliiinkerFullName = (fliiinkerId: string): string => {
    const profile = publicProfiles[fliiinkerId];
    console.log(`🔍 Recherche profil pour ${fliiinkerId}:`, profile);
    console.log(
      `📊 Total profils dans Redux:`,
      Object.keys(publicProfiles).length,
    );

    if (profile && profile.first_name && profile.last_name) {
      return `${profile.last_name} ${profile.first_name}`;
    } else if (profile && profile.first_name) {
      return profile.first_name;
    } else if (profile && profile.last_name) {
      return profile.last_name;
    } else if (profile) {
      return profile.email || `Prestataire #${fliiinkerId.substring(0, 8)}`;
    }
    return `Prestataire #${fliiinkerId.substring(0, 8)}`;
  };

  // Fonction pour charger toutes les données
  const loadData = async () => {
    setLoading(true);
    try {
      console.log("🚀 Début du chargement des données...");

      // Charger les profils publics si nécessaire
      console.log("📥 Chargement des profils publics...");
      const profilesResult = await dispatch(fetchPublicProfilesIfNeeded());
      console.log("✅ Profils publics chargés:", profilesResult);

      // Récupérer tous les paiements
      console.log("📥 Chargement des paiements...");
      const allData = await fetchAllPayments();
      setAllPayments(allData);
      console.log("✅ Paiements chargés:", allData.length);

      // Filtrer par statut
      const pendingData = allData.filter((p) => p.status === "payment_pending");
      setPendingPayments(pendingData);

      const blockedData = allData.filter(
        (p) => p.status === "blocked_by_claim",
      );
      setBlockedPayments(blockedData);

      const paidData = allData.filter((p) => p.status === "paid");
      setPaidPayments(paidData);

      // Filtrer les paiements pour aujourd'hui, demain et en retard
      filterDateBasedPayments(allData);

      // Agréger les données par prestataire
      createFliiinkerSummaries(allData);
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
      messageApi.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les paiements par date (aujourd'hui/demain/en retard)
  const filterDateBasedPayments = (payments: PlumPayment[]) => {
    const now = dayjs();

    // Ne garder que les paiements en attente
    const pendingPayments = payments.filter(
      (p) => p.status === "payment_pending" && p.is_finished === true,
    );

    // Aujourd'hui : service_end_date + 24h <= now < service_end_date + 48h
    const todayData = pendingPayments.filter((p) => {
      if (!p.service_end_date) return false;
      const endDate = dayjs(p.service_end_date);
      const endDatePlus24h = dayjs(p.service_end_date).add(24, "hour");
      const endDatePlus48h = dayjs(p.service_end_date).add(48, "hour");
      return now.isAfter(endDatePlus24h) && now.isBefore(endDatePlus48h);
    });

    // Demain : now < service_end_date + 24h
    const tomorrowData = pendingPayments.filter((p) => {
      if (!p.service_end_date) return false;
      const endDatePlus24h = dayjs(p.service_end_date).add(24, "hour");
      return now.isBefore(endDatePlus24h);
    });

    // En retard : now >= service_end_date + 48h
    const lateData = pendingPayments.filter((p) => {
      if (!p.service_end_date) return false;
      const endDatePlus48h = dayjs(p.service_end_date).add(48, "hour");
      return now.isAfter(endDatePlus48h) || now.isSame(endDatePlus48h);
    });

    // Calculer le total des paiements bloqués
    const blockedPayments = payments.filter(
      (p) => p.status === "blocked_by_claim",
    );
    const blockedSum = blockedPayments.reduce(
      (sum, p) => sum + p.amount_earned,
      0,
    );

    console.log(`Paiements pour aujourd'hui: ${todayData.length}`);
    console.log(`Paiements pour demain: ${tomorrowData.length}`);
    console.log(`Paiements en retard: ${lateData.length}`);
    console.log(`Total des paiements bloqués: ${blockedSum}€`);

    setTodayPayments(todayData);
    setTomorrowPayments(tomorrowData);
    setLatePayments(lateData);
    setBlockedTotal(blockedSum);
  };

  // Créer un résumé par prestataire
  const createFliiinkerSummaries = (payments: PlumPayment[]) => {
    const fliiinkerMap = new Map<string, FliiinkerSummary>();

    payments.forEach((payment) => {
      if (!payment.fliiinker_id) return;

      const fliiinkerId = payment.fliiinker_id;

      if (!fliiinkerMap.has(fliiinkerId)) {
        fliiinkerMap.set(fliiinkerId, {
          fliiinker_id: fliiinkerId,
          fliiinker_name: getFliiinkerFullName(fliiinkerId),
          total_pending: 0,
          total_blocked: 0,
          total_paid: 0,
          payments_count: 0,
          pending_count: 0,
          blocked_count: 0,
          paid_count: 0,
          has_pending: false,
        });
      }

      const summary = fliiinkerMap.get(fliiinkerId)!;
      summary.payments_count += 1;

      if (payment.status === "payment_pending") {
        summary.total_pending += payment.amount_earned;
        summary.pending_count += 1;
        summary.has_pending = true;
      } else if (payment.status === "blocked_by_claim") {
        summary.total_blocked += payment.amount_earned;
        summary.blocked_count += 1;
      } else if (payment.status === "paid") {
        summary.total_paid += payment.amount_earned;
        summary.paid_count += 1;
      }
    });

    // Convertir la Map en tableau et trier (prestataires avec paiements en attente en premier)
    const summaries = Array.from(fliiinkerMap.values());
    summaries.sort((a, b) => {
      // D'abord par la présence de paiements en attente
      if (a.has_pending && !b.has_pending) return -1;
      if (!a.has_pending && b.has_pending) return 1;

      // Ensuite par le montant en attente (décroissant)
      return b.total_pending - a.total_pending;
    });

    setFliiinkerSummaries(summaries);
  };

  // Charger les données au démarrage
  useEffect(() => {
    loadData();
  }, []);

  // Mettre à jour les résumés quand les profils publics sont chargés
  useEffect(() => {
    if (
      Object.keys(publicProfiles as { [key: string]: Public_profile }).length >
        0 &&
      allPayments.length > 0
    ) {
      createFliiinkerSummaries(allPayments);
    }
  }, [publicProfiles, allPayments]);

  // Filtrer les données par recherche et période
  const getFilteredSummaries = () => {
    let filtered = fliiinkerSummaries;

    // Filtre par recherche (nom/prénom ou ID)
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter((summary) => {
        // Recherche par nom de prestataire
        if (summary.fliiinker_name.toLowerCase().includes(searchLower)) {
          return true;
        }

        // Recherche par ID de prestataire
        if (summary.fliiinker_id.toLowerCase().includes(searchLower)) {
          return true;
        }

        return false;
      });
    }

    // Filtre par période
    if (periodFilter !== "all" || dateRange) {
      filtered = filtered.filter((summary) => {
        const fliiinkerPayments = allPayments.filter(
          (p) => p.fliiinker_id === summary.fliiinker_id,
        );

        if (periodFilter === "today") {
          return fliiinkerPayments.some((p) => {
            if (!p.service_end_date) return false;
            const now = dayjs();
            const endDatePlus24h = dayjs(p.service_end_date).add(24, "hour");
            const endDatePlus48h = dayjs(p.service_end_date).add(48, "hour");
            return now.isAfter(endDatePlus24h) && now.isBefore(endDatePlus48h);
          });
        }

        if (periodFilter === "tomorrow") {
          return fliiinkerPayments.some((p) => {
            if (!p.service_end_date) return false;
            const now = dayjs();
            const endDatePlus24h = dayjs(p.service_end_date).add(24, "hour");
            return now.isBefore(endDatePlus24h);
          });
        }

        if (periodFilter === "late") {
          return fliiinkerPayments.some((p) => {
            if (!p.service_end_date) return false;
            const now = dayjs();
            const endDatePlus48h = dayjs(p.service_end_date).add(48, "hour");
            return now.isAfter(endDatePlus48h) || now.isSame(endDatePlus48h);
          });
        }

        if (dateRange) {
          return fliiinkerPayments.some((p) => {
            if (!p.service_end_date) return false;
            const paymentDate = dayjs(p.service_end_date);
            return (
              paymentDate.isAfter(dateRange[0]) &&
              paymentDate.isBefore(dateRange[1])
            );
          });
        }

        return true;
      });
    }

    return filtered;
  };

  // Gérer l'ouverture du modal de détail avec le nouveau modal
  const handleViewDetail = (fliiinkerId: string) => {
    // Utiliser l'ancien modal pour la compatibilité
    setCurrentFliiinkerId(fliiinkerId);
    setSelectedPaymentIds([]);
    setIsDetailModalVisible(true);
  };

  // Ouvrir le nouveau modal de profil avec IBAN
  const handleOpenPaymentProfile = (fliiinkerId: string) => {
    setSelectedFliiinkerId(fliiinkerId);
    setIsPaymentProfileModalVisible(true);
  };

  // Obtenir les paiements pour un prestataire spécifique
  const getPaymentsForFliiinker = (fliiinkerId: string, status?: string) => {
    if (!fliiinkerId) return [];

    let filteredPayments = allPayments.filter(
      (p) => p.fliiinker_id === fliiinkerId,
    );

    if (status) {
      filteredPayments = filteredPayments.filter((p) => p.status === status);
    }

    return filteredPayments;
  };

  // Calculer le total des paiements sélectionnés
  const calculateSelectedTotal = () => {
    return allPayments
      .filter((payment) => selectedPaymentIds.includes(payment.id))
      .reduce((total, payment) => total + payment.amount_earned, 0);
  };

  // Traiter les paiements sélectionnés
  const handleProcessPayments = async () => {
    if (selectedPaymentIds.length === 0) {
      messageApi.warning("Veuillez sélectionner au moins un paiement");
      return;
    }

    setIsProcessingPayment(true);
    try {
      await updateMultiplePaymentsStatus(selectedPaymentIds, "paid");
      messageApi.success(
        `${selectedPaymentIds.length} paiement(s) traité(s) avec succès`,
      );
      setSelectedPaymentIds([]);
      await loadData();
      setIsDetailModalVisible(false);
    } catch (error) {
      console.error("Erreur lors du traitement des paiements :", error);
      messageApi.error("Erreur lors du traitement des paiements");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Gérer la sélection des paiements
  const handleSelectPayment = (
    paymentId: number,
    checked: boolean,
    isFinished: boolean | null = null,
  ) => {
    if (!isFinished && checked) {
      // Utiliser modal directement
      modal.confirm({
        title: (
          <span>
            <ExclamationCircleOutlined
              style={{ marginRight: 8, color: "#faad14" }}
            />
            Attention
          </span>
        ),
        content: (
          <p>Voulez-vous vraiment payer une prestation non terminée ?</p>
        ),
        okText: "Oui, continuer",
        cancelText: "Annuler",
        onOk: () => {
          setSelectedPaymentIds((prev) => [...prev, paymentId]);
        },
      });
    } else if (checked) {
      setSelectedPaymentIds((prev) => [...prev, paymentId]);
    } else {
      setSelectedPaymentIds((prev) => prev.filter((id) => id !== paymentId));
    }
  };

  // Sélectionner tous les paiements en attente d'un prestataire
  const handleSelectAllPendingPayments = () => {
    if (!currentFliiinkerId) return;

    const pendingPaymentIds = getPaymentsForFliiinker(
      currentFliiinkerId,
      "payment_pending",
    ).map((payment) => payment.id);

    setSelectedPaymentIds(pendingPaymentIds);
  };

  // Fonction pour charger le profil complet du prestataire
  const loadFliiinkerProfile = async (fliiinkerId: string) => {
    setProfileLoading(true);
    try {
      const profile = await fetchFliiinkerCompleteProfile(fliiinkerId);
      if (profile) {
        setSelectedProfile(profile);
        setProfileModalVisible(true);
      } else {
        messageApi.error("Impossible de charger le profil du prestataire");
      }
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
      messageApi.error("Erreur lors du chargement du profil");
    } finally {
      setProfileLoading(false);
    }
  };

  // Gérer le rafraîchissement des données après le traitement des paiements
  const handlePaymentsProcessed = () => {
    loadData();
  };

  // Colonnes du tableau principal (résumé par prestataire)
  const summaryColumns = [
    {
      title: "Nom et Prénom",
      key: "fliiinker_name",
      render: (record: FliiinkerSummary) => (
        <Space direction="vertical" size={0}>
          <Text
            strong
            style={{ cursor: "pointer", color: "#1890ff" }}
            onClick={() => handleOpenPaymentProfile(record.fliiinker_id)}
          >
            {record.fliiinker_name}
          </Text>
          <Text type="secondary" copyable style={{ fontSize: "12px" }}>
            ID: {record.fliiinker_id}
          </Text>
        </Space>
      ),
      sorter: (a: FliiinkerSummary, b: FliiinkerSummary) =>
        a.fliiinker_name.localeCompare(b.fliiinker_name),
    },
    {
      title: "En attente",
      dataIndex: "total_pending",
      key: "total_pending",
      render: (amount: number, record: FliiinkerSummary) => (
        <Space>
          <Text strong>{amount.toFixed(2)}€</Text>
          {record.pending_count > 0 && <Badge count={record.pending_count} />}
        </Space>
      ),
      sorter: (a: FliiinkerSummary, b: FliiinkerSummary) =>
        a.total_pending - b.total_pending,
    },
    {
      title: "Bloqué",
      dataIndex: "total_blocked",
      key: "total_blocked",
      render: (amount: number, record: FliiinkerSummary) => (
        <Space>
          <Text strong>{amount.toFixed(2)}€</Text>
          {record.blocked_count > 0 && (
            <Badge
              count={record.blocked_count}
              style={{ backgroundColor: "#faad14" }}
            />
          )}
        </Space>
      ),
      sorter: (a: FliiinkerSummary, b: FliiinkerSummary) =>
        a.total_blocked - b.total_blocked,
    },
    {
      title: "Déjà payé",
      dataIndex: "total_paid",
      key: "total_paid",
      render: (amount: number, record: FliiinkerSummary) => (
        <Space>
          <Text strong>{amount.toFixed(2)}€</Text>
          {record.paid_count > 0 && (
            <Badge
              count={record.paid_count}
              style={{ backgroundColor: "#52c41a" }}
            />
          )}
        </Space>
      ),
      sorter: (a: FliiinkerSummary, b: FliiinkerSummary) =>
        a.total_paid - b.total_paid,
    },
    {
      title: "Total",
      key: "total",
      render: (record: FliiinkerSummary) => {
        const total =
          record.total_pending + record.total_blocked + record.total_paid;
        return <Text strong>{total.toFixed(2)}€</Text>;
      },
      sorter: (a: FliiinkerSummary, b: FliiinkerSummary) => {
        const totalA = a.total_pending + a.total_blocked + a.total_paid;
        const totalB = b.total_pending + b.total_blocked + b.total_paid;
        return totalA - totalB;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: FliiinkerSummary) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record.fliiinker_id)}
          type="primary"
        >
          Détails
        </Button>
      ),
    },
  ];

  // Colonnes pour le tableau de détail des paiements
  const detailColumns = [
    {
      title: " ",
      key: "selection",
      width: 50,
      render: (record: PlumPayment) =>
        record.status === "payment_pending" ? (
          <Checkbox
            checked={selectedPaymentIds.includes(record.id)}
            onChange={(e) =>
              handleSelectPayment(
                record.id,
                e.target.checked,
                record.is_finished ?? false,
              )
            }
          />
        ) : null,
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
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        switch (status) {
          case "payment_pending":
            return <Tag color="orange">En attente</Tag>;
          case "blocked_by_claim":
            return <Tag color="red">Bloqué</Tag>;
          case "paid":
            return <Tag color="green">Payé</Tag>;
          default:
            return <Tag>Inconnu</Tag>;
        }
      },
    },
    {
      title: "Date de paiement",
      dataIndex: "date_payment",
      key: "date_payment",
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Terminée ?",
      dataIndex: "is_finished",
      key: "is_finished",
      render: (isFinished: boolean | null) => (
        <Tag color={isFinished ? "success" : "warning"}>
          {isFinished ? "Oui" : "Non"}
        </Tag>
      ),
    },
  ];

  // Calcul des totaux pour les pieds de tableau
  const calculateFooterTotals = (payments: PlumPayment[]) => {
    const total = payments.reduce((sum, p) => sum + p.amount_earned, 0);
    return <Text strong>Total: {total.toFixed(2)}€</Text>;
  };

  // Calculer les totaux filtrés pour le résumé
  const getFilteredTotals = () => {
    const filteredSummaries = getFilteredSummaries();
    const filteredFliiinkerIds = filteredSummaries.map((s) => s.fliiinker_id);

    // Filtrer les paiements pour ne garder que ceux des prestataires filtrés
    const filteredPayments = allPayments.filter((p) =>
      filteredFliiinkerIds.includes(p.fliiinker_id),
    );

    const pending = filteredPayments.filter(
      (p) => p.status === "payment_pending",
    );
    const blocked = filteredPayments.filter(
      (p) => p.status === "blocked_by_claim",
    );
    const paid = filteredPayments.filter((p) => p.status === "paid");

    return {
      pending: pending.reduce((sum, p) => sum + p.amount_earned, 0),
      blocked: blocked.reduce((sum, p) => sum + p.amount_earned, 0),
      paid: paid.reduce((sum, p) => sum + p.amount_earned, 0),
      total: filteredPayments.reduce((sum, p) => sum + p.amount_earned, 0),
    };
  };

  // Gérer l'affichage des paiements en retard
  const handleShowLatePayments = () => {
    setUrgentPaymentsType("late");
    setUrgentPaymentsTitle("Paiements en retard");
    setUrgentPayments(latePayments);

    // Regrouper les paiements par prestataire
    const fliiinkerIds = [...new Set(latePayments.map((p) => p.fliiinker_id))];
    setFliiinkersToProcess(fliiinkerIds);
    setCurrentFliiinkerIndex(0);

    setUrgentPaymentsModalVisible(true);
  };

  // Gérer l'affichage des paiements d'aujourd'hui
  const handleShowTodayPayments = () => {
    setUrgentPaymentsType("today");
    setUrgentPaymentsTitle("Paiements à effectuer aujourd'hui");
    setUrgentPayments(todayPayments);

    // Regrouper les paiements par prestataire
    const fliiinkerIds = [...new Set(todayPayments.map((p) => p.fliiinker_id))];
    setFliiinkersToProcess(fliiinkerIds);
    setCurrentFliiinkerIndex(0);

    setUrgentPaymentsModalVisible(true);
  };

  // Gérer l'affichage des paiements de demain
  const handleShowTomorrowPayments = () => {
    setUrgentPaymentsType("tomorrow");
    setUrgentPaymentsTitle("Paiements prévus pour demain");
    setUrgentPayments(tomorrowPayments);

    // Regrouper les paiements par prestataire
    const fliiinkerIds = [
      ...new Set(tomorrowPayments.map((p) => p.fliiinker_id)),
    ];
    setFliiinkersToProcess(fliiinkerIds);
    setCurrentFliiinkerIndex(0);

    setUrgentPaymentsModalVisible(true);
  };

  // Passer au prestataire suivant
  const handleNextFliiinker = () => {
    if (currentFliiinkerIndex < fliiinkersToProcess.length - 1) {
      setCurrentFliiinkerIndex((prev) => prev + 1);
    } else {
      setUrgentPaymentsModalVisible(false);
    }
  };

  // Passer au prestataire précédent
  const handlePreviousFliiinker = () => {
    if (currentFliiinkerIndex > 0) {
      setCurrentFliiinkerIndex((prev) => prev - 1);
    }
  };

  // Gérer la fermeture du modal avec confirmation
  const handleCloseUrgentPaymentsModal = () => {
    if (currentFliiinkerIndex < fliiinkersToProcess.length - 1) {
      setShowExitConfirmation(true);
    } else {
      setUrgentPaymentsModalVisible(false);
    }
  };

  // Réinitialiser tous les filtres
  const handleResetFilters = () => {
    setSearchValue("");
    setPeriodFilter("all");
    setDateRange(null);
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = searchValue || periodFilter !== "all" || dateRange;

  // Rendu du component
  return (
    <App>
      <div
        style={{
          background: "#141414",
          padding: "0",
          height: "100%",
          width: "100%",
        }}
      >
        {contextHolder}
        {/* En-tête avec recherche et filtres */}
        <Row gutter={[16, 24]} style={{ margin: "0", padding: "20px 24px 0" }}>
          <Col xs={24} md={6}>
            <Search
              placeholder="Rechercher par nom et prénom"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ width: "100%" }}
              allowClear
            />
          </Col>
          <Col xs={24} md={12}>
            <Space wrap>
              <Select
                placeholder="Filtrer par période"
                value={periodFilter}
                onChange={setPeriodFilter}
                style={{ width: 180 }}
                allowClear
              >
                <Select.Option value="all">Toutes les périodes</Select.Option>
                <Select.Option value="today">À payer aujourd'hui</Select.Option>
                <Select.Option value="tomorrow">À payer demain</Select.Option>
                <Select.Option value="late">En retard</Select.Option>
              </Select>
              <RangePicker
                placeholder={["Date début", "Date fin"]}
                value={dateRange}
                onChange={(dates) =>
                  setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
                }
                style={{ width: 220 }}
                allowClear
              />
              {hasActiveFilters && (
                <Button
                  onClick={handleResetFilters}
                  icon={<CloseOutlined />}
                  size="small"
                >
                  Réinitialiser
                </Button>
              )}
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <div style={{ textAlign: "right" }}>
              {hasActiveFilters && (
                <Tag color="blue" style={{ marginBottom: "8px" }}>
                  {getFilteredSummaries().length} résultat(s) sur {fliiinkerSummaries.length}
                </Tag>
              )}
            </div>
          </Col>
        </Row>

        {/* Statistiques de paiement */}
        <Row gutter={[16, 24]} style={{ margin: "0", padding: "20px 24px 0" }}>
          <Col xs={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <Statistic
                title={
                  <Text style={{ color: "#fff", fontSize: "14px" }}>
                    À payer aujourd'hui
                  </Text>
                }
                value={todayPayments.reduce(
                  (sum, p) => sum + p.amount_earned,
                  0,
                )}
                precision={2}
                suffix="€"
                prefix={<CalendarOutlined />}
                valueStyle={{ color: "#faad14", fontSize: "18px" }}
              />
              <Statistic
                title={
                  <Text style={{ color: "#fff", fontSize: "14px" }}>
                    À payer demain
                  </Text>
                }
                value={tomorrowPayments.reduce(
                  (sum, p) => sum + p.amount_earned,
                  0,
                )}
                precision={2}
                suffix="€"
                valueStyle={{ color: "#5eff33", fontSize: "18px" }}
              />
              <Statistic
                title={
                  <Text style={{ color: "#fff", fontSize: "14px" }}>
                    En retard
                  </Text>
                }
                value={latePayments.reduce(
                  (sum, p) => sum + p.amount_earned,
                  0,
                )}
                precision={2}
                suffix="€"
                valueStyle={{ color: "#ff4d4f", fontSize: "18px" }}
              />
              <Statistic
                title={
                  <Text style={{ color: "#fff", fontSize: "14px" }}>
                    Bloqué
                  </Text>
                }
                value={blockedTotal}
                precision={2}
                suffix="€"
                prefix={<LockOutlined />}
                valueStyle={{ color: "#9e9e9e", fontSize: "18px" }}
              />
            </div>
          </Col>
        </Row>

        {/* Alertes pour paiements urgents */}
        {latePayments.length > 0 && (
          <Alert
            message={`${latePayments.length} paiement(s) en retard nécessitant une attention immédiate`}
            type="error"
            showIcon
            style={{ margin: "16px 24px 0", borderRadius: "4px" }}
            action={
              <Button size="small" danger onClick={handleShowLatePayments}>
                Voir
              </Button>
            }
          />
        )}

        {todayPayments.length > 0 && (
          <Alert
            message={`${todayPayments.length} paiement(s) à effectuer aujourd'hui`}
            type="warning"
            showIcon
            style={{ margin: "16px 24px 0", borderRadius: "4px" }}
            action={
              <Button size="small" danger onClick={handleShowTodayPayments}>
                Voir
              </Button>
            }
          />
        )}

        {tomorrowPayments.length > 0 && (
          <Alert
            message={`${tomorrowPayments.length} paiement(s) prévu(s) pour demain`}
            type="info"
            showIcon
            style={{ margin: "16px 24px 0", borderRadius: "4px" }}
            action={
              <Button size="small" onClick={handleShowTomorrowPayments}>
                Voir
              </Button>
            }
          />
        )}

        {/* Tableau principal des prestataires */}
        <Card
          title={
            <Space>
              <Title level={4} style={{ margin: 0, color: "#fff" }}>
                Liste des prestataires
              </Title>
              {hasActiveFilters && (
                <Tag color="blue">
                  {getFilteredSummaries().length} résultat(s) sur{" "}
                  {fliiinkerSummaries.length}
                </Tag>
              )}
            </Space>
          }
          style={{
            margin: "24px",
            background: "#1f1f1f",
            borderRadius: "8px",
            border: "1px solid #303030",
          }}
          headStyle={{
            background: "#1f1f1f",
            borderBottom: "1px solid #303030",
          }}
          bodyStyle={{ padding: 0 }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px" }}>
              <Spin size="large" />
              <div style={{ marginTop: "16px", color: "#fff" }}>
                Chargement des données...
              </div>
            </div>
          ) : (
            <Table
              columns={summaryColumns}
              dataSource={getFilteredSummaries()}
              rowKey="fliiinker_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total: ${total} prestataire(s)`,
              }}
              summary={() => {
                const filteredTotals = getFilteredTotals();
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text strong>Total général</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong>{filteredTotals.pending.toFixed(2)}€</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text strong>{filteredTotals.blocked.toFixed(2)}€</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong>{filteredTotals.paid.toFixed(2)}€</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <Text strong>{filteredTotals.total.toFixed(2)}€</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5}></Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
              style={{ background: "#1f1f1f" }}
            />
          )}
        </Card>

        {/* Modal de détail des paiements */}
        <Modal
          title={
            <Space>
              <InfoCircleOutlined />
              <span>
                Détails des paiements -{" "}
                {currentFliiinkerId ? (
                  <>
                    {getFliiinkerFullName(currentFliiinkerId)}
                    <Text
                      type="secondary"
                      style={{ marginLeft: "8px", fontSize: "12px" }}
                    >
                      (ID: {currentFliiinkerId})
                    </Text>
                  </>
                ) : (
                  "Prestataire"
                )}
              </span>
            </Space>
          }
          open={isDetailModalVisible}
          onCancel={() => setIsDetailModalVisible(false)}
          width={1000}
          footer={null}
        >
          <Tabs
            activeKey={activeDetailTab}
            onChange={setActiveDetailTab}
            style={{ marginBottom: "16px" }}
          >
            <TabPane
              tab={
                <span>
                  En attente (
                  {currentFliiinkerId
                    ? getPaymentsForFliiinker(
                        currentFliiinkerId,
                        "payment_pending",
                      ).length
                    : 0}
                  )
                </span>
              }
              key="pending"
            >
              <div style={{ marginBottom: "16px" }}>
                <Button
                  type="primary"
                  onClick={handleSelectAllPendingPayments}
                  style={{ marginRight: "8px" }}
                >
                  Tout sélectionner
                </Button>
              </div>
              <Table
                columns={detailColumns}
                dataSource={
                  currentFliiinkerId
                    ? getPaymentsForFliiinker(
                        currentFliiinkerId,
                        "payment_pending",
                      )
                    : []
                }
                rowKey="id"
                pagination={false}
                footer={() =>
                  calculateFooterTotals(
                    currentFliiinkerId
                      ? getPaymentsForFliiinker(
                          currentFliiinkerId,
                          "payment_pending",
                        )
                      : [],
                  )
                }
              />
            </TabPane>
            <TabPane
              tab={
                <span>
                  Bloqué (
                  {currentFliiinkerId
                    ? getPaymentsForFliiinker(
                        currentFliiinkerId,
                        "blocked_by_claim",
                      ).length
                    : 0}
                  )
                </span>
              }
              key="blocked"
            >
              <Table
                columns={detailColumns}
                dataSource={
                  currentFliiinkerId
                    ? getPaymentsForFliiinker(
                        currentFliiinkerId,
                        "blocked_by_claim",
                      )
                    : []
                }
                rowKey="id"
                pagination={false}
                footer={() =>
                  calculateFooterTotals(
                    currentFliiinkerId
                      ? getPaymentsForFliiinker(
                          currentFliiinkerId,
                          "blocked_by_claim",
                        )
                      : [],
                  )
                }
              />
            </TabPane>
            <TabPane
              tab={
                <span>
                  Payé (
                  {currentFliiinkerId
                    ? getPaymentsForFliiinker(currentFliiinkerId, "paid").length
                    : 0}
                  )
                </span>
              }
              key="paid"
            >
              <Table
                columns={detailColumns}
                dataSource={
                  currentFliiinkerId
                    ? getPaymentsForFliiinker(currentFliiinkerId, "paid")
                    : []
                }
                rowKey="id"
                pagination={false}
                footer={() =>
                  calculateFooterTotals(
                    currentFliiinkerId
                      ? getPaymentsForFliiinker(currentFliiinkerId, "paid")
                      : [],
                  )
                }
              />
            </TabPane>
            <TabPane tab="Tous" key="all">
              <Table
                columns={detailColumns}
                dataSource={
                  currentFliiinkerId
                    ? getPaymentsForFliiinker(currentFliiinkerId)
                    : []
                }
                rowKey="id"
                pagination={false}
                footer={() =>
                  calculateFooterTotals(
                    currentFliiinkerId
                      ? getPaymentsForFliiinker(currentFliiinkerId)
                      : [],
                  )
                }
              />
            </TabPane>
          </Tabs>

          {/* Barre d'action pour les paiements sélectionnés */}
          {selectedPaymentIds.length > 0 && (
            <div
              style={{
                background: "#f6ffed",
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
                />
                <Statistic
                  title="Montant total"
                  value={calculateSelectedTotal()}
                  precision={2}
                  suffix="€"
                  valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
                />
              </Space>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleProcessPayments}
                loading={isProcessingPayment}
                size="large"
              >
                Marquer comme payé
              </Button>
            </div>
          )}
        </Modal>

        <MeetingModal
          isVisible={isMeetingModalVisible}
          meeting={null}
          loading={false}
          onClose={() => setIsMeetingModalVisible(false)}
          meetingId={selectedMeetingId || undefined}
        />

        {/* Nouveau modal de profil de paiement */}
        <PaymentProfileModal
          isVisible={isPaymentProfileModalVisible}
          fliiinkerId={selectedFliiinkerId}
          payments={allPayments}
          onClose={() => setIsPaymentProfileModalVisible(false)}
          onPaymentsProcessed={handlePaymentsProcessed}
        />

        {/* Modal pour afficher les paiements urgents */}
        <Modal
          title={
            <Space>
              {urgentPaymentsType === "late" && (
                <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
              )}
              {urgentPaymentsType === "today" && (
                <CalendarOutlined style={{ color: "#faad14" }} />
              )}
              {urgentPaymentsType === "tomorrow" && (
                <CalendarOutlined style={{ color: "#1890ff" }} />
              )}
              <span>{urgentPaymentsTitle}</span>
            </Space>
          }
          open={urgentPaymentsModalVisible}
          onCancel={handleCloseUrgentPaymentsModal}
          width={1000}
          footer={null}
        >
          {fliiinkersToProcess.length > 0 && (
            <>
              <div
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text strong>
                  Progression : {currentFliiinkerIndex + 1} /{" "}
                  {fliiinkersToProcess.length} prestataires
                </Text>
                <Space>
                  <Button
                    onClick={handlePreviousFliiinker}
                    disabled={currentFliiinkerIndex === 0}
                  >
                    Précédent
                  </Button>
                  <Button type="primary" onClick={handleNextFliiinker}>
                    {currentFliiinkerIndex === fliiinkersToProcess.length - 1
                      ? "Terminer"
                      : "Suivant"}
                  </Button>
                </Space>
              </div>

              <Table
                columns={detailColumns.filter((col) => col.key !== "selection")}
                dataSource={urgentPayments.filter(
                  (p) =>
                    p.fliiinker_id ===
                    fliiinkersToProcess[currentFliiinkerIndex],
                )}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                footer={() => (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text strong>
                      Total:{" "}
                      {urgentPayments
                        .filter(
                          (p) =>
                            p.fliiinker_id ===
                            fliiinkersToProcess[currentFliiinkerIndex],
                        )
                        .reduce((sum, p) => sum + p.amount_earned, 0)
                        .toFixed(2)}
                      €
                    </Text>
                    <Button
                      type="primary"
                      onClick={() => {
                        const currentFliiinkerId =
                          fliiinkersToProcess[currentFliiinkerIndex];
                        const currentPayments = urgentPayments.filter(
                          (p) => p.fliiinker_id === currentFliiinkerId,
                        );
                        const paymentIds = currentPayments.map((p) => p.id);
                        setSelectedPaymentIds(paymentIds);
                        setCurrentFliiinkerId(currentFliiinkerId);
                        setUrgentPaymentsModalVisible(false);
                        setIsDetailModalVisible(true);
                        setActiveDetailTab("pending");
                      }}
                    >
                      Sélectionner ces paiements
                    </Button>
                  </div>
                )}
              />
            </>
          )}
        </Modal>

        {/* Modal de confirmation de sortie */}
        <Modal
          title="Confirmation de sortie"
          open={showExitConfirmation}
          onOk={() => {
            setShowExitConfirmation(false);
            setUrgentPaymentsModalVisible(false);
          }}
          onCancel={() => setShowExitConfirmation(false)}
          okText="Quitter"
          cancelText="Continuer"
        >
          <p>
            Il reste {fliiinkersToProcess.length - currentFliiinkerIndex - 1}{" "}
            prestataire(s) à traiter.
          </p>
          <p>Êtes-vous sûr de vouloir quitter ?</p>
        </Modal>
      </div>
    </App>
  );
};
