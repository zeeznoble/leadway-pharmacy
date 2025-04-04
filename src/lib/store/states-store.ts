import { asyncChunk } from "stunk";

export type State = {
  Disabled: boolean;
  Group: null | string;
  Selected: boolean;
  Text: string;
  Value: string;
};

export const statesChunk = asyncChunk(async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_PROGNOSIS_API_URL}/ListValues/GetStates`);
    if (!response.ok) {
      throw new Error(`Failed to fetch states: ${response.status}`);
    }
    const data = await response.json() as State[];
    return data;
  } catch (error) {
    console.error("Error fetching states:", error);
    console.log(error)
    return [];
  }
})
