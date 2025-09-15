import { Dispatch, SetStateAction } from "react";
import { To } from "react-router-dom";
import { CalendarDate, parseDate } from "@internationalized/date";


import * as XLSX from "xlsx";
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import { ProviderData } from "../services/fetch-providers";
import { fetchEnrolleeById } from "../services/fetch-enrolee";

import { appChunk, authStore } from "../store/app-store";
import { BenefitsResponse } from "../services/fetch-benefit";
import { BENEFITS_COLUMNS, PROVIDERS_COLUMNS } from "../constants";
import { Delivery } from "@/types";
import { DeliveryAdjustment } from "@/pages/pack";


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
        cost: apiResponse.cost,
        DosageDescription: apiResponse.DosageDescription,
      },
    ],
    DosageDescription: apiResponse.DosageDescription,
    Username: apiResponse.username,
    AdditionalInformation: apiResponse.additionalinformation,
    Comment: apiResponse.comment,
    IsDelivered: apiResponse.isdelivered,
    EnrolleeId: apiResponse.enrolleeid,
    EnrolleeName: apiResponse.enrolleename,
    EnrolleeAge: apiResponse.enrollee_age,
    SchemeName: apiResponse.schemename,
    SchemeId: apiResponse.schemeid,
    FrequencyDuration: apiResponse.frequencyduration,
    EndDate: apiResponse.enddate,
    Status: apiResponse.Status,
    memberstatus: apiResponse.memberstatus,
    // Additional fields from API response
    EntryNo: apiResponse.entryno,
    DeliveryId: apiResponse.deliveryid,
    Pharmacyid: apiResponse.pharmacyid,
    PharmacyName: apiResponse.pharmacyname,
    deliveryaddress: apiResponse.deliveryaddress,
    phonenumber: apiResponse.phonenumber,
    cost: apiResponse.cost,
    recipientcode: apiResponse.recipientcode,
    // nextpackdate: apiResponse.nextpackdate,
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
  return `${String(date.day).padStart(2, "0")}-${String(date.month).padStart(2, "0")}-${date.year}`;
};

export const formatDateForDisplay = (date: CalendarDate) => {
  if (!date) return '';

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return `${months[date.month - 1]} ${date.day}, ${date.year}`;
};

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateDeliveryCode = (): string => {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
};

// Your delivery code is ${deliveryCode}. Please present this code when making the delivery.
export const getRiderSmsMessage = (
  riderName: string,
  enrolleephone: string,
  enrolleeName: string,
  additionalInfo?: string, // make it optional
): string => {
  let message = `Hi ${riderName}, you have a new delivery assignment for ${enrolleeName} on ${enrolleephone}.`;

  if (additionalInfo && additionalInfo.trim() !== "") {
    message += `\nAdditional Information: ${additionalInfo}`;
  }

  return message;
};


