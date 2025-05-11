import { toast } from "react-hot-toast";
import { API_URL } from "@/lib/helpers";
import { Procedure } from "@/types";
import { deliveryFormState } from "../store/delivery-store";

interface ProcedureApiItem {
  tariff_code: string;
  tariff_desc: string;
}

interface ProcedureApiResponse {
  result: ProcedureApiItem[];
}

let proceduresCache: Procedure[] = [];
let isInitialFetchDone = false;
let isFetching = false;

export async function fetchProcedures(
  page = 0,
  limit = 20,
): Promise<{ procedures: Procedure[]; hasMore: boolean }> {
  if (isFetching) {
    const startIndex = page * limit;
    return {
      procedures: proceduresCache.slice(startIndex, startIndex + limit),
      hasMore: proceduresCache.length > startIndex + limit,
    };
  }

  const startIndex = page * limit;
  if (isInitialFetchDone && proceduresCache.length >= startIndex + limit) {
    return {
      procedures: proceduresCache.slice(startIndex, startIndex + limit),
      hasMore: proceduresCache.length > startIndex + limit,
    };
  }

  isFetching = true;
  try {
    const pharmacyId = deliveryFormState.get().pharmacyId;
    if (!pharmacyId) {
      throw new Error("No pharmacy selected");
    }

    const apiUrl = `${API_URL}/ProviderNetwork/GetProceduresByFilter?filtertype=3&providerid=${pharmacyId}&searchbyname=`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch procedures: ${response.status}`);
    }

    const data = await response.json() as ProcedureApiResponse;

    console.log("Procedure API Response:", {
      page,
      resultCount: data.result.length,
    });

    const procedures: Procedure[] = data.result.map((item: ProcedureApiItem) => ({
      ProcedureId: item.tariff_code,
      ProcedureName: item.tariff_desc,
      ProcedureQuantity: 1,
    }));

    // Append to cache for pagination
    proceduresCache = page === 0 ? procedures : [...proceduresCache, ...procedures];
    isInitialFetchDone = true;

    return {
      procedures: procedures.slice(0, limit),
      hasMore: procedures.length >= limit || proceduresCache.length > startIndex + limit,
    };
  } catch (error) {
    console.error("Error fetching procedures:", error);
    toast.error("Failed to load procedures");
    return { procedures: [], hasMore: false };
  } finally {
    isFetching = false;
  }
}

export function initializeProceduresData() {
  fetchProcedures();
}

export function clearProceduresCache() {
  proceduresCache = [];
  isInitialFetchDone = false;
}
