type EnrolleeData = {
  Member_MemberUniqueID: number,
  Member_PlanID: number,
  Member_PlanName: string,
  Member_FirstName: string,
  Member_Entry_date: string,
  Member_Surname: string,
  Member_othernames: string,
  Member_MemberTitle: string,
  Member_DateOfBirth: string,
  Member_Age: number,
  Member_maritalstatusDescr: string,
  Member_Gender: string,
  Member_Country: string,
  Member_MemberStatus: number,
  Member_MemberStatus_Description: string,
}

export const enrolleeById = (async (enrolleeId: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_PROGNOSIS_API_URL}/EnrolleeProfile/GetEnrolleeBioDataByEnrolleeID?enrolleeid=${enrolleeId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch enrollee data: ${response.status}`);
    }
    const data = await response.json() as EnrolleeData;

    return data || null;
  } catch (error) {
    console.error("Error fetching enrollee data:", error);
    return null;
  }
})
