import { useEffect, useState } from "react";
import { useAsyncChunk, useChunkValue } from "stunk/react";
import toast from "react-hot-toast";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import { DatePicker } from "@heroui/date-picker";

import PackTable from "@/components/pack-table";

import { deliveryStore, deliveryActions } from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";
import {
  deliverPackDeliveries,
  fetchPacked,
} from "@/lib/services/delivery-service";
import PackDateModal from "@/components/pack-date-modal";
import {
  formatDateForAPI,
  generateDeliveryCode,
  generateVerificationCode,
  getEnrolleeSmsMessage,
  getRiderSmsMessage,
} from "@/lib/helpers";
import { Button } from "@heroui/button";
import { fetchAllRiders } from "@/lib/services/rider-service";
import RiderSelectionModal from "@/components/rider-selection-modal";
import { sendSms, SmsPayload } from "@/lib/services/send-sms";
import { Rider } from "@/types";

interface Enrollee {
  name: string;
}

interface Delivery {
  DeliveryEntryNo: number;
  enrollee?: Enrollee;
  phonenumber?: string;
  Notes?: string;
  [key: string]: any;
}

interface DeliveryForAPI {
  DeliveryEntryNo: number;
  Marked_as_delivered_by: string;
  Notes: string;
  nextdeliverydate: string;
  rider_id: number;
  receipientcode: string;
  ridercode: string;
}

