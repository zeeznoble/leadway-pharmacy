import { asyncChunk } from "stunk";

import { ProviderData } from "../services/fetch-providers";

export const allProvidersChunk = asyncChunk(async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_PROGNOSIS_API_URL}/EnrolleeProfile/GetEnrolleeProvidersListsAll`);
    if (!response.ok) {
      throw new Error(`Failed to fetch all enrollees: ${response.status}`);
    }
    const data = await response.json() as { result: ProviderData[] };
    return data.result || [];
  } catch (error) {
    console.error("Error fetching all enrollees:", error);
    return [];
  }
})
