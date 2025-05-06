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
): Promise<{ providers: Provider[]; hasMore: boolean }> {
  try {
    const apiUrl = `${API_URL}/EnrolleeProfile/GetEnrolleeProvidersListsAll`;
    const params = new URLSearchParams({
      schemeid: "0",
      MinimumID: offset.toString(),
      NoOfRecords: limit.toString(),
      pageSize: limit.toString(),
      ProviderName: "",
      TypeID: "46",
      StateID: stateId,
      LGAID: "0",
      enrolleeid: enrolleeId,
      provider_id: "0",
    });

    const response = await fetch(`${apiUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch providers: ${response.status}`);
    }

    const data = await response.json() as ProviderData;
    console.log("Provider API Response:", {
      offset,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      resultCount: data.result.length,
    });

    const providers: Provider[] = data.result.map((item: ProviderApiItem) => ({
      Pharmacyid: item.provider_id,
      PharmacyName: item.provider,
    }));

    return {
      providers,
      hasMore: data.currentPage < data.totalPages || data.result.length === limit,
    };
  } catch (error) {
    console.error("Error fetching providers:", error);
    toast.error("Failed to load providers");
    return { providers: [], hasMore: false };
  }
}

export function initializeProvidersData() {
  fetchSelectProviders();
}

// export function clearProvidersCache() {
//   providersCache = [];
//   isInitialFetchDone = false;
// }
