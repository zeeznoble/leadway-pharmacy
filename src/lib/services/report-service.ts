import { API_URL } from "../helpers";

export interface ReportFilters {
  location?: string;
  planType?: string;
  fromDate?: string;
  toDate?: string;
  company?: string;
  gender?: string;
  diagnosis?: string;
  ageFrom?: string;
  ageTo?: string;
  riderId?: string;
  noofmonths?: string;
}

const buildQueryString = (filters: ReportFilters): string => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  return params.toString();
};

export const getTotalDispatchByStatus = async (filters: ReportFilters): Promise<any> => {
  try {
    const queryString = buildQueryString(filters);
    const apiUrl = `${API_URL}/PharmacyDelivery/GetTotalDispatchByStatus?${queryString}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      status: response.status,
      result: data.result || data,
      ReturnMessage: data.ReturnMessage || "Data fetched successfully",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch dispatch by status";
    throw new Error(errorMessage);
  }
};

export const getTop50Medication = async (filters: ReportFilters): Promise<any> => {
  try {
    const queryString = buildQueryString(filters);
    const apiUrl = `${API_URL}/PharmacyDelivery/Sprpt_getTop50Medication?${queryString}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      status: response.status,
      result: data.result || data,
      ReturnMessage: data.ReturnMessage || "Data fetched successfully",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch top 50 medications";
    throw new Error(errorMessage);
  }
};

export const getPeriodRegistry = async (filters: ReportFilters): Promise<any> => {
  try {
    const queryString = buildQueryString(filters);
    const apiUrl = `${API_URL}/PharmacyDelivery/getsprpt_periodRegistry?${queryString}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      status: response.status,
      result: data.result || data,
      ReturnMessage: data.ReturnMessage || "Data fetched successfully",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch period registry";
    throw new Error(errorMessage);
  }
};

export const getChronicVsAcute = async (filters: ReportFilters): Promise<any> => {
  try {
    const queryString = buildQueryString(filters);
    const apiUrl = `${API_URL}/PharmacyDelivery/sprpt_chronicvsAcute?${queryString}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      status: response.status,
      result: data.result || data,
      ReturnMessage: data.ReturnMessage || "Data fetched successfully",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch chronic vs acute data";
    throw new Error(errorMessage);
  }
};

export const getForecastingTool = async (filters: ReportFilters): Promise<any> => {
  try {
    const queryString = buildQueryString(filters);
    const apiUrl = `${API_URL}/PharmacyDelivery/rptForcastingTool?${queryString}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      status: response.status,
      result: data.result || data,
      ReturnMessage: data.ReturnMessage || "Data fetched successfully",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch forecasting data";
    throw new Error(errorMessage);
  }
};
