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

// Template for Routine deliveries
const getRoutineEmailTemplate = (templateData: EmailTemplateData): string => {
  const medicationRows = templateData.medications.map(med =>
    `<tr style="border: 1px solid #ddd;">
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; background-color: #fef7f3;">${med.sn}</td>
      <td style="padding: 8px; border: 1px solid #ddd; background-color: #fef7f3;">${med.medication}</td>
      <td style="padding: 8px; border: 1px solid #ddd; background-color: #fef7f3;">${med.dosage}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; background-color: #fef7f3;">${med.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; background-color: #fef7f3;">${med.type}</td>
    </tr>`
  ).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">

      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #f15A24 0%, #C61531 100%); padding: 20px; border-radius: 8px;">
        <h2 style="color: white; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
          MEDICATION REFILL CONFIRMATION
        </h2>
      </div>

      <!-- Main Content -->
      <div style="background-color: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-top: 4px solid #f15A24;">

        <!-- Greeting -->
        <div style="margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; color: #262626;">
            Dear <strong style="color: #f15A24;">${templateData.enrolleeName}</strong>, <strong style="color: #C61531;">[${templateData.enrolleeId}]</strong>,
          </p>
        </div>

        <!-- Introduction -->
        <div style="margin-bottom: 25px;">
          <p style="line-height: 1.6; color: #262626; margin: 0 0 15px 0;">
            We would like to express our heartfelt gratitude for trusting us with your health needs.
            Your confidence in our pharmacy benefit scheme inspires us to serve you even better.
          </p>

          <p style="line-height: 1.6; color: #262626; margin: 0;">
            As we prepare for your next refill (<strong style="color: #f15A24;">${templateData.packingPeriod}</strong>),
            we kindly ask for your assistance in ensuring a seamless service:
          </p>
        </div>

        <!-- Medication Section -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #f15A24; font-size: 18px; margin: 0 0 15px 0; font-weight: bold; border-bottom: 2px solid #f15A24; padding-bottom: 5px;">
            Medication Refills
          </h3>
          <p style="margin: 0 0 15px 0; color: #262626;">
            Please review the information we have on file for your medication refills.
          </p>

          <!-- Medication Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #f15A24 0%, #C61531 100%);">
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
          <h3 style="color: #f15A24; font-size: 18px; margin: 0 0 15px 0; font-weight: bold; border-bottom: 2px solid #f15A24; padding-bottom: 5px;">
            Contact & Delivery Details
          </h3>
          <p style="margin: 0 0 10px 0; color: #262626;">
            Confirm that your phone number and delivery address are accurate.
          </p>
          <p style="margin: 0 0 5px 0; color: #262626;">
            <strong style="color: #C61531;">Phone Number</strong> - ${templateData.enrolleePhone}
          </p>
          <p style="margin: 0; color: #262626;">
            <strong style="color: #C61531;">Address</strong> - ${templateData.enrolleeAddress}
          </p>
        </div>

        <!-- Update Instructions -->
        <div style="margin-bottom: 25px; padding: 15px; background: linear-gradient(135deg, rgba(241, 90, 36, 0.1) 0%, rgba(198, 21, 49, 0.1) 100%); border-left: 4px solid #f15A24; border-radius: 4px;">
          <p style="margin: 0; color: #262626; line-height: 1.5;">
            If you would like to update any details, please send an email to
            <a href="mailto:Pharmacybenefitmgt@leadway.com" style="color: #C61531; text-decoration: none; font-weight: bold;">
              Pharmacybenefitmgt@leadway.com
            </a>
          </p>
        </div>

        <!-- Service Message -->
        <div style="margin-bottom: 20px;">
          <p style="line-height: 1.6; color: #262626; margin: 0;">
            Your prompt response will help us continue to deliver the excellent service you deserve.
          </p>
        </div>

        <!-- Thank You -->
        <div style="margin-bottom: 25px;">
          <p style="line-height: 1.6; color: #262626; margin: 0;">
            Thank you for being a valued part of our community.
          </p>
        </div>

        <!-- Signature -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f15A24;">
          <p style="margin: 0 0 5px 0; color: #262626; font-weight: bold;">Warm regards,</p>
          <p style="margin: 0 0 5px 0; color: #f15A24; font-weight: bold; font-size: 16px;">Leadway HMO</p>
          <p style="margin: 0; color: #C61531; font-weight: 600;">Pharmacy Benefit Team</p>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; padding: 15px; color: #262626; font-size: 12px; background-color: rgba(241, 90, 36, 0.05); border-radius: 6px;">
        <p style="margin: 0;">
          This is an automated message from Leadway HMO Pharmacy Benefit Management System
        </p>
      </div>

    </div>
  `;
};

// Template for One-off deliveries
const getOneOffEmailTemplate = (templateData: EmailTemplateData): string => {
  const medicationRows = templateData.medications.map(med =>
    `<tr style="border: 1px solid #ddd;">
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; background-color: #fef7f3;">${med.sn}</td>
      <td style="padding: 8px; border: 1px solid #ddd; background-color: #fef7f3;">${med.medication}</td>
      <td style="padding: 8px; border: 1px solid #ddd; background-color: #fef7f3;">${med.dosage}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; background-color: #fef7f3;">${med.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; background-color: #fef7f3;">${med.type}</td>
    </tr>`
  ).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">

      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #f15A24 0%, #C61531 100%); padding: 20px; border-radius: 8px;">
        <h2 style="color: white; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
          MEDICATION SUPPLY CONFIRMATION
        </h2>
      </div>

      <!-- Main Content -->
      <div style="background-color: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-top: 4px solid #f15A24;">

        <!-- Greeting -->
        <div style="margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; color: #262626;">
            Dear <strong style="color: #f15A24;">${templateData.enrolleeName}</strong>, <strong style="color: #C61531;">[${templateData.enrolleeId}]</strong>,
          </p>
        </div>

        <!-- Introduction -->
        <div style="margin-bottom: 25px;">
          <p style="line-height: 1.6; color: #262626; margin: 0 0 15px 0;">
            We sincerely appreciate your trust in us to support your health needs.
          </p>

          <p style="line-height: 1.6; color: #262626; margin: 0;">
            We have received your medication supply request, and to ensure smooth processing, we kindly ask for your assistance with the following:
          </p>
        </div>

        <!-- Medication Section -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #f15A24; font-size: 18px; margin: 0 0 15px 0; font-weight: bold; border-bottom: 2px solid #f15A24; padding-bottom: 5px;">
            Medication Supply
          </h3>
          <p style="margin: 0 0 15px 0; color: #262626;">
            Please take a moment to review and confirm the information we have on record for your medication.
          </p>

          <!-- Medication Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #f15A24 0%, #C61531 100%);">
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
          <h3 style="color: #f15A24; font-size: 18px; margin: 0 0 15px 0; font-weight: bold; border-bottom: 2px solid #f15A24; padding-bottom: 5px;">
            Contact & Delivery Details
          </h3>
          <p style="margin: 0 0 10px 0; color: #262626;">
            Confirm that your phone number and delivery address are accurate.
          </p>
          <p style="margin: 0 0 5px 0; color: #262626;">
            <strong style="color: #C61531;">Phone Number</strong> - ${templateData.enrolleePhone}
          </p>
          <p style="margin: 0; color: #262626;">
            <strong style="color: #C61531;">Address</strong> - ${templateData.enrolleeAddress}
          </p>
        </div>

        <!-- Update Instructions -->
        <div style="margin-bottom: 25px; padding: 15px; background: linear-gradient(135deg, rgba(241, 90, 36, 0.1) 0%, rgba(198, 21, 49, 0.1) 100%); border-left: 4px solid #f15A24; border-radius: 4px;">
          <p style="margin: 0; color: #262626; line-height: 1.5;">
            If you would like to update any details, please send an email to
            <a href="mailto:Pharmacybenefitmgt@leadway.com" style="color: #C61531; text-decoration: none; font-weight: bold;">
              Pharmacybenefitmgt@leadway.com
            </a>
          </p>
        </div>

        <!-- Service Message -->
        <div style="margin-bottom: 20px;">
          <p style="line-height: 1.6; color: #262626; margin: 0;">
            Your prompt response will help us continue to deliver the excellent service you deserve.
          </p>
        </div>

        <!-- Thank You -->
        <div style="margin-bottom: 25px;">
          <p style="line-height: 1.6; color: #262626; margin: 0;">
            Thank you for being a valued part of our community.
          </p>
        </div>

        <!-- Signature -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f15A24;">
          <p style="margin: 0 0 5px 0; color: #262626; font-weight: bold;">Warm regards,</p>
          <p style="margin: 0 0 5px 0; color: #f15A24; font-weight: bold; font-size: 16px;">Leadway HMO</p>
          <p style="margin: 0; color: #C61531; font-weight: 600;">Pharmacy Benefit Team</p>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; padding: 15px; color: #262626; font-size: 12px; background-color: rgba(241, 90, 36, 0.05); border-radius: 6px;">
        <p style="margin: 0;">
          This is an automated message from Leadway HMO Pharmacy Benefit Management System
        </p>
      </div>

    </div>
  `;
};

