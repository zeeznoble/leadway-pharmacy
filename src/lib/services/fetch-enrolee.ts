import { appChunk } from "../store/app-store";
import { API_URL } from "../helpers";

export type EnrolleeData = {
  Member_MemberUniqueID: number,
  Member_FirstName: string,
  Member_Entry_date: string,
  Member_MemberTitle: string;
  Member_Surname: string,
  Member_MobileNo: string,
  Member_Email: string,
  Member_othernames: string,
  Member_Age: number,
  Member_Gender: string,
  Member_MemberStatus: number,
  Member_MemberStatus_Description: string,
  Member_Address: string;
  Plan_Category: string,
  Member_Phone_One: string,
  Member_EmailAddress_One: string,
  Client_PostalAddress: string,
  client_schemename: string;
  Member_ExpiryDate: string;
}

export type EnrolleeResponse = {
  status: number,
  result: EnrolleeData[],
  profilepic: string,
}

type SearchCriteria = {
  enrolleeId?: string;
  firstName?: string;
  lastName?: string;
  mobileNo?: string;
  email?: string;
};

export const fetchEnrolleeById = async (
  enrolleeId: string
): Promise<EnrolleeResponse | null> => {
  try {
    const apiUrl = `${API_URL}/EnrolleeProfile/GetEnrolleeBioDataByEnrolleeID?enrolleeid=${enrolleeId}`
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch enrollee data: ${response.status}`);
    }
    const data = (await response.json()) as EnrolleeResponse;

    appChunk.set((state) => ({
      ...state,
      enrolleeData: data.result[0]
    }))

    return data || null;
  } catch (error) {
    console.error("Error fetching enrollee data:", error);
    return null;
  }
};

export const fetchEnrolleeByMultipleFields = async (
  searchCriteria: SearchCriteria
): Promise<EnrolleeResponse | null> => {
  try {
    // Build query parameters based on provided search criteria
    const queryParams = new URLSearchParams();

    if (searchCriteria.mobileNo?.trim()) {
      queryParams.append('mobileNo', searchCriteria.mobileNo.trim());
    }

    if (searchCriteria.email?.trim()) {
      queryParams.append('email', searchCriteria.email.trim());
    }

    if (searchCriteria.enrolleeId?.trim()) {
      queryParams.append('enrolleeid', searchCriteria.enrolleeId.trim());
    }

    if (searchCriteria.firstName?.trim()) {
      queryParams.append('firstname', searchCriteria.firstName.trim());
    }

    if (searchCriteria.lastName?.trim()) {
      queryParams.append('lastname', searchCriteria.lastName.trim());
    }

    // If no search criteria provided, return null
    if (!queryParams.toString()) {
      return null;
    }

    // Use the correct API endpoint
    const apiUrl = `${API_URL}/EnrolleeProfile/GetEnrolleeBioDataByDetails?${queryParams.toString()}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch enrollee data: ${response.status}`);
    }

    const data = (await response.json()) as EnrolleeResponse;

    // Update app store with the first result if available
    if (data.result && data.result.length > 0) {
      appChunk.set((state) => ({
        ...state,
        enrolleeData: data.result[0]
      }));
    }

    return data || null;
  } catch (error) {
    console.error("Error fetching enrollee data:", error);
    throw error; // Re-throw to let the calling component handle the error
  }
};

// Example of how the API call will look:
// GET /api/EnrolleeProfile/GetEnrolleeBioDataByDetails?mobileNo=08012345678&email=john@example.com&enrolleeid=2400135/0&firstname=John&lastname=Doe
