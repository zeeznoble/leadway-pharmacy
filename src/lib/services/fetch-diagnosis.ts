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

let allDiagnoses: Diagnosis[] = [];
let isDataLoaded = false;
let isLoading = false;

async function fetchAllDiagnosesFromAPI(): Promise<Diagnosis[]> {
  const apiUrl = `${API_URL}/ListValues/GetAllDiagnosis`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error("Failed to fetch diagnoses");
  }

  const data = await response.json();
  console.log("Fetched diagnoses data:", data);

  return data.map((item: DiagnosisApiItem) => ({
    DiagnosisId: item.Value,
    DiagnosisName: item.Text,
  }));
}

// Function to get paginated diagnoses from the preloaded data
export async function fetchDiagnoses(page = 0, limit = 20) {
  if (!isDataLoaded && !isLoading) {
    await initializeDiagnosesData();
  }

  while (isLoading) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const startIndex = page * limit;
  const endIndex = startIndex + limit;
  const paginatedDiagnoses = allDiagnoses.slice(startIndex, endIndex);

  return {
    diagnoses: paginatedDiagnoses,
    hasMore: allDiagnoses.length > endIndex,
    total: allDiagnoses.length
  };
}

export async function initializeDiagnosesData() {
  if (isDataLoaded || isLoading) {
    return;
  }

  isLoading = true;
  try {
    console.log("Initializing diagnoses data...");
    allDiagnoses = await fetchAllDiagnosesFromAPI();
    isDataLoaded = true;
    console.log(`Loaded ${allDiagnoses.length} diagnoses`);
  } catch (error) {
    console.error("Error initializing diagnoses data:", error);
    toast.error("Failed to load diagnoses data");
    allDiagnoses = [];
  } finally {
    isLoading = false;
  }
}

export function getAllDiagnoses(): Diagnosis[] {
  return allDiagnoses;
}

export function isDiagnosesDataLoaded(): boolean {
  return isDataLoaded;
}
