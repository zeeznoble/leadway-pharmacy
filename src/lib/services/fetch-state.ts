export type StateOption = {
  Disabled: boolean;
  Group: null | string;
  Selected: boolean;
  Text: string;
  Value: string;
};


export async function fetchStates(): Promise<StateOption[]> {
  try {
    const response = await fetch(`${import.meta.env.VITE_PROGNOSIS_API_URL}/ListValues/GetStates`);
    if (!response.ok) {
      throw new Error(`Failed to fetch states: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching states:", error);
    return [];
  }
}
