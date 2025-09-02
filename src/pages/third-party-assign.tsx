import { useEffect, useState } from "react";
import { useAsyncChunk, useChunkValue } from "stunk/react";
import toast from "react-hot-toast";
import { CalendarDate } from "@internationalized/date";
import { DatePicker } from "@heroui/date-picker";

import PackTable from "@/components/pack-table";

import { deliveryStore, deliveryActions } from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";
import {
  deliverPackDeliveries,
  fetchPackThirdParty,
} from "@/lib/services/delivery-service";
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
  nextpackdate?: string;
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

export default function ThirdPartyAssignRider() {
  const state = useChunkValue(deliveryStore);
  const { user } = useChunkValue(authStore);

  const [selectedDeliveriesToPack, setSelectedDeliveriesToPack] = useState<
    Delivery[]
  >([]);

  console.log("Deliveries to be Delivered State:", state.deliveries);

  // Date picker states
  const [fromDate, setFromDate] = useState<CalendarDate | null>(null);
  const [toDate, setToDate] = useState<CalendarDate | null>(null);

  const [showRiderModal, setShowRiderModal] = useState<boolean>(false);
  const [_, setSelectedRider] = useState<Rider | null>(null);

  const {
    data: ridersData,
    loading: ridersLoading,
    error: ridersError,
    reload: riderReload,
  } = useAsyncChunk(fetchAllRiders);

  const riders: Rider[] = ridersData || [];

  // Load packed deliveries with date filters
  const loadPackedDeliveries = (enrolleeId: string = ""): void => {
    if (!user?.UserName) return;

    const fromDateStr = formatDateForAPI(fromDate);
    const toDateStr = formatDateForAPI(toDate);

    fetchPackThirdParty("", enrolleeId, fromDateStr, toDateStr);
  };

  useEffect(() => {
    if (user?.UserName) {
      loadPackedDeliveries();
    }

    return () => {
      deliveryActions.resetDeliveryErrors();
    };
  }, [user?.UserName, fromDate, toDate]);

  // 👇 NEW: Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      deliveryActions.clearDeliveries();
      deliveryActions.resetDeliveryErrors();
      deliveryActions.setPackingSuccess(false);
      deliveryActions.updateLastSearchedEnrolleeId("");
    };
  }, []);

  useEffect(() => {
    if (state.packingSuccess) {
      if (user?.UserName) {
        fetchPackThirdParty("", state.lastSearchedEnrolleeId || "");
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

      const fromDateStr = formatDateForAPI(fromDate);
      const toDateStr = formatDateForAPI(toDate);

      await fetchPackThirdParty("", enrolleeId, fromDateStr, toDateStr);
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

    setShowRiderModal(true);
  };

  const sendDeliverySms = async (
    rider: Rider,
    enrolleeCode: string,
    riderCode: string,
    deliveryDate: string
  ): Promise<void> => {
    try {
      const formattedDisplayDate = new Date(deliveryDate).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      const selectedDeliveryEntryNo =
        selectedDeliveriesToPack[0].DeliveryEntryNo;

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

      const enrolleeSmsPayload: SmsPayload = {
        To: fullDeliveryData.phonenumber || "",
        Message: getEnrolleeSmsMessage(
          fullDeliveryData.EnrolleeName || "Patient",
          enrolleeCode,
          rider.phone_number,
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

      if (riderSmsResult.success && enrolleeSmsResult.success) {
        console.log("Both SMS notifications sent successfully");
      } else {
        console.warn("Some SMS notifications may have failed");
      }
    } catch (error) {
      console.error("Error sending SMS notifications:", error);
      toast.error("Delivery scheduled but SMS notifications failed");
    }
  };

  const handleRiderConfirm = async (rider: Rider): Promise<void> => {
    try {
      const enrolleeVerificationCode = generateVerificationCode();
      const riderDeliveryCode = generateDeliveryCode();

      console.log("Selected Delivery to Pack", selectedDeliveriesToPack);

      const riderFullName = `${rider.first_name} ${rider.last_name}`;

      const deliveriesForAPI: DeliveryForAPI[] = selectedDeliveriesToPack.map(
        (delivery) => ({
          DeliveryEntryNo: delivery.DeliveryEntryNo,
          Marked_as_delivered_by: riderFullName,
          Notes:
            delivery.Notes ||
            `Package for ${delivery.enrollee?.name || "Patient"}`,
          nextdeliverydate: delivery.NextDeliveryDate || "",
          rider_id: rider.rider_id!,
          receipientcode: enrolleeVerificationCode,
          ridercode: riderDeliveryCode,
        })
      );

      // Send for delivery
      const result = await deliverPackDeliveries(deliveriesForAPI);

      if (result.IndividualResults[0].Status === "Success") {
        // Send SMS notifications after successful delivery marking
        await sendDeliverySms(
          rider,
          enrolleeVerificationCode,
          riderDeliveryCode,
          selectedDeliveriesToPack[0].nextpackdate || ""
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
      setShowRiderModal(false);
    }
  };

  const handleClearDates = (): void => {
    setFromDate(null);
    setToDate(null);
  };

  useEffect(() => {
    riderReload();
  }, [state.deliveries]);

  return (
    <section className="py-3">
      {/* Date Filter Section */}
      <div className="mb-4 py-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
              // maxValue={toDate || today(getLocalTimeZone())}
              className="w-full sm:max-w-md"
              size="sm"
              radius="sm"
            />
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={setToDate}
              minValue={fromDate || undefined}
              // maxValue={today(getLocalTimeZone())}
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
