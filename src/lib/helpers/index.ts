import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { EnrolleeData } from "../services/fetch-enrolee";
import { Dispatch, SetStateAction } from "react";


export const columns = [
  { key: "serial", label: "S/N" },
  { key: "provider", label: "PROVIDER" },
  { key: "email", label: "EMAIL" },
];

export const exportToExcel = (allData: EnrolleeData | null, setError?: Dispatch<SetStateAction<string>>) => {
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

export const exportToPDF = (allData: EnrolleeData | null, setError?: Dispatch<SetStateAction<string>>) => {
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
      // item.phone1,
      // item.region,
      // item.medicaldirector,
      // item.ProviderAddress,
    ]);

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
    if (setError) setError("Failed to generate PDF. Please try again.");
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
