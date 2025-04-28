import { API_URL } from "../helpers";

export type ProviderData = {
  pageSize: number;
  currentPage: number;
  totalRecord: number;
  totalPages: number;
  status: number;
  result: {
    provider: string;
    provider_id: string;
    ProviderAddress: string;
    phone1: string;
    region: string;
    medicaldirector: string;
    email: string;
    MedicalManager: string;
    StateOfOrigin: string;
    CityOfOrigin: string;
  }[];
};

export const fetchProvider = async ({
  enrolleeId = "",
  stateId = "0",
  pageSize = 2000
}: {
  enrolleeId?: string;
  stateId?: string;
  page?: number;
  pageSize?: number;
}) => {
  try {
    const apiUrl = `${API_URL}/EnrolleeProfile/GetEnrolleeProvidersListsAll`;

    // Ensure we're using exactly the same parameters as your working example
    const params = new URLSearchParams({
      schemeid: "0",
      MinimumID: "0",
      NoOfRecords: "2000",
      pageSize: pageSize.toString(),
      ProviderName: "",
      TypeID: "46",
      StateID: stateId || "0",
      LGAID: "0",
      enrolleeid: enrolleeId || "",
      provider_id: "0"
    });

    console.log(`Fetching from: ${apiUrl}?${params.toString()}`);

    const response = await fetch(`${apiUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("API response data:", data); // Log the response to see what we're getting back

    return data;
  } catch (error) {
    console.error("Error fetching enrollee data:", error);
    throw error;
  }
};
