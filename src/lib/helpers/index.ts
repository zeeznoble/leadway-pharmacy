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

export const safeGet = (value: any, fallback: any) => {
  return value !== undefined && value !== null ? value : fallback;
};

let navigateFunction: any = null;

export const setNavigateFunction = (navigate: any) => {
  navigateFunction = navigate;
};

export const programmaticNavigate = (path: string) => {
  if (navigateFunction) {
    navigateFunction(path);
  }
};



interface DeliveryItem {
  ProcedureName: string;
  ProcedureQuantity: number;
  cost: string;
  duration?: string;
}

interface DeliveryNoteData {
  deliveryNoteNo: string;
  issueDate: string;
  patientName: string;
  patientId: string;
  address: string;
  phone: string;
  items: DeliveryItem[];
}

export const generateDeliveryNotePDF = async (data: DeliveryNoteData) => {
  const doc = new jsPDF();

  // Load and add logo
  try {
    const logoUrl = 'https://leadwayhealth.com/wp-content/uploads/2022/01/logo-x2.png';
    const logoImg = await loadImage(logoUrl);
    doc.addImage(logoImg, 'PNG', 20, 15, 60, 25);
  } catch (error) {
    console.warn('Could not load logo:', error);
  }

  // Company header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY NOTE', doc.internal.pageSize.width - 20, 25, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('LEADWAY HEALTH LTD', doc.internal.pageSize.width - 20, 35, { align: 'right' });
  doc.text('121-123, Funso Williams Avenue, Iponri, Surulere,', doc.internal.pageSize.width - 20, 42, { align: 'right' });
  doc.text('Lagos', doc.internal.pageSize.width - 20, 49, { align: 'right' });
  doc.text('101241 Surulere', doc.internal.pageSize.width - 20, 56, { align: 'right' });
  doc.text('Nigeria', doc.internal.pageSize.width - 20, 63, { align: 'right' });
  doc.text('healthcare@leadway.com', doc.internal.pageSize.width - 20, 77, { align: 'right' });

  // Delivery note details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Delivery note No.:`, doc.internal.pageSize.width - 60, 90, { align: 'left' });
  doc.setFont('helvetica', 'bold');
  doc.text(data.deliveryNoteNo, doc.internal.pageSize.width - 20, 90, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Issue date:`, doc.internal.pageSize.width - 60, 97, { align: 'left' });
  doc.setFont('helvetica', 'bold');
  doc.text(data.issueDate, doc.internal.pageSize.width - 20, 97, { align: 'right' });

  // Patient details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FOR', 20, 90);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patientName.toUpperCase(), 20, 100);
  doc.text(data.patientId, 20, 107);
  doc.text(data.address, 20, 114);
  doc.text(data.phone, 20, 121);
  doc.text('Nigeria', 20, 128);

  // Items table
  const tableData = data.items.map(item => [
    item.ProcedureName,
    `${item.ProcedureQuantity} ${getQuantityUnit(item.ProcedureName)}`
  ]);

  // Add description for first item if available
  if (data.items.length > 0 && data.items[0].duration) {
    tableData.push([data.items[0].duration, '']);
  }

  (doc as any).autoTable({
    startY: 140,
    head: [['DESCRIPTION', 'QUANTITY']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [173, 216, 230], // Light blue
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'right' }
    },
    margin: { left: 20, right: 20 },
  });

  // Health advice section
  const finalY = (doc as any).lastAutoTable.finalY + 20;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');

  const healthAdvice = `Maintaining consistent medication adherence and adopting healthy lifestyle changes are essential for effectively managing your health. Remember your healthcare team is available to provide support and guidance throughout your journey. Make your health a priority by staying dedicated to your treatment plan.

Reach out to your health care team today, to get the support you need.
Contact Centre Number: 07080627051, 02-012801051
* WhatsApp: 09165629569
* Email: Healthcare@leadway.com
* Web chat - leadwayhealth.com

At your convenience, we have a team of expert Doctors ready to be of support to you, connect with them through our telemedicine platform on our Mobile app.`;

  const splitText = doc.splitTextToSize(healthAdvice, 170);
  doc.text(splitText, 20, finalY);

  // Download the PDF
  const fileName = `Delivery_Note_${data.deliveryNoteNo}_${data.issueDate.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

// Helper function to load image
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

// Helper function to determine quantity unit
const getQuantityUnit = (procedureName: string): string => {
  const name = procedureName.toLowerCase();
  if (name.includes('tablet') || name.includes('tab')) return 'tabs';
  if (name.includes('capsule') || name.includes('cap')) return 'caps';
  if (name.includes('syrup') || name.includes('liquid')) return 'ml';
  if (name.includes('injection') || name.includes('inj')) return 'vials';
  return 'units';
};
