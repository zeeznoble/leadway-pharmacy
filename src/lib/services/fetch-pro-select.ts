import { toast } from "react-hot-toast";
import { API_URL } from "@/lib/helpers";
import { Provider } from "@/types";

interface ProviderApiItem {
  provider_id: string;
  provider: string;
}

interface ProviderData {
  result: ProviderApiItem[];
  currentPage: number;
  totalPages: number;
}

let providersCache: Provider[] = [];
let isInitialFetchDone = false;
let isFetching = false;

export async function fetchSelectProviders(
  page = 0,
  limit = 20,
  enrolleeId = "",
  stateId = "0"
): Promise<{ providers: Provider[]; hasMore: boolean }> {
  if (isFetching) {
    const startIndex = page * limit;
    return {
      providers: providersCache.slice(startIndex, startIndex + limit),
      hasMore: providersCache.length > startIndex + limit,
    };
  }

  const startIndex = page * limit;
  if (isInitialFetchDone && providersCache.length >= startIndex + limit) {
    return {
      providers: providersCache.slice(startIndex, startIndex + limit),
      hasMore: providersCache.length > startIndex + limit,
    };
  }

  isFetching = true;
  try {
    const apiUrl = `${API_URL}/EnrolleeProfile/GetEnrolleeProvidersListsAll`;
    const params = new URLSearchParams({
      schemeid: "0",
      MinimumID: (page * limit).toString(),
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
      page,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      resultCount: data.result.length,
    });

    const providers: Provider[] = data.result.map((item: ProviderApiItem) => ({
      Pharmacyid: item.provider_id,
      PharmacyName: item.provider,
    }));

    // Append new providers to cache instead of overwriting
    providersCache = page === 0 ? providers : [...providersCache, ...providers];
    isInitialFetchDone = true;

    return {
      providers: providersCache.slice(startIndex, startIndex + limit),
      hasMore: data.currentPage < data.totalPages || providers.length === limit,
    };
  } catch (error) {
    console.error("Error fetching providers:", error);
    toast.error("Failed to load providers");
    return { providers: [], hasMore: false };
  } finally {
    isFetching = false;
  }
}

export function initializeProvidersData() {
  fetchSelectProviders();
}

export function clearProvidersCache() {
  providersCache = [];
  isInitialFetchDone = false;
}
