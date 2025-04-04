import { Dispatch, SetStateAction } from "react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { EnrolleeData } from "../services/fetch-enrolee";


export const columns = [
  { key: "serial", label: "S/N" },
  { key: "provider", label: "PROVIDER" },
  { key: "email", label: "EMAIL" },
];

export const exportToExcel = (
  dataToExport: EnrolleeData | EnrolleeData[] | null,
  setError?: Dispatch<SetStateAction<string>>
) => {
  if (!dataToExport || (Array.isArray(dataToExport) && dataToExport.length === 0)) {
    if (setError) {
      setError("No data to export");
    }
    return;
  }

  const enrolleeDataArray = Array.isArray(dataToExport) ? dataToExport : [dataToExport];

  const wb = XLSX.utils.book_new();

  enrolleeDataArray.forEach((data) => {
    if (!data.result || !Array.isArray(data.result)) {
      console.warn("Skipping invalid data entry in Excel export:", data);
      return;
    }
    const excelData = data.result.map((item) => ({
      Provider: item.provider,
      Email: item.email,
      Phone: item.phone1,
      Region: item.region,
      "Medical Director": item.medicaldirector,
      Address: item.ProviderAddress,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Enrollee Providers");
  });

  XLSX.writeFile(wb, "Enrollee_Providers.xlsx");
};



export const exportToPDF = (
  allData: EnrolleeData | EnrolleeData[] | null,
  setError?: Dispatch<SetStateAction<string>>
) => {
  if (!allData || (Array.isArray(allData) && allData.length === 0)) {
    if (setError) {
      setError("No data to export");
    }
    return;
  }

  try {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Enrollee Providers", 14, 15);

    const enrolleeDataArray = Array.isArray(allData) ? allData : [allData];

    const pdfData = enrolleeDataArray.flatMap((data) => {
      // Check if data.result exists and is an array
      if (!data.result || !Array.isArray(data.result)) {
        console.warn("Skipping invalid data entry:", data);
        return []; // Return an empty array to avoid breaking flatMap
      }
      return data.result.map((item, index) => [
        index + 1,
        item.provider,
        item.email,
      ]);
    });

    if (pdfData.length === 0) {
      if (setError) {
        setError("No valid data to export to PDF");
      }
      return;
    }

    const tableColumns = columns.map((col) => col.label);

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
    if (setError) {
      setError("Failed to generate PDF. Please try again.");
    }
  }
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
