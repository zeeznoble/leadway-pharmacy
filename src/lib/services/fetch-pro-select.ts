import { toast } from "react-hot-toast";
import { API_URL } from "@/lib/helpers";
import { Provider } from "@/types";

interface ProviderApiItem {
  provider_id: number;
  provider: string;
}

interface ProviderData {
  result: ProviderApiItem[];
  currentPage: number;
  totalPages: number;
}

export async function fetchSelectProviders(
  offset = 0,
  limit = 20,
  enrolleeId = "",
  stateId = "0"
): Promise<{ providers: Provider[]; hasMore: boolean; currentPage: number; totalPages: number }> {
  try {
    if (!enrolleeId) {
      return { providers: [], hasMore: false, currentPage: 0, totalPages: 0 };
    }

    const apiUrl = `${API_URL}/EnrolleeProfile/GetEnrolleeProvidersListsAll`;
    const params = new URLSearchParams({
      schemeid: "0",
      MinimumID: offset.toString(),
      NoOfRecords: "2000", // Max records to fetch
      pageSize: limit.toString(), // Records per page
      ProviderName: "",
      TypeID: "46", // Pharmacy discipline
      StateID: stateId,
      LGAID: "0",
      enrolleeid: enrolleeId,
      provider_id: "0",
    });

    const url = `${apiUrl}?${params.toString()}`;
    console.log("Fetching providers URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch providers: ${response.status}`);
    }

    const data = await response.json() as ProviderData;

    // Log all provider IDs to check for provider_id: 8325
    const providerIds = data.result.map((item) => item.provider_id);
    console.log("Provider API Response:", {
      offset,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      resultCount: data.result.length,
      providerIds,
      providers: data.result.map((item) => ({
        Pharmacyid: item.provider_id,
        PharmacyName: item.provider,
      })),
    });

    const providers: Provider[] = data.result.map((item: ProviderApiItem) => ({
      Pharmacyid: item.provider_id,
      PharmacyName: item.provider,
    }));

    // Check if provider_id: 8325 is in the response
    if (providerIds.includes(8325)) {
      console.log("Found provider_id: 8325 in response");
    }

    return {
      providers,
      hasMore: data.result.length === limit || data.currentPage < data.totalPages,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
    };
  } catch (error) {
    console.error("Error fetching providers:", error);
    toast.error("Failed to load providers");
    return { providers: [], hasMore: false, currentPage: 0, totalPages: 0 };
  }
}

export function initializeProvidersData() {
  fetchSelectProviders();
}
