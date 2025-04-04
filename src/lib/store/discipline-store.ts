import { asyncChunk } from "stunk";

export type Discipline = {
  Department_id: number,
  Department: string,
  Department_Code: string
};

export const disciplineChunk = asyncChunk(async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_PROGNOSIS_API_URL}/ListValues/Getalldepartments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch departments: ${response.status}`);
    }
    const data = await response.json() as { result: Discipline[] };

    return data.result || [];
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
})
