import { Dispatch, SetStateAction } from "react";
import { To } from "react-router-dom";
import { CalendarDate, parseDate } from "@internationalized/date";


import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { ProviderData } from "../services/fetch-providers";
import { fetchEnrolleeById } from "../services/fetch-enrolee";

import { appChunk, authStore } from "../store/app-store";
import { BenefitsResponse } from "../services/fetch-benefit";
import { BENEFITS_COLUMNS, PROVIDERS_COLUMNS } from "../constants";
import { Delivery } from "@/types";


export const exportToExcel = (allData: ProviderData | null, setError?: Dispatch<SetStateAction<string>>) => {
  if (!allData?.result?.length) {
    if (setError) setError("No data to export");
    return;
  }

  const wb = XLSX.utils.book_new();
  const excelData = allData.result.map((item) => ({
    Provider: item.provider,
    Email: item.email,
    Phone: item.phone1,
    Region: item.region,
    "Medical Director": item.medicaldirector,
    Address: item.ProviderAddress,
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  XLSX.utils.book_append_sheet(wb, ws, "Enrollee Providers");
  XLSX.writeFile(wb, "Enrollee_Providers.xlsx");
};

export const exportToPDF = (allData: ProviderData | null, setError?: Dispatch<SetStateAction<string>>) => {
  if (!allData?.result?.length) {
    if (setError) setError("No data to export");
    return;
  }

  try {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Enrollee Providers", 14, 15);

    const pdfData = allData.result.map((item, index) => [
      index + 1,
      item.provider,
      item.email,
      item.ProviderAddress,

      // item.phone1,
      // item.region,
      // item.medicaldirector,
      // item.ProviderAddress,
    ]);

    const tableColumns = PROVIDERS_COLUMNS.map((col) => col.label);

    autoTable(doc, {
      head: [tableColumns],
      theme: "striped",
      body: pdfData,
      startY: 25,
      styles: { fontSize: 5, cellPadding: 2, font: "times" },
      headStyles: {
        fillColor: "#C61531",
        textColor: [255, 255, 255],
        fontSize: 4,
        font: "times",
      },
      columnStyles: {
        5: { cellWidth: "auto" },
      },
      margin: { top: 25 },
    });
    doc.save("Enrollee_Providers.pdf");
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (setError) setError("Failed to generate PDF. Please try again.");
  }
};

type FetchInfoParam = {
  enrolleeId: string,
  path: string,
  setFetchError: Dispatch<SetStateAction<string>>,
  setLoading: Dispatch<SetStateAction<boolean>>,
  navigate: (to: To) => void
}

export const fetchInfoAndRoute = async ({ enrolleeId, path, navigate, setFetchError, setLoading }: FetchInfoParam) => {
  try {
    const enrolleeData = await fetchEnrolleeById(enrolleeId.trim());


    if (!enrolleeData || enrolleeData.result.length === 0) {
      setFetchError(
        "No enrollee found with this ID. Please check and try again."
      );
      setLoading(false);
      return;
    }

    const [enrollee] = enrolleeData.result;

    appChunk.set((prev) => ({
      ...prev,
      enrolleeId: enrolleeId.trim(),
      enrolleeData: enrollee,
      profilePic: enrolleeData.profilepic,
    }));

    console.log(enrolleeData);

    navigate(path);
  } catch (error) {
    console.error("Error in fetch and navigate:", error);
    setFetchError("An error occurred while fetching data. Please try again.");
  } finally {
    setLoading(false);
  }
}


export const exportToExcelBen = (allData: BenefitsResponse | null, setError?: Dispatch<SetStateAction<string>>) => {
  if (!allData?.result?.length) {
    if (setError) setError("No data to export");
    return;
  }

  const wb = XLSX.utils.book_new();
  const excelData = allData.result.map((item) => ({
    Benefit: item.Benefit,
    Limit: item.Limit,
    Used: item.Used,
    Balance: item.Balance,

  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  XLSX.utils.book_append_sheet(wb, ws, "Enrollee Providers");
  XLSX.writeFile(wb, "Benefits.xlsx");
};


export const exportToPDFBen = (allData: BenefitsResponse | null, setError?: Dispatch<SetStateAction<string>>) => {
  if (!allData?.result?.length) {
    if (setError) setError("No data to export");
    return;
  }

  try {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Enrollee Providers", 14, 15);

    const pdfData = allData.result.map((item) => [
      item.Benefit,
      item.Limit,
      item.Used,
      item.Balance,
    ]);

    const tableColumns = BENEFITS_COLUMNS.map((col) => col.label);

    autoTable(doc, {
      head: [tableColumns],
      theme: "striped",
      body: pdfData,
      startY: 25,
      styles: { fontSize: 5, cellPadding: 2, font: "times" },
      headStyles: {
        fillColor: "#C61531",
        textColor: [255, 255, 255],
        fontSize: 4,
        font: "times",
      },
      columnStyles: {
        5: { cellWidth: "auto" },
      },
      margin: { top: 25 },
    });
    doc.save("Benefits.pdf");
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (setError) setError("Failed to generate PDF. Please try again.");
  }
};


export const iconClasses = 'text-xl pointer-events-none flex-shrink-0';

export const API_URL = import.meta.env.VITE_PROGNOSIS_API_URL

export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date:", date);
      return "Invalid Date";
    }

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error";
  }
};

export const parseDateString = (dateString: string) => {
  if (!dateString) return null;
  try {
    const dateOnly = dateString.split("T")[0];
    return parseDate(dateOnly);
  } catch (error) {
    return null;
  }
};

export const transformApiResponse = (apiResponse: any): Delivery => {
  return {
    DeliveryFrequency: apiResponse.deliveryfrequency,
    DelStartDate: apiResponse.delStartdate,
    NextDeliveryDate: apiResponse.nextdeliverydate,
    DiagnosisLines: [
      {
        DiagnosisName: apiResponse.diagnosisname,
        DiagnosisId: apiResponse.diagnosis_id,
      },
    ],
    ProcedureLines: [
      {
        ProcedureName: apiResponse.procedurename,
        ProcedureId: apiResponse.procdeureid,
        ProcedureQuantity: apiResponse.procedurequantity,
        cost: apiResponse.cost
      },
    ],
    Username: apiResponse.username,
    AdditionalInformation: apiResponse.additionalinformation,
    IsDelivered: apiResponse.isdelivered,
    EnrolleeId: apiResponse.enrolleeid,
    EnrolleeName: apiResponse.enrolleename,
    EnrolleeAge: apiResponse.enrollee_age,
    SchemeName: apiResponse.schemename,
    SchemeId: apiResponse.schemeid,
    FrequencyDuration: apiResponse.frequencyduration,
    EndDate: apiResponse.enddate,
    // Additional fields from API response
    EntryNo: apiResponse.entryno,
    DeliveryId: apiResponse.deliveryid,
    Pharmacyid: apiResponse.pharmacyid,
    PharmacyName: apiResponse.pharmacyname,
    deliveryaddress: apiResponse.deliveryaddress,
    phonenumber: apiResponse.phonenumber,
    cost: apiResponse.cost
  };

};

export const getUsername = async (): Promise<string> => {
  return new Promise((resolve) => {
    const unsubscribe = authStore.subscribe((state) => {
      if (state.user?.UserName) {
        unsubscribe();
        resolve(state.user.UserName);
      }
    });
    const currentUsername = authStore.get().user?.UserName;
    if (currentUsername) {
      unsubscribe();
      resolve(currentUsername);
    }
  });
};

export const formatDateForAPI = (date: CalendarDate | null): string => {
  if (!date) return "";
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
};

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateDeliveryCode = (): string => {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
};

export const getRiderSmsMessage = (
  riderName: string,
  deliveryCode: string,
  deliveryDate: string,
  enrolleeName: string
): string => {
  return `Hi ${riderName}, you have a new delivery assignment for ${enrolleeName} on ${deliveryDate}. Your delivery code is ${deliveryCode}. Please present this code when making the delivery. - Health Partnerships`;
};

export const getEnrolleeSmsMessage = (
  enrolleeName: string,
  verificationCode: string,
  deliveryDate: string,
  riderName: string
): string => {
  return `Dear ${enrolleeName}, your medication delivery is scheduled for ${deliveryDate} with rider ${riderName}. Your verification code is ${verificationCode}. Only share this code with the authorized rider upon delivery. - Health Partnerships`;
};






// const columns = [
//   { key: "provider", label: "PROVIDER" },
//   { key: "email", label: "EMAIL" },
//   { key: "phone1", label: "PHONE" },
//   { key: "region", label: "REGION" },
//   { key: "medicaldirector", label: "MEDICAL DIRECTOR" },
//   { key: "ProviderAddress", label: "ADDRESS" },
// ];

// Export functions remain the same