// Main template selector function
const getEmailTemplate = (templateData: EmailTemplateData, deliveryFrequency: string = 'Routine'): string => {
  if (deliveryFrequency === 'One-off') {
    return getOneOffEmailTemplate(templateData);
  }
  return getRoutineEmailTemplate(templateData);
};

// Main email sending function
export { getMedicationsForEnrollee, getQuantityUnit };

export const sendMedicationRefillEmails = async (
  deliveriesWithEnrolleeData: any[],
  selectedMonths: number) => {
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
  const loadingToastId = toast.loading(`Sending medication emails to ${enrolleeIds.length} enrollees...`);

  try {
    for (const enrolleeId of enrolleeIds) {
      const enrolleeDeliveries = groupedByEnrollee[enrolleeId];
      const primaryDelivery = enrolleeDeliveries[0];

      // Get delivery frequency from the primary delivery
      const deliveryFrequency = primaryDelivery.DeliveryFrequency || primaryDelivery.deliveryfrequency || 'Routine';

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
        packingPeriod: `${selectedMonths} month${selectedMonths !== 1 ? 's' : ''}`
      };

      // Determine email subject based on delivery frequency
      const isOneOff = deliveryFrequency === 'One-off';
      const emailSubject = isOneOff
        ? `Medication Supply Confirmation - ${enrolleeName} (ID: ${enrolleeId})`
        : `Medication Refill Confirmation - ${enrolleeName} (ID: ${enrolleeId})`;

      // Prepare email payload
      const emailPayload: EmailPayload = {
        EmailAddress: enrolleeEmail,
        CC: `${user?.Email || ''}`,
        BCC: "",
        Subject: emailSubject,
        MessageBody: getEmailTemplate(templateData, deliveryFrequency),
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
          console.log(`Email sent successfully to ${enrolleeName} (${enrolleeEmail}) - ${deliveryFrequency}`);
          return { success: true, enrolleeName, enrolleeEmail, deliveryFrequency, result };
        })
        .catch((error) => {
          failureCount++;
          console.error(`Failed to send email to ${enrolleeName} (${enrolleeEmail}):`, error);
          return { success: false, enrolleeName, enrolleeEmail, deliveryFrequency, error: error.message };
        });

      emailPromises.push(emailPromise);
    }

    // Wait for all emails to complete
    const results = await Promise.all(emailPromises);

    // Dismiss loading toast
    toast.dismiss(loadingToastId);

    // Show results
    if (successCount > 0 && failureCount === 0) {
      toast.success(`🎉 All ${successCount} medication confirmation emails sent successfully!`);
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
    toast.error(`Failed to send medication emails: ${(error as Error).message}`);
    throw error;
  }
};
