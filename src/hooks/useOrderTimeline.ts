import { useMemo } from "react";

// Définition de la chronologie complète des statuts
const ORDER_STATUS_TIMELINE = [
  {
    key: "created",
    label: "Commande créée",
    description: "La commande a été créée",
  },
  {
    key: "payment_confirmed",
    label: "Paiement confirmé",
    description: "Le paiement a été validé",
  },
  {
    key: "awaiting_start",
    label: "En attente de début",
    description: "En attente du début du service",
  },
  {
    key: "fliiinker_on_the_way",
    label: "Prestataire en route",
    description: "Le prestataire se dirige vers le lieu",
  },
  {
    key: "service_started",
    label: "Service démarré",
    description: "Le service a commencé",
  },
  {
    key: "service_start_confirmed",
    label: "Début confirmé",
    description: "Le début du service est confirmé",
  },
  {
    key: "service_completed_before_due_date",
    label: "Service terminé en avance",
    description: "Le service s'est terminé avant la date prévue",
  },
  {
    key: "customer_confirmed_ending",
    label: "Fin confirmée par le client",
    description: "Le client a confirmé la fin du service",
  },
  {
    key: "service_completed",
    label: "Service terminé",
    description: "Le service est complètement terminé",
  },
];

// Statuts terminaux (annulation, timeout, etc.)
const TERMINAL_STATUSES = ["cancelled", "closed_due_to_timeout"];

export const useOrderTimeline = (orderDetails: any) => {
  const createOrderTimeline = useMemo(() => {
    if (!orderDetails?.events || !Array.isArray(orderDetails.events)) {
      return [];
    }

    // Trouver le dernier événement complété
    let lastCompletedIndex = -1;
    const events = orderDetails.events;

    // Parcourir les événements pour trouver le dernier complété
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const eventName = event.name || event.event;
      
      // Trouver l'index de cet événement dans la timeline
      const timelineIndex = ORDER_STATUS_TIMELINE.findIndex(
        (item) => item.key === eventName
      );
      
      if (timelineIndex !== -1 && timelineIndex > lastCompletedIndex) {
        lastCompletedIndex = timelineIndex;
      }
    }

    // Créer la timeline avec les statuts appropriés
    return ORDER_STATUS_TIMELINE.map((item, index) => {
      let status: "wait" | "process" | "finish" | "error" = "wait";
      
      // Vérifier si c'est un statut terminal
      if (TERMINAL_STATUSES.includes(item.key)) {
        status = "error";
      } else if (index <= lastCompletedIndex) {
        // Si on a atteint cet index, marquer comme terminé
        status = "finish";
      } else if (index === lastCompletedIndex + 1) {
        // Le prochain après le dernier complété
        status = "process";
      }

      return {
        title: item.label,
        description: item.description,
        status,
      };
    });
  }, [orderDetails]);

  return { createOrderTimeline };
};
