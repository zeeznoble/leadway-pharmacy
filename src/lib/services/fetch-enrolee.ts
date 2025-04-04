export type EnrolleeData = {
  pageSize: number;
  currentPage: number;
  totalRecord: number;
  totalPages: number;
  status: number;
  result: {
    provider: string;
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

type FetchEnrolleeParams = {
  enrolleeId: string;
  stateId: string;
  page?: number;
  pageSize?: number;
  providerName?: string;
  typeId?: string;
  lgaId?: string;
};


export async function fetchEnrollee({
  enrolleeId,
  stateId,
  page = 1,
  pageSize = 10,
  providerName = "",
  typeId = "0",
  // lgaId = "0"
}: FetchEnrolleeParams): Promise<EnrolleeData | null> {
  if (!enrolleeId || !stateId) {
    console.error("Enrollee ID and State ID are required");
    return null;
  }

  try {
    const minimumID = (page - 1) * pageSize;
    const baseUrl = `${import.meta.env.VITE_PROGNOSIS_API_URL}/EnrolleeProfile/GetEnrolleeProvidersListsAll`;

    const url = `${baseUrl}?schemeid=0&MinimumID=${minimumID}&NoOfRecords=5000&pageSize=${pageSize}&ProviderName=${providerName}&TypeID=${typeId}&StateID=${stateId}&LGAID=0&enrolleeid=${enrolleeId}&provider_id=0`;

    console.log("Final API URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching enrollee data:", error);
    throw error;
  }
}
