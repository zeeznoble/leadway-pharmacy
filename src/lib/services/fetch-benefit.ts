export type Benefit = {
  RowId: number,
  Benefit: string,
  Limit: string,
  Used: number,
  AmtClaimed: number,
  Authorised: number,
  Balance: string,
  Scheme: number,
  Service: number,
  VisitsLimit: number,
  VisitsUsed: number,
  VisitsBalance: number,
  CoinsurancePercentage: number,
  CopaymentAmount: number,
  ServiceLimitUnits: number
}

export type BenefitsResponse = {
  status: number;
  result: Benefit[];
};

export const fetchBenefitsById = async (
  memberId: string
): Promise<BenefitsResponse | null> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_PROGNOSIS_API_URL}/EnrolleeProfile/GetEnrolleeServiceBenefitsByCif_AdminDriven?cifno=${memberId}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch enrollee data: ${response.status}`);
    }
    const data = (await response.json()) as BenefitsResponse;

    return data || null;
  } catch (error) {
    console.error("Error fetching enrollee data:", error);
    return null;
  }
};
