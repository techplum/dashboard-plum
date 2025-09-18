import { serviceRoleClient } from "../../utility/supabaseServiceRole";
import { Meeting } from "../../types/meeting";
import { FliiinkerProfile } from "../../types/fliiinkerProfileTypes";
import { Public_profile } from "../../types/public_profileTypes";
import { supabaseClient } from "../../utility/supabaseClient";
import { FliiinkerCompleteProfile } from "../../types/FliiinkerCompleteProfile";

export type { Meeting };

export interface MeetingWithProfiles {
  meeting: Meeting;
  fliiinkerProfile: FliiinkerProfile;
  publicProfile: Public_profile;
}

export const fetchMeetings = async (): Promise<Meeting[]> => {
  console.log("Récupération des rendez-vous...");

  const { data, error } = await supabaseClient
    .from("fliiinker_meeting")
    .select("*")
    .order("date_to_call", { ascending: true });

  if (error) {
    console.error("Erreur lors de la récupération des rendez-vous:", error);
    throw error;
  }

  console.log("Rendez-vous récupérés:", data);
  return data || [];
};

// Helper pour identifier le type de service en fonction de l'ID
export const getServiceTypeById = (serviceId: number): string => {
  switch (serviceId) {
    case 24:
      return "Garde d'animaux";
    case 25:
      return "Ménage/Linge";
    case 26:
      return "Garde d'enfant";
    default:
      return "Service inconnu";
  }
};

/**
 * Récupère toutes les informations sur un fliiinker avec une requête unique optimisée
 * Respecte la structure de relations entre les tables
 */
export const fetchFliiinkerCompleteProfile = async (
  fliiinkerId: string,
  meetingId?: string,
): Promise<FliiinkerCompleteProfile | null> => {
  console.log(
    "Récupération du profil complet du fliiinker:",
    fliiinkerId,
    "meeting:",
    meetingId,
  );

  try {
    const { data, error } = await supabaseClient
      .from("public_profile")
      .select(
        `
      *,
      fliiinker_profile:fliiinker_profile(
        *,
        fliiinker_meeting:fliiinker_meeting(*)
      ),
      administrative_data:administrative_data(*),
      administrative_images:administrative_images(*),
      services:fliiinker_service_mtm(*),
      addresses:address!public_address_user_id_fkey(*)
    `,
      )
      .eq("id", fliiinkerId)
      .maybeSingle();

    if (error) {
      console.error("Erreur lors de la récupération du profil complet:", error);
      throw error;
    }

    if (!data) {
      console.warn("Aucun profil public trouvé pour l'ID:", fliiinkerId);
      return null;
    }

    // Utiliser un type explicite pour éviter les erreurs de TypeScript
    const typedData = data as any;

    console.log("Données récupérées:", {
      publicData: typedData,
      fliiinkerData: typedData.fliiinker_profile,
      adminData: typedData.administrative_data,
      servicesData: typedData.services,
      meetingData: typedData.meeting,
      adminImages: typedData.administrative_images,
    });

    // Enrichir les services avec leur type
    const enhancedServices = typedData.services
      ? typedData.services.map((service: any) => ({
          ...service,
          service_type: getServiceTypeById(service.service_id),
        }))
      : [];

    console.log("Services enrichis:", enhancedServices);

    // Extraire les données administratives (peut être un tableau ou un objet)
    const adminData = Array.isArray(typedData.administrative_data)
      ? typedData.administrative_data[0]
      : typedData.administrative_data;

    console.log("🔍 Données administratives extraites:", adminData);

    // Construire l'objet complet avec toutes les données
    const completeProfile: FliiinkerCompleteProfile = {
      // Données du profil public
      id: typedData.id,
      created_at: typedData.created_at,
      email: typedData.email || "email@exemple.com",
      email_confirmed_at: typedData.email_confirmed_at,
      phone: typedData.phone,
      phone_confirmed_at: typedData.phone_confirmed_at,
      last_name: typedData.last_name || "Nom",
      first_name: typedData.first_name || "Prénom",
      is_fliiinker: typedData.is_fliiinker || false,
      avatar: typedData.avatar,
      gender: typedData.gender || "other",
      birthday: typedData.birthday,

      // Données du profil fliiinker
      description: typedData.fliiinker_profile?.description,
      degree: typedData.fliiinker_profile?.degree,
      tagline: typedData.fliiinker_profile?.tagline,
      status: typedData.fliiinker_profile?.status || "created",
      is_pro: typedData.fliiinker_profile?.is_pro || false,
      is_validated: typedData.fliiinker_profile?.is_validated || false,
      spoken_languages: typedData.fliiinker_profile?.spoken_languages || [],
      status_config: typedData.fliiinker_profile?.status_config,
      supa_powa: typedData.fliiinker_profile?.supa_powa,
      fliiinker_pictures: typedData.fliiinker_profile?.fliiinker_pictures,
      Pictures1: typedData.fliiinker_profile?.Pictures1,
      Pictures2: typedData.fliiinker_profile?.Pictures2,
      Pictures3: typedData.fliiinker_profile?.Pictures3,

      // Données administratives
      administrative_data: {
        country: adminData?.country || "Non spécifié",
        social_security_number: adminData?.social_security_number || null,
        ssn_is_valid: adminData?.ssn_is_valid || false,
        has_driver_liscence: adminData?.has_driver_liscence || false,
        has_car: adminData?.has_car || false,
        iban: adminData?.iban || null,
        siret: adminData?.siret || null,
        id_card_verification_status: adminData?.id_card_verification_status || "pending",
        is_entrepreneur: adminData?.is_entrepreneur || false,
      },

      // Services avec type de service
      services: enhancedServices,

      // Adresses
      addresses: typedData.addresses || [],

      // Données du rendez-vous
      meeting: typedData.meeting?.[0] || null,

      // Données administratives
      administrative_images: typedData.administrative_images || [],
    };

    console.log("Profil complet construit avec succès:", {
      id: completeProfile.id,
      hasAdminData: !!completeProfile.administrative_data,
      servicesCount: (completeProfile.services || []).length,
    });

    return completeProfile;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil complet:", error);
    return null;
  }
};

