import { appChunk } from "../store/app-store";

import { API_URL } from "../helpers";

export type EnrolleeData = {
  Member_MemberUniqueID: number,
  Member_FirstName: string,
  Member_Entry_date: string,
  Member_MemberTitle: string;
  Member_Surname: string,
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
}

export type EnrolleeResponse = {
  status: number,
  result: EnrolleeData[],
  profilepic: string,
}


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
