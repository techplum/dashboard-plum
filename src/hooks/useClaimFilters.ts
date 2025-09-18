import { useState, useEffect } from "react";

export const useClaimFilters = (claims: any[]) => {
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filteredClaims, setFilteredClaims] = useState<any[]>([]);

  // Logique de filtrage des réclamations
  useEffect(() => {
    let filtered = claims;

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((claim: any) => claim.status === statusFilter);
    }

    // Filtre par recherche textuelle
    if (searchFilter.trim()) {
      filtered = filtered.filter((claim: any) => {
        const searchTerm = searchFilter.toLowerCase();

        // Recherche par nom/prénom
        const fullName = `${claim.public_profile?.first_name || ""} ${
          claim.public_profile?.last_name || ""
        }`.toLowerCase();

        // Recherche par IDs
        const claimId = claim.claim_id?.toString().toLowerCase() || "";
        const orderId = claim.order_id?.toString().toLowerCase() || "";

        return (
          fullName.includes(searchTerm) ||
          claimId.includes(searchTerm) ||
          orderId.includes(searchTerm)
        );
      });
    }

    setFilteredClaims(filtered);
  }, [claims, searchFilter, statusFilter]);

  const clearAllFilters = () => {
    setSearchFilter("");
    setStatusFilter("all");
  };

  return {
    searchFilter,
    setSearchFilter,
    statusFilter,
    setStatusFilter,
    filteredClaims,
    clearAllFilters,
  };
};