export const fetchMeetingWithProfiles = async (
  meetingId: string,
): Promise<MeetingWithProfiles | null> => {
  console.log("Récupération du rendez-vous et des profils pour:", meetingId);

  try {
    const { data: meeting, error: meetingError } = await supabaseClient
      .from("fliiinker_meeting")
      .select("*")
      .eq("id", meetingId)
      .single();

    if (meetingError) {
      console.error(
        "Erreur lors de la récupération du rendez-vous:",
        meetingError,
      );
      throw meetingError;
    }

    if (!meeting) return null;

    let fliiinkerProfile: FliiinkerProfile | undefined = undefined;
    let publicProfile: Public_profile | undefined = undefined;

    try {
      const { data: fliiinkerData, error: fliiinkerError } =
        await supabaseClient
          .from("fliiinker_profile")
          .select("*")
          .eq("id", meeting.fliiinker_id || meetingId)
          .single();

      if (fliiinkerError) {
        console.warn(
          "Avertissement - Profil fliiinker non trouvé:",
          fliiinkerError,
        );
      } else {
        fliiinkerProfile = fliiinkerData;
      }
    } catch (fliiinkerErr) {
      console.warn(
        "Erreur lors de la récupération du profil fliiinker:",
        fliiinkerErr,
      );
    }

    try {
      const { data: publicData, error: publicError } = await supabaseClient
        .from("public_profile")
        .select("*")
        .eq("id", meeting.public_profile_id || meetingId)
        .single();

      if (publicError) {
        console.warn("Avertissement - Profil public non trouvé:", publicError);
      } else {
        publicProfile = publicData;
      }
    } catch (publicErr) {
      console.warn(
        "Erreur lors de la récupération du profil public:",
        publicErr,
      );
    }

    const defaultFliiinkerProfile: FliiinkerProfile = {
      id: meetingId,
      created_at: new Date().toISOString(),
      description: undefined,
      degree: undefined,
      tagline: undefined,
      status: "created",
      is_pro: false,
      is_validated: false,
      avatar: undefined,
      spoken_languages: [],
      status_config: undefined,
    };

    const defaultPublicProfile: Public_profile = {
      id: meetingId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(), // Ajouter updated_at
      email: "email@exemple.com",
      last_name: "Nom",
      first_name: "Prénom",
      avatar: undefined,
      gender: "other",
      birthday: undefined,
      fliiinker_profile: null,
    };

    return {
      meeting,
      fliiinkerProfile: fliiinkerProfile || defaultFliiinkerProfile,
      publicProfile: publicProfile || defaultPublicProfile,
    };
  } catch (error) {
    console.error(
      "Erreur générale lors de la récupération des détails du rendez-vous:",
      error,
    );

    const errorFliiinkerProfile: FliiinkerProfile = {
      id: meetingId,
      created_at: new Date().toISOString(),
      description: "Erreur de chargement",
      degree: undefined,
      tagline: "Informations non disponibles",
      status: "error",
      is_pro: false,
      is_validated: false,
      avatar: undefined,
      spoken_languages: [],
      status_config: undefined,
    };

    const errorPublicProfile: Public_profile = {
      id: meetingId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(), // Ajouter updated_at
      email: "erreur@chargement.com",
      last_name: "Erreur",
      first_name: "Chargement",
      avatar: undefined,
      gender: "other",
      birthday: undefined,
      fliiinker_profile: null,
    };

    return {
      meeting: {
        id: meetingId,
        created_at: new Date().toISOString(),
        is_free: false,
        timezone: "UTC",
        date_to_call: null,
        hour_to_call: null,
        is_finish: false,
      },
      fliiinkerProfile: errorFliiinkerProfile,
      publicProfile: errorPublicProfile,
    };
  }
};

export const fetchRawMeetings = async () => {
  console.log("Récupération de TOUS les rendez-vous bruts...");

  const { data, error } = await supabaseClient
    .from("fliiinker_meeting")
    .select("*");

  if (error) {
    console.error("Erreur lors de la récupération des rendez-vous:", error);
    throw error;
  }

  console.log("Données brutes récupérées:", data);
  return data || [];
};

export const validateFliiinkerProfileAndServices = async (
  fliiinkerId: string,
): Promise<void> => {
  try {
    // Mettre à jour fliiinker_profile et fliiinker_service_mtm dans une transaction
    await Promise.all([
      await supabaseClient
        .from("fliiinker_profile")
        .update({ is_validated: true })
        .eq("id", fliiinkerId)
        .then(async ({ error }) => {
          if (error) throw error;

          // Attendre 1 seconde avant d'activer les services
          await new Promise((resolve) => setTimeout(resolve, 1000));

          return supabaseClient
            .from("fliiinker_service_mtm")
            .update({ is_active: true })
            .eq("fliiinker_id", fliiinkerId);
        }),
      supabaseClient
        .from("fliiinker_meeting")
        .update({ is_finish: true })
        .eq("id", fliiinkerId),
    ]);

    console.log(
      `Profil et services validés avec succès pour fliiinkerId: ${fliiinkerId}`,
    );
  } catch (error) {
    console.error("Erreur lors de la validation:", error);
    throw error;
  }
};
