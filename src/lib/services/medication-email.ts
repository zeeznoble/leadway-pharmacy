import toast from "react-hot-toast";
import { authStore } from "@/lib/store/app-store";
import { API_URL } from "../helpers";

// Types for email functionality
interface MedicationItem {
  sn: number;
  medication: string;
  dosage: string;
  quantity: string;
  type: string;
}

interface EmailTemplateData {
  enrolleeName: string;
  enrolleeId: string;
  enrolleePhone: string;
  enrolleeAddress: string;
  medications: MedicationItem[];
  packingPeriod: string;
}

interface EmailPayload {
  EmailAddress: string;
  CC: string;
  BCC: string;
  Subject: string;
  MessageBody: string;
  Attachments: null;
  Category: string;
  UserId: number;
  ProviderId: number;
  ServiceId: number;
  Reference: string;
  TransactionType: string;
}

// Helper function to get quantity unit from medication name
const getQuantityUnit = (medicationName: string): string => {
  const name = medicationName.toLowerCase();
  if (name.includes('tablet') || name.includes('tab')) return 'Tab';
  if (name.includes('capsule') || name.includes('cap')) return 'Cap';
  if (name.includes('syrup') || name.includes('suspension')) return 'Bottle';
  if (name.includes('injection') || name.includes('vial')) return 'Vial';
  if (name.includes('cream') || name.includes('ointment')) return 'Tube';
  if (name.includes('drops') || name.includes('solution')) return 'Bottle';
  return 'Pack';
};

// Helper function to extract medications for a specific enrollee
const getMedicationsForEnrollee = (deliveries: any[], enrolleeId: string, selectedMonths: number): MedicationItem[] => {
  const enrolleeDeliveries = deliveries.filter(delivery =>
    (delivery.enrolleeid || delivery.EnrolleeId) === enrolleeId
  );

  const medications: MedicationItem[] = [];
  let serialNumber = 1;

  enrolleeDeliveries.forEach(delivery => {
    const procedures = delivery.procedureLines || delivery.ProcedureLines || [];
    procedures.forEach((procedure: any) => {
      const medicationName = procedure.procedurename || procedure.ProcedureName || 'Unknown';
      const originalQuantity = procedure.procedurequantity || procedure.ProcedureQuantity || 1;
      const totalQuantity = originalQuantity * selectedMonths;
      const unit = getQuantityUnit(medicationName);

      medications.push({
        sn: serialNumber++,
        medication: medicationName,
        dosage: procedure.DosageDescription || 'As directed',
        quantity: `${totalQuantity} ${unit}`,
        type: unit
      });
    });
  });

  return medications;
};