export const getEnrolleeSmsMessage = (
  enrolleeName: string,
  verificationCode: string,
  riderPhone: string,
  riderName: string
): string => {
  return `Dear ${enrolleeName}, rider ${riderName} ${riderPhone} will deliver your meds. OTP: ${verificationCode}. Share OTP with rider on delivery.`;
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

type DeliveryItem = {
  ProcedureName: string;
  ProcedureId: string;
  ProcedureQuantity: number;
  OriginalQuantity: number;
  cost: string;
  duration: string;
  DosageDescription: string
}

type DeliveryNoteData = {
  deliveryNoteNo: string;
  issueDate: string;
  patientName: string;
  patientId: string;
  schemeName: string;
  address: string;
  phone: string;
  selectedMonths: number;
  nextpackdate: string;

  items: DeliveryItem[];
}

export const generateDeliveryNotePDF = async (deliveryData: DeliveryNoteData[], selectedMonths: number, nextpackdate: string, deliveryAdjustments: DeliveryAdjustment[]) => {

  const doc = new jsPDF();

  // Group deliveries by EnrolleeID
  const groupedByEnrollee = deliveryData.reduce((groups: any, delivery: any) => {
    const enrolleeId = delivery.enrolleeid || delivery.EnrolleeId || 'Unknown';
    if (!groups[enrolleeId]) {
      groups[enrolleeId] = [];
    }
    groups[enrolleeId].push(delivery);
    return groups;
  }, {});

  // Create a map for quick lookup of adjustments by enrollee ID
  const adjustmentMap = new Map<string, DeliveryAdjustment>();
  deliveryAdjustments.forEach((adj) => {
    adjustmentMap.set(adj.enrolleeId, adj);
  });

  const enrolleeIds = Object.keys(groupedByEnrollee);
  let isFirstPage = true;

  // Generate a single delivery note number for the entire PDF
  const deliveryNoteNo = Math.floor(Math.random() * 9000) + 1000;

  // Loop through each enrollee and create a page
  for (let i = 0; i < enrolleeIds.length; i++) {
    const enrolleeId = enrolleeIds[i];
    const enrolleeDeliveries = groupedByEnrollee[enrolleeId];

    // Get the adjustment for this specific enrollee
    const enrolleeAdjustment = adjustmentMap.get(enrolleeId);
    const enrolleeMonths = enrolleeAdjustment ? enrolleeAdjustment.adjustedMonths : selectedMonths;

    console.log(`Generating PDF for enrollee ${enrolleeId}:`, {
      originalMonths: selectedMonths,
      adjustedMonths: enrolleeMonths,
      hasAdjustment: !!enrolleeAdjustment,
      isAdjusted: enrolleeAdjustment?.isAdjusted || false
    });

    // Get the first delivery to extract enrollee information
    const primaryDelivery = enrolleeDeliveries[0];

    // Add new page for each enrollee (except the first one)
    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    // Add logo from local file
    try {
      doc.addImage('/leadway-logo.png', 'PNG', 20, 15, 60, 25);
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
    doc.text('Lagos, Nigeria', doc.internal.pageSize.width - 20, 49, { align: 'right' });

    // Delivery note details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Delivery note No.:`, doc.internal.pageSize.width - 60, 90, { align: 'left' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${deliveryNoteNo}-${i + 1}`, doc.internal.pageSize.width - 20, 90, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text(`Issue date:`, doc.internal.pageSize.width - 60, 97, { align: 'left' });
    doc.setFont('helvetica', 'bold');
    doc.text(nextpackdate, doc.internal.pageSize.width - 20, 97, { align: 'right' });

    // Patient details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FOR', 20, 90);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const patientName = primaryDelivery.enrolleename || primaryDelivery.EnrolleeName || 'N/A';
    const patientId = primaryDelivery.enrolleeid || primaryDelivery.EnrolleeId || 'N/A';
    const schemeName = primaryDelivery.schemename || primaryDelivery.SchemeName || 'N/A';
    const address = primaryDelivery.deliveryaddress || primaryDelivery.enrolleeaddress ||
      primaryDelivery.DeliveryAddress || primaryDelivery.EnrolleeAddress || 'Address not available';
    const phone = primaryDelivery.phonenumber || primaryDelivery.enrolleephone ||
      primaryDelivery.PhoneNumber || primaryDelivery.EnrolleePhone || 'Phone not available';

    doc.text(patientName.toUpperCase(), 20, 100);
    doc.text(`ID: ${patientId}`, 20, 107);
    doc.text(`Scheme: ${schemeName}`, 20, 114);
    doc.text(address, 20, 121);
    doc.text(phone, 20, 128);
    doc.text('Nigeria', 20, 135);

    // Collect all procedures for this enrollee using the enrollee-specific months
    const allProcedures: any[] = [];
    enrolleeDeliveries.forEach((delivery: any) => {
      const procedures = delivery.procedureLines || delivery.ProcedureLines || [];
      procedures.forEach((procedure: any) => {
        allProcedures.push({
          ProcedureName: procedure.procedurename || procedure.ProcedureName || 'Unknown Procedure',
          ProcedureId: procedure.procedureid || procedure.ProcedureId || '',
          // Use enrollee-specific months here instead of selectedMonths
          ProcedureQuantity: (procedure.procedurequantity || procedure.ProcedureQuantity || 1) * enrolleeMonths,
          OriginalQuantity: procedure.procedurequantity || procedure.ProcedureQuantity || 1,
          cost: procedure.cost || '0',
          duration: procedure.duration || '',
          DosageDescription: procedure.DosageDescription || procedure.dosageDescription || "",
        });
      });
    });

    // Items table
    const tableData = allProcedures.map(item => [
      item.ProcedureName,
      `${item.ProcedureQuantity} ${getQuantityUnit(item.ProcedureName)}`,
      item.DosageDescription
    ]);

    // Add duration information using enrollee-specific months
    if (allProcedures.length > 0 && allProcedures[0].duration) {
      const durationText = `${allProcedures[0].duration.replace(/\d+\s*months?/i, `${enrolleeMonths} month${enrolleeMonths !== 1 ? 's' : ''}`)}`;
      tableData.push([durationText, '']);
    } else if (enrolleeMonths > 0) {
      tableData.push([`Supply for ${enrolleeMonths} month${enrolleeMonths !== 1 ? 's' : ''}`, '']);
    }

    // Generate table using autoTable
    autoTable(doc, {
      startY: 145,
      head: [['DESCRIPTION', 'QUANTITY', 'Dosage Description']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [173, 216, 230],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 50, halign: 'right' }
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

    // Add page number at the bottom
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i + 1} of ${enrolleeIds.length}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  // Download the PDF with updated filename
  const enrolleeCount = enrolleeIds.length;
  const fileName = `Delivery_Notes_${deliveryNoteNo}_${enrolleeCount}_Enrollees_${selectedMonths}M_${nextpackdate.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

export const generateDeliveryNotePDFNew = async (deliveryData: DeliveryNoteData[], selectedMonths: number, nextpackdate: string, deliveryAdjustments: DeliveryAdjustment[]) => {

  const doc = new jsPDF();

  // Group deliveries by EnrolleeID
  const groupedByEnrollee = deliveryData.reduce((groups: any, delivery: any) => {
    const enrolleeId = delivery.enrolleeid || delivery.EnrolleeId || 'Unknown';
    if (!groups[enrolleeId]) {
      groups[enrolleeId] = [];
    }
    groups[enrolleeId].push(delivery);
    return groups;
  }, {});

  // Create a map for quick lookup of adjustments by enrollee ID
  const adjustmentMap = new Map<string, DeliveryAdjustment>();
  deliveryAdjustments.forEach((adj) => {
    adjustmentMap.set(adj.enrolleeId, adj);
  });

  const enrolleeIds = Object.keys(groupedByEnrollee);
  let isFirstPage = true;

  // Generate a single delivery note number for the entire PDF
  const deliveryNoteNo = Math.floor(Math.random() * 9000) + 1000;

  // Loop through each enrollee and create a page
  for (let i = 0; i < enrolleeIds.length; i++) {
    const enrolleeId = enrolleeIds[i];
    const enrolleeDeliveries = groupedByEnrollee[enrolleeId];

    // Get the adjustment for this specific enrollee
    const enrolleeAdjustment = adjustmentMap.get(enrolleeId);
    const enrolleeMonths = enrolleeAdjustment ? enrolleeAdjustment.adjustedMonths : selectedMonths;

    console.log(`Generating PDF for enrollee ${enrolleeId}:`, {
      originalMonths: selectedMonths,
      adjustedMonths: enrolleeMonths,
      hasAdjustment: !!enrolleeAdjustment,
      isAdjusted: enrolleeAdjustment?.isAdjusted || false
    });

    // Get the first delivery to extract enrollee information
    const primaryDelivery = enrolleeDeliveries[0];

    // Add new page for each enrollee (except the first one)
    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    // Add logo from local file
    try {
      doc.addImage('/leadway-logo.png', 'PNG', 20, 15, 60, 25);
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
    doc.text('Lagos, Nigeria', doc.internal.pageSize.width - 20, 49, { align: 'right' });

    // Delivery note details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Delivery note No.:`, doc.internal.pageSize.width - 60, 90, { align: 'left' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${deliveryNoteNo}-${i + 1}`, doc.internal.pageSize.width - 20, 90, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text(`Issue date:`, doc.internal.pageSize.width - 60, 97, { align: 'left' });
    doc.setFont('helvetica', 'bold');
    doc.text(nextpackdate, doc.internal.pageSize.width - 20, 97, { align: 'right' });

    // Patient details - FIXED FIELD MAPPING
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FOR', 20, 90);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Use correct field mappings based on your data structure
    const patientName = primaryDelivery.EnrolleeName || primaryDelivery.enrollee?.name || 'N/A';
    const patientId = primaryDelivery.EnrolleeId || primaryDelivery.enrollee?.id || 'N/A';

    // Get scheme from correct locations
    const schemeName = primaryDelivery.original?.SchemeName ||
      primaryDelivery.enrollee?.scheme ||
      primaryDelivery.enrolleeData?.Member_Plan || 'N/A';

    // Get address from correct locations (try multiple fields)
    const address = primaryDelivery.deliveryaddress ||
      primaryDelivery.enrolleeData?.Member_Address ||
      primaryDelivery.original?.deliveryaddress ||
      'Address not available';

    // Get phone from correct locations
    const phone = primaryDelivery.original?.phonenumber ||
      primaryDelivery.enrolleeData?.Member_Phone_One ||
      primaryDelivery.enrolleeData?.Member_Phone_Two ||
      'Phone not available';

    doc.text(patientName.toUpperCase(), 20, 100);
    doc.text(`ID: ${patientId}`, 20, 107);
    doc.text(`Scheme: ${schemeName}`, 20, 114);
    doc.text(address, 20, 121);
    doc.text(phone, 20, 128);
    doc.text('Nigeria', 20, 135);

    // Collect all procedures for this enrollee - FIXED PROCEDURE MAPPING
    const allProcedures: any[] = [];
    enrolleeDeliveries.forEach((delivery: any) => {
      // Use correct field mapping for procedures
      const procedures = delivery.original?.ProcedureLines || [];
      procedures.forEach((procedure: any) => {
        console.log('Processing procedure:', procedure);
        allProcedures.push({
          ProcedureName: procedure.ProcedureName || 'Unknown Procedure',
          ProcedureId: procedure.ProcedureId || '',
          // Use enrollee-specific months here instead of selectedMonths
          ProcedureQuantity: (procedure.ProcedureQuantity || 1) * enrolleeMonths,
          OriginalQuantity: procedure.ProcedureQuantity || 1,
          cost: procedure.cost || '0',
          duration: procedure.duration || '',
          DosageDescription: procedure.DosageDescription || procedure.dosageDescription || "",
        });
      });
    });

    // Items table
    const tableData = allProcedures.map(item => [
      item.ProcedureName,
      `${item.ProcedureQuantity} ${getQuantityUnit(item.ProcedureName)}`,
      item.DosageDescription
    ]);

    // Add duration information
    if (allProcedures.length > 0 && allProcedures[0].duration) {
      const durationText = `${allProcedures[0].duration.replace(/\d+\s*months?/i, `${selectedMonths} month${selectedMonths !== 1 ? 's' : ''}`)}`;
      tableData.push([durationText, '']);
    } else if (selectedMonths > 0) {
      tableData.push([`Supply for ${selectedMonths} month${selectedMonths !== 1 ? 's' : ''}`, '']);
    }

    // Generate table using autoTable
    autoTable(doc, {
      startY: 145,
      head: [['DESCRIPTION', 'QUANTITY', 'Dosage Description']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [173, 216, 230],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 50, halign: 'right' }
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

    // Add page number at the bottom
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i + 1} of ${enrolleeIds.length}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  // Download the PDF with updated filename
  const enrolleeCount = enrolleeIds.length;
  const fileName = `Delivery_Notes_${deliveryNoteNo}_${enrolleeCount}_Enrollees_${selectedMonths}M_${nextpackdate.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

// Helper function to determine quantity unit (you may need to adjust this)
const getQuantityUnit = (procedureName: string): string => {
  // Add your logic to determine the appropriate unit based on procedure name
  // This is a simplified example
  if (procedureName.toLowerCase().includes('tablet') || procedureName.toLowerCase().includes('capsule')) {
    return 'tablets';
  } else if (procedureName.toLowerCase().includes('syrup') || procedureName.toLowerCase().includes('liquid')) {
    return 'ml';
  } else if (procedureName.toLowerCase().includes('injection')) {
    return 'vials';
  }
  return 'units';
};

// // Helper function to load image
// const loadImage = (url: string): Promise<HTMLImageElement> => {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.crossOrigin = 'anonymous';
//     img.onload = () => resolve(img);
//     img.onerror = reject;
//     img.src = url;
//   });
// };

// Helper function to determine quantity unit
// const getQuantityUnit = (procedureName: string): string => {
//   const name = procedureName.toLowerCase();
//   if (name.includes('tablet') || name.includes('tab')) return 'tabs';
//   if (name.includes('capsule') || name.includes('cap')) return 'caps';
//   if (name.includes('syrup') || name.includes('liquid')) return 'ml';
//   if (name.includes('injection') || name.includes('inj')) return 'vials';
//   return 'units';
// };
