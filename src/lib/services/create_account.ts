type FormData = {
  provider: string,
  ProviderAddress: string,
  phone1: string,
  region: string,
  StateOfOrigin: string,
  CityOfOrigin: string,
  email: string,
};

export type ApiResponse = {
  status: number,
  Message: string,
  GroupId: number,
  VirtualAccount: string
};

// https://prognosis-api.leadwayhealth.com/api/EnrolleeProfile/GetEnrolleeProvidersListsAll?schemeid=0&MinimumID=0&NoOfRecords=20&pageSize=10&ProviderName=&TypeID=0&StateID=0&LGAID=0&enrolleeid=24135280/0&provider_id=0


export const createEnrolee = async (data: FormData): Promise<ApiResponse> => {
  const response = await fetch(
    `${import.meta.env.VITE_PROGNOSIS_API_URL}/CRM/CreateCorporateClient`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to submit form");
  }

  return response.json();
};