// Email template generator
const getEmailTemplate = (templateData: EmailTemplateData): string => {
  const medicationRows = templateData.medications.map(med =>
    `<tr style="border: 1px solid #ddd;">
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; background-color: #fff3cd;">${med.sn}</td>
      <td style="padding: 8px; border: 1px solid #ddd; background-color: #fff3cd;">${med.medication}</td>
      <td style="padding: 8px; border: 1px solid #ddd; background-color: #fff3cd;">${med.dosage}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; background-color: #fff3cd;">${med.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; background-color: #fff3cd;">${med.type}</td>
    </tr>`
  ).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">

      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #2c5530; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase;">
          MEDICATION REFILL CONFIRMATION
        </h2>
      </div>

      <!-- Main Content -->
      <div style="background-color: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

        <!-- Greeting -->
        <div style="margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; color: #333;">
            Dear <strong>${templateData.enrolleeName}</strong>, <strong>[${templateData.enrolleeId}]</strong>,
          </p>
        </div>

        <!-- Introduction -->
        <div style="margin-bottom: 25px;">
          <p style="line-height: 1.6; color: #555; margin: 0 0 15px 0;">
            We would like to express our heartfelt gratitude for trusting us with your health needs.
            Your confidence in our pharmacy benefit scheme inspires us to serve you even better.
          </p>

          <p style="line-height: 1.6; color: #555; margin: 0;">
            As we prepare for your next refill (<strong>${templateData.packingPeriod}</strong>),
            we kindly ask for your assistance in ensuring a seamless service:
          </p>
        </div>

        <!-- Medication Section -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #2c5530; font-size: 18px; margin: 0 0 15px 0; font-weight: bold;">
            Medication Refills
          </h3>
          <p style="margin: 0 0 15px 0; color: #555;">
            Please review the information we have on file for your medication refills.
          </p>

          <!-- Medication Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: white;">
            <thead>
              <tr style="background-color: #2c5530;">
                <th style="padding: 12px 8px; border: 1px solid #ddd; color: white; text-align: center; font-weight: bold;">SN</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; color: white; font-weight: bold;">Medication</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; color: white; font-weight: bold;">Dosage</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; color: white; text-align: center; font-weight: bold;">Quantity</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; color: white; text-align: center; font-weight: bold;">Type</th>
              </tr>
            </thead>
            <tbody>
              ${medicationRows}
            </tbody>
          </table>
        </div>

        <!-- Contact & Delivery Details -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #2c5530; font-size: 18px; margin: 0 0 15px 0; font-weight: bold;">
            Contact & Delivery Details
          </h3>
          <p style="margin: 0 0 10px 0; color: #555;">
            Confirm that your phone number and delivery address are accurate.
          </p>
          <p style="margin: 0 0 5px 0; color: #333;">
            <strong>Phone Number</strong> - ${templateData.enrolleePhone}
          </p>
          <p style="margin: 0; color: #333;">
            <strong>Address</strong> - ${templateData.enrolleeAddress}
          </p>
        </div>

        <!-- Update Instructions -->
        <div style="margin-bottom: 25px; padding: 15px; background-color: #e8f4fd; border-left: 4px solid #2c5530; border-radius: 4px;">
          <p style="margin: 0; color: #555; line-height: 1.5;">
            If you would like to update any details, please send an email to
            <a href="mailto:Pharmacybenefitmgt@leadway.com" style="color: #2c5530; text-decoration: none; font-weight: bold;">
              Pharmacybenefitmgt@leadway.com
            </a>
          </p>
        </div>

        <!-- Service Message -->
        <div style="margin-bottom: 20px;">
          <p style="line-height: 1.6; color: #555; margin: 0;">
            Your prompt response will help us continue to deliver the excellent service you deserve.
          </p>
        </div>

        <!-- Thank You -->
        <div style="margin-bottom: 25px;">
          <p style="line-height: 1.6; color: #555; margin: 0;">
            Thank you for being a valued part of our community.
          </p>
        </div>

        <!-- Signature -->
        <div style="margin-top: 30px;">
          <p style="margin: 0 0 5px 0; color: #333; font-weight: bold;">Warm regards,</p>
          <p style="margin: 0 0 5px 0; color: #2c5530; font-weight: bold; font-size: 16px;">Leadway HMO</p>
          <p style="margin: 0; color: #666;">Pharmacy Benefit Team</p>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; padding: 15px; color: #888; font-size: 12px;">
        <p style="margin: 0;">
          This is an automated message from Leadway HMO Pharmacy Benefit Management System
        </p>
      </div>

    </div>
  `;
};

// Main email sending function
// Export the helper functions as well for testing
export { getMedicationsForEnrollee, getQuantityUnit };

export const sendMedicationRefillEmails = async (
  deliveriesWithEnrolleeData: any[],
  selectedMonths: number,
  nextPackDate: string
) => {
  const { user } = authStore.get();
  // Group deliveries by enrollee
  const groupedByEnrollee = deliveriesWithEnrolleeData.reduce((groups: any, delivery: any) => {
    const enrolleeId = delivery.EnrolleeId || delivery.enrolleeid || 'Unknown';
    if (!groups[enrolleeId]) {
      groups[enrolleeId] = [];
    }
    groups[enrolleeId].push(delivery);
    return groups;
  }, {});

  const enrolleeIds = Object.keys(groupedByEnrollee);
  const emailPromises: Promise<any>[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Show initial loading toast
  const loadingToastId = toast.loading(`Sending medication refill emails to ${enrolleeIds.length} enrollees...`);

  try {
    for (const enrolleeId of enrolleeIds) {
      const enrolleeDeliveries = groupedByEnrollee[enrolleeId];
      const primaryDelivery = enrolleeDeliveries[0];

      // Extract enrollee information
      const enrolleeName = primaryDelivery.enrolleename || primaryDelivery.EnrolleeName || 'Valued Member';
      const enrolleeEmail = primaryDelivery.enrolleeData?.Member_EmailAddress_One || primaryDelivery.enrolleeData?.Member_Email || primaryDelivery.Member_Email;
      const enrolleePhone = primaryDelivery.phonenumber || primaryDelivery.enrolleephone ||
        primaryDelivery.PhoneNumber || primaryDelivery.EnrolleePhone || 'Phone not available';
      const enrolleeAddress = primaryDelivery.deliveryaddress || primaryDelivery.enrolleeaddress ||
        primaryDelivery.DeliveryAddress || primaryDelivery.EnrolleeAddress || 'Address not available';

      // Skip if no email address
      if (!enrolleeEmail) {
        console.warn(`No email address found for enrollee ${enrolleeId} (${enrolleeName})`);
        failureCount++;
        continue;
      }

      // Get medications for this enrollee
      const medications = getMedicationsForEnrollee(enrolleeDeliveries, enrolleeId, selectedMonths);

      // Prepare template data
      const templateData: EmailTemplateData = {
        enrolleeName,
        enrolleeId,
        enrolleePhone,
        enrolleeAddress,
        medications,
        packingPeriod: `${selectedMonths} month${selectedMonths !== 1 ? 's' : ''} supply ending ${nextPackDate}`
      };

      // Prepare email payload
      const emailPayload: EmailPayload = {
        EmailAddress: enrolleeEmail,
        CC: `healthpartnerships@leadway.com, ${user?.Email || ''}`,
        BCC: "",
        Subject: `Medication Refill Confirmation - ${enrolleeName} (ID: ${enrolleeId})`,
        MessageBody: getEmailTemplate(templateData),
        Attachments: null,
        Category: "PHARMACY_DELIVERY",
        UserId: user?.User_id || 0,
        ProviderId: 0,
        ServiceId: 0,
        Reference: enrolleeId,
        TransactionType: "DELIVERY_NOTIFICATION",
      };

      // Create email promise
      const emailPromise = fetch(`${API_URL}/EnrolleeProfile/SendEmailAlert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to send email to ${enrolleeName}: ${response.statusText}`);
          }
          const result = await response.json();
          successCount++;
          console.log(`Email sent successfully to ${enrolleeName} (${enrolleeEmail})`);
          return { success: true, enrolleeName, enrolleeEmail, result };
        })
        .catch((error) => {
          failureCount++;
          console.error(`Failed to send email to ${enrolleeName} (${enrolleeEmail}):`, error);
          return { success: false, enrolleeName, enrolleeEmail, error: error.message };
        });

      emailPromises.push(emailPromise);
    }

    // Wait for all emails to complete
    const results = await Promise.all(emailPromises);

    // Dismiss loading toast
    toast.dismiss(loadingToastId);

    // Show results
    if (successCount > 0 && failureCount === 0) {
      toast.success(`🎉 All ${successCount} medication refill confirmation emails sent successfully!`);
    } else if (successCount > 0 && failureCount > 0) {
      toast.success(`📧 ${successCount} emails sent successfully, ${failureCount} failed. Check console for details.`);
    } else if (failureCount > 0 && successCount === 0) {
      toast.error(`❌ Failed to send all ${failureCount} emails. Check console for details.`);
    }

    console.log('Email sending results:', {
      totalAttempted: enrolleeIds.length,
      successful: successCount,
      failed: failureCount,
      details: results
    });

    return {
      totalAttempted: enrolleeIds.length,
      successful: successCount,
      failed: failureCount,
      details: results
    };

  } catch (error) {
    toast.dismiss(loadingToastId);
    toast.error(`Failed to send medication refill emails: ${(error as Error).message}`);
    throw error;
  }
};
