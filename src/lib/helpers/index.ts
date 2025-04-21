import { Dispatch, SetStateAction } from "react";
import { To } from "react-router-dom";


import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { ProviderData } from "../services/fetch-providers";
import { fetchEnrolleeById } from "../services/fetch-enrolee";

import { appChunk } from "../store/app-store";
import { BenefitsResponse } from "../services/fetch-benefit";


export const ProvidersColumns = [
  { key: "serial", label: "S/N" },
  { key: "provider", label: "PROVIDER" },
  // { key: "email", label: "EMAIL" },
  { key: "ProviderAddress", label: "ADDRESS" },
];

export const EnrolleeColumns = [
  { key: "serial", label: "S/N" },
  { key: "Member_FirstName", label: "First Name" },
  { key: "Member_Surname", label: "Surname" },
  { key: "Member_othernames", label: "Other Names" },
  { key: "Member_Phone_One", label: "Member Phone" },
  { key: "Member_EmailAddress_One", label: "Member EmailAddress" },
  { key: "Member_Age", label: "Age" },
  { key: "Member_maritalstatusDescr", label: "Marital Status" },
  { key: "Member_Gender", label: "Gender" },
  { key: "Member_MemberStatus_Description", label: "Status" },
  { key: "Plan_Category", label: "Plan Category" },
];



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

    const tableColumns = ProvidersColumns.map((col) => col.label);

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


export const BenefitsColumns = [
  { key: "Benefit", label: "BENEFIT" },
  { key: "Limit", label: "LIMIT" },
  { key: "Used", label: "USED" },
  { key: "Balance", label: "BALANCE" },
];

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

    const tableColumns = BenefitsColumns.map((col) => col.label);

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


// const columns = [
//   { key: "provider", label: "PROVIDER" },
//   { key: "email", label: "EMAIL" },
//   { key: "phone1", label: "PHONE" },
//   { key: "region", label: "REGION" },
//   { key: "medicaldirector", label: "MEDICAL DIRECTOR" },
//   { key: "ProviderAddress", label: "ADDRESS" },
// ];

// Export functions remain the same
