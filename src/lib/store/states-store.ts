import { asyncChunk } from "stunk";
import { API_URL } from "../helpers";

export type State = {
  Disabled: boolean;
  Group: null | string;
  Selected: boolean;
  Text: string;
  Value: string;
};

// States chunk - fetch all states
export const statesChunk = asyncChunk(async () => {
  try {
    const response = await fetch(`${API_URL}/ListValues/GetStates`);
    if (!response.ok) {
      throw new Error(`Failed to fetch states: ${response.status}`);
    }
    const data = await response.json() as State[];
    return data;
  } catch (error) {
    console.error("Error fetching states:", error);
    throw error; // Re-throw to let the async chunk handle it properly
  }
});

export type City = {
  Disabled: boolean;
  Group: null | string;
  Selected: boolean;
  Text: string;
  Value: string;
};

// Cities chunk - fetch cities by state ID
export const citiesChunk = asyncChunk(
  async (stateId: string) => {
    if (!stateId) {
      throw new Error("State ID is required");
    }

    try {
      const response = await fetch(`${API_URL}/ListValues/GetCitiesByStates?state=${stateId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch cities: ${response.status}`);
      }
      const data = await response.json() as City[];
      return data;
    } catch (error) {
      console.error("Error fetching cities:", error);
      throw error; // Re-throw to let the async chunk handle it properly
    }
  },
  {
    enabled: true, // Enable it - we'll control when to fetch with parameters
    refresh: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  }
);
