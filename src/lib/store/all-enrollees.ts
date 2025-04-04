import { asyncChunk } from "stunk";

import { EnrolleeData } from "../services/fetch-enrolee";

export const allEnrolleesChunk = asyncChunk(async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_PROGNOSIS_API_URL}/EnrolleeProfile/GetEnrolleeProvidersListsAll`);
    if (!response.ok) {
      throw new Error(`Failed to fetch all enrollees: ${response.status}`);
    }
    const data = await response.json() as { result: EnrolleeData[] };
    return data.result || [];
  } catch (error) {
    console.error("Error fetching all enrollees:", error);
    return [];
  }
})