export default function ToBeDeliveredPage() {
  const state = useChunkValue(deliveryStore);
  const { user } = useChunkValue(authStore);

  const [showDateModal, setShowDateModal] = useState<boolean>(false);
  const [selectedDeliveriesToPack, setSelectedDeliveriesToPack] = useState<
    Delivery[]
  >([]);

  // Date picker states
  const [fromDate, setFromDate] = useState<CalendarDate | null>(null);
  const [toDate, setToDate] = useState<CalendarDate | null>(null);

  const [showRiderModal, setShowRiderModal] = useState<boolean>(false);
  const [_, setSelectedRider] = useState<Rider | null>(null);
  const [nextDeliveryDate, setNextDeliveryDate] = useState<CalendarDate | null>(
    null
  );

  const {
    data: ridersData,
    loading: ridersLoading,
    error: ridersError,
  } = useAsyncChunk(fetchAllRiders);

  const riders: Rider[] = ridersData || [];

  // Load packed deliveries with date filters
  const loadPackedDeliveries = (enrolleeId: string = ""): void => {
    if (!user?.UserName) return;

    const fromDateStr = formatDateForAPI(fromDate);
    const toDateStr = formatDateForAPI(toDate);

    fetchPacked(user.UserName, enrolleeId, fromDateStr, toDateStr);
  };

  useEffect(() => {
    if (user?.UserName) {
      loadPackedDeliveries();
    }

    return () => {
      deliveryActions.resetDeliveryErrors();
    };
  }, [user?.UserName, fromDate, toDate]);

  useEffect(() => {
    if (state.packingSuccess) {
      if (user?.UserName) {
        fetchPacked(user.UserName, state.lastSearchedEnrolleeId || "");
      }
      deliveryActions.setPackingSuccess(false);
    }
  }, [state.packingSuccess, user?.UserName, state.lastSearchedEnrolleeId]);

  useEffect(() => {
    if (state.packingError) {
      toast.error(state.packingError);
    }
  }, [state.packingError]);

  const handleSearch = async (enrolleeId: string): Promise<void> => {
    if (!user?.UserName) {
      toast.error("User information not available");
      return;
    }

    try {
      deliveryActions.updateLastSearchedEnrolleeId(enrolleeId);

      // Use the date filters when searching
      const fromDateStr = formatDateForAPI(fromDate);
      const toDateStr = formatDateForAPI(toDate);

      await fetchPacked(user.UserName, enrolleeId, fromDateStr, toDateStr);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  const handlePackDelivery = async (
    selectedDeliveries: Delivery[]
  ): Promise<void> => {
    if (selectedDeliveries.length === 0) {
      toast.error("Please select at least one delivery to mark as delivered");
      return;
    }

    setSelectedDeliveriesToPack(selectedDeliveries);
    console.log("Selected Deliveries to Pack", selectedDeliveries);
    setShowDateModal(true);
  };

  const sendDeliverySms = async (
    rider: Rider,
    enrolleeCode: string,
    riderCode: string,
    deliveryDate: string
  ): Promise<void> => {
    try {
      // Format the delivery date for display
      const formattedDisplayDate = new Date(deliveryDate).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      // Get enrollee information from selected deliveries
      const selectedDeliveryEntryNo =
        selectedDeliveriesToPack[0].DeliveryEntryNo;

      // Find the full delivery data from state using the DeliveryEntryNo
      const fullDeliveryData = state.deliveries.find(
        (delivery: any) => delivery.entryno === selectedDeliveryEntryNo
      );

      console.log("Full Delivery Data:", fullDeliveryData);

      if (!fullDeliveryData) {
        throw new Error("Could not find full delivery data");
      }

      // Send SMS to rider
      const riderSmsPayload: SmsPayload = {
        To: rider.phone_number,
        Message: getRiderSmsMessage(
          `${rider.first_name} ${rider.last_name}`,
          riderCode,
          formattedDisplayDate,
          fullDeliveryData.EnrolleeName || "Patient"
        ),
        Source: "Drug Delivery",
        SourceId: 1,
        TemplateId: 5,
        PolicyNumber: "",
        ReferenceNo: `DELIVERY_${Date.now()}`,
        UserId: user?.User_id || 0,
      };

      // Send SMS to enrollee - using phonenumber field from API response
      const enrolleeSmsPayload: SmsPayload = {
        To: fullDeliveryData.phonenumber || "",
        Message: getEnrolleeSmsMessage(
          fullDeliveryData.EnrolleeName || "Patient",
          enrolleeCode,
          formattedDisplayDate,
          `${rider.first_name} ${rider.last_name}`
        ),
        Source: "Drug Delivery",
        SourceId: 1,
        TemplateId: 5,
        PolicyNumber: "",
        ReferenceNo: `VERIFICATION_${Date.now()}`,
        UserId: user?.User_id || 0,
      };

      // Send both SMS messages
      const [riderSmsResult, enrolleeSmsResult] = await Promise.all([
        sendSms(riderSmsPayload),
        sendSms(enrolleeSmsPayload),
      ]);

      // Log results for debugging
      console.log("Rider SMS result:", riderSmsResult);
      console.log("Enrollee SMS result:", enrolleeSmsResult);

      // Check if both SMS were sent successfully
      if (riderSmsResult.success && enrolleeSmsResult.success) {
        console.log("Both SMS notifications sent successfully");
      } else {
        console.warn("Some SMS notifications may have failed");
      }
    } catch (error) {
      console.error("Error sending SMS notifications:", error);
      // Don't throw error here as delivery was already successful
      toast.error("Delivery scheduled but SMS notifications failed");
    }
  };

  const handleConfirmPack = async (
    nextPackDate: CalendarDate
  ): Promise<void> => {
    try {
      // Store the selected date and deliveries
      setNextDeliveryDate(nextPackDate);
      setShowDateModal(false);
      setShowRiderModal(true);
    } catch (error) {
      console.error("Error in handleConfirmPack:", error);
      toast.error("Failed to proceed with delivery setup");
    }
  };

  const handleRiderConfirm = async (rider: Rider): Promise<void> => {
    try {
      if (!nextDeliveryDate) {
        toast.error("Delivery date not selected");
        return;
      }

      // Generate verification codes
      const enrolleeVerificationCode = generateVerificationCode();
      const riderDeliveryCode = generateDeliveryCode();

      console.log("Selected Delivery to Pack", selectedDeliveriesToPack);

      // Format the date as needed for your API
      const formattedDate = nextDeliveryDate.toString();

      // Create the rider's full name for the API
      const riderFullName = `${rider.first_name} ${rider.last_name}`;

      // Transform deliveries to match API structure
      const deliveriesForAPI: DeliveryForAPI[] = selectedDeliveriesToPack.map(
        (delivery: Delivery) => ({
          DeliveryEntryNo: delivery.DeliveryEntryNo,
          Marked_as_delivered_by: riderFullName, // Use rider's name, not logged-in user
          Notes:
            delivery.Notes ||
            `Package for ${delivery.enrollee?.name || "Patient"}`,
          nextdeliverydate: formattedDate,
          rider_id: rider.rider_id!,
          receipientcode: enrolleeVerificationCode, // Map to correct field name
          ridercode: riderDeliveryCode, // Map to correct field name
        })
      );

      console.log("Deliveries for API:", deliveriesForAPI);

      // Send for delivery
      const result = await deliverPackDeliveries(deliveriesForAPI);

      if (result.IndividualResults[0].Status === "Success") {
        // Send SMS notifications after successful delivery marking
        await sendDeliverySms(
          rider,
          enrolleeVerificationCode,
          riderDeliveryCode,
          formattedDate
        );

        toast.success(
          "Delivery scheduled and SMS notifications sent successfully!"
        );
        loadPackedDeliveries();
      } else {
        toast.error(
          result.IndividualResults[0].Message || "Failed to schedule delivery"
        );
      }
    } catch (error) {
      console.error("Delivery scheduling error:", error);
      toast.error("Failed to schedule delivery");
    } finally {
      setSelectedDeliveriesToPack([]);
      setSelectedRider(null);
      setNextDeliveryDate(null);
    }
  };

  const handleClearDates = (): void => {
    setFromDate(null);
    setToDate(null);
  };

  return (
    <section className="py-3">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Packs to be Delivered</h1>
      </div>
      {/* Date Filter Section */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
              maxValue={toDate || today(getLocalTimeZone())}
              className="w-full sm:max-w-md"
              size="sm"
              radius="sm"
            />
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={setToDate}
              minValue={fromDate || undefined}
              maxValue={today(getLocalTimeZone())}
              className="w-full sm:max-w-md"
              size="sm"
              radius="sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onPress={handleClearDates}
              color="default"
              radius="sm"
              size="sm"
              disabled={!fromDate && !toDate}
            >
              Clear Dates
            </Button>
          </div>
        </div>
        {(fromDate || toDate) && (
          <div className="mt-2 text-sm text-gray-600">
            Filtering packed deliveries
            {fromDate && ` from ${formatDateForAPI(fromDate)}`}
            {toDate && ` to ${formatDateForAPI(toDate)}`}
          </div>
        )}
      </div>
      <PackTable
        deliveries={state.deliveries}
        isLoading={state.isLoading || state.isPackingLoading}
        error={state.error}
        onSearch={handleSearch}
        onPackDelivery={handlePackDelivery}
      />
      <PackDateModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        onConfirm={handleConfirmPack}
      />
      <RiderSelectionModal
        isOpen={showRiderModal}
        onClose={() => setShowRiderModal(false)}
        onConfirm={handleRiderConfirm}
        riders={riders}
        loading={ridersLoading}
        error={ridersError}
      />
    </section>
  );
}
