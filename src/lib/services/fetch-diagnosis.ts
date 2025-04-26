import { toast } from "react-hot-toast";
import { API_URL } from "@/lib/helpers";
import { Diagnosis } from "@/types";

type DiagnosisApiItem = {
  Disabled: boolean;
  Group: string | null;
  Selected: boolean;
  Text: string;
  Value: string;
};

let diagnosesCache: Diagnosis[] = [];
let isInitialFetchDone = false;
let isFetching = false;

export async function fetchDiagnoses(page = 0, limit = 20) {
  if (isFetching) return { diagnoses: diagnosesCache.slice(0, limit), hasMore: true };

  if (isInitialFetchDone && diagnosesCache.length > page * limit) {
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    return {
      diagnoses: diagnosesCache.slice(0, endIndex),
      hasMore: diagnosesCache.length > endIndex
    };
  }

  isFetching = true;
  try {

    const apiUrl = `${API_URL}/ListValues/GetAllDiagnosis`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch diagnoses");
    }

    const data = await response.json();

    console.log(data)

    const diagnoses: Diagnosis[] = data.map((item: DiagnosisApiItem) => ({
      DiagnosisId: item.Value,
      DiagnosisName: item.Text,
    }));

    diagnosesCache = diagnoses;
    isInitialFetchDone = true;

    return {
      diagnoses: diagnoses.slice(0, limit),
      hasMore: diagnoses.length > limit
    };
  } catch (error) {
    console.error("Error fetching diagnoses:", error);
    toast.error("Failed to load diagnoses");
    return { diagnoses: [], hasMore: false };
  } finally {
    isFetching = false;
  }
}

export function initializeDiagnosesData() {
  fetchDiagnoses();
}
