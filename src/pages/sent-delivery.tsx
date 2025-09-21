import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useChunkValue, useAsyncChunk } from "stunk/react";
import { CalendarDate } from "@internationalized/date";
import { DatePicker } from "@heroui/date-picker";
import { Button } from "@heroui/button";

import DeliveryTable from "@/components/delivery-table";
import RiderSelectionModal from "@/components/rider-selection-modal";
import { deliveryStore, deliveryActions } from "@/lib/store/delivery-store";
import { authStore, appChunk } from "@/lib/store/app-store";
import {
  fetchSentForDelivery,
  reassignPackDeliveries,
} from "@/lib/services/delivery-service";
import { fetchAllRiders } from "@/lib/services/rider-service";
import { sendSms, SmsPayload } from "@/lib/services/send-sms";
import {
  formatDateForAPI,
  generateDeliveryCode,
  generateVerificationCode,
  getEnrolleeSmsMessage,
  getRiderSmsMessage,
} from "@/lib/helpers";
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

export default function SentDeliveryPage() {
  const { deliveries, isLoading, error } = useChunkValue(deliveryStore);
  const { user } = useChunkValue(authStore);
  const { enrolleeId } = useChunkValue(appChunk);

  // Date picker states
  const [fromDate, setFromDate] = useState<CalendarDate | null>(null);
  const [toDate, setToDate] = useState<CalendarDate | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const [lastSearchedEnrolleeId, setLastSearchedEnrolleeId] = useState("");
  const [lastSearchType, setLastSearchType] = useState<
    "enrollee" | "pharmacy" | "address"
  >("enrollee");

  // Reassign to rider states
  const [selectedDeliveriesToReassign, setSelectedDeliveriesToReassign] =
    useState<Delivery[]>([]);
  const [showRiderModal, setShowRiderModal] = useState<boolean>(false);
  const [_, setSelectedRider] = useState<Rider | null>(null);

  const {
    data: ridersData,
    loading: ridersLoading,
    error: ridersError,
    reload: riderReload,
  } = useAsyncChunk(fetchAllRiders);

  const riders: Rider[] = ridersData || [];

  const loadSentForDelivery = async (
    searchEnrolleeId: string = "",
    searchType: "enrollee" | "pharmacy" | "address" = "enrollee"
  ) => {
    if (!user?.UserName) return;

    try {
      const fromDateStr = formatDateForAPI(fromDate);
      const toDateStr = formatDateForAPI(toDate);

      const enrolleeIdToUse =
        searchType === "enrollee" ? searchEnrolleeId || enrolleeId : enrolleeId;

      await fetchSentForDelivery(fromDateStr, toDateStr, enrolleeIdToUse);
    } catch (error) {
      console.error("Failed to load sent for delivery:", error);
      toast.error("Failed to load sent for delivery data");
    }
  };

  const handleSearch = async (
    searchTerm: string,
    searchType: "enrollee" | "pharmacy" | "address" = "enrollee"
  ) => {
    if (!user?.UserName) {
      toast.error("User information not available");
      return;
    }

    try {
      // Store the search term and type for later use
      setLastSearchedEnrolleeId(searchTerm);
      setLastSearchType(searchType);

      // Use the date filters when searching
      const fromDateStr = formatDateForAPI(fromDate);
      const toDateStr = formatDateForAPI(toDate);

      if (searchTerm && searchType === "enrollee") {
        // Only for enrollee search, use the API parameter
        await fetchSentForDelivery(fromDateStr, toDateStr, searchTerm);
      } else {
        // For pharmacy, address, or empty search, load all records
        // The filtering will be handled by DeliveryTable locally
        await fetchSentForDelivery(fromDateStr, toDateStr, enrolleeId);
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  // Handle reassign to rider
  const handleReassignToRider = async (
    selectedDeliveries: Delivery[]
  ): Promise<void> => {
    if (selectedDeliveries.length === 0) {
      toast.error("Please select at least one delivery to reassign");
      return;
    }

    setSelectedDeliveriesToReassign(selectedDeliveries);
    setShowRiderModal(true);
  };

  const sendReassignSms = async (rider: Rider, enrolleeCode: string) => {
    try {
      const selectedDeliveryEntryNo =
        selectedDeliveriesToReassign[0].DeliveryEntryNo;

      const fullDeliveryData = deliveries.find(
        (delivery: any) =>
          delivery.entryno === selectedDeliveryEntryNo ||
          delivery.DeliveryEntryNo === selectedDeliveryEntryNo
      );

      if (!fullDeliveryData) {
        throw new Error("Could not find full delivery data");
      }

      // Send SMS to rider
      const riderSmsPayload: SmsPayload = {
        To: rider.phone_number,
        Message: getRiderSmsMessage(
          `${rider.first_name} ${rider.last_name}`,
          fullDeliveryData.phonenumber || fullDeliveryData.phonenumber,
          fullDeliveryData.enrolleename ||
            fullDeliveryData.enrolleename ||
            "Patient",
          fullDeliveryData.AdditionalInformation ||
            fullDeliveryData.AdditionalInformation ||
            undefined
        ),
        Source: "Drug Delivery",
        SourceId: 1,
        TemplateId: 5,
        PolicyNumber: "",
        ReferenceNo: `REASSIGN_${Date.now()}`,
        UserId: user?.User_id || 0,
      };

      const enrolleeSmsPayload: SmsPayload = {
        To: fullDeliveryData.phonenumber || fullDeliveryData.phonenumber || "",
        Message: getEnrolleeSmsMessage(
          fullDeliveryData.enrolleename ||
            fullDeliveryData.enrolleename ||
            "Patient",
          enrolleeCode,
          rider.phone_number,
          `${rider.first_name} ${rider.last_name}`
        ),
        Source: "Drug Delivery",
        SourceId: 1,
        TemplateId: 5,
        PolicyNumber: "",
        ReferenceNo: `REASSIGN_VERIFICATION_${Date.now()}`,
        UserId: user?.User_id || 0,
      };

      // Send both SMS messages
      const [riderSmsResult, enrolleeSmsResult] = await Promise.all([
        sendSms(riderSmsPayload),
        sendSms(enrolleeSmsPayload),
      ]);

      if (riderSmsResult.success && enrolleeSmsResult.success) {
        console.log("Both reassignment SMS notifications sent successfully");
      } else {
        console.warn("Some reassignment SMS notifications may have failed");
      }
    } catch (error) {
      console.error("Error sending reassignment SMS notifications:", error);
      toast.error("Delivery reassigned but SMS notifications failed");
    }
  };

  const handleRiderConfirm = async (rider: Rider): Promise<void> => {
    try {
      const enrolleeVerificationCode = generateVerificationCode();
      const riderDeliveryCode = generateDeliveryCode();

      console.log(
        "Selected Delivery to Reassign",
        selectedDeliveriesToReassign
      );

      const riderFullName = `${rider.first_name} ${rider.last_name}`;

      const deliveriesForAPI: DeliveryForAPI[] =
        selectedDeliveriesToReassign.map((delivery) => ({
          DeliveryEntryNo:
            delivery.original?.EntryNo || delivery.DeliveryEntryNo,
          Marked_as_delivered_by: riderFullName,
          Notes:
            delivery.original?.Notes ||
            delivery.Notes ||
            `Package for ${delivery.enrollee?.name || "Patient"}`,
          nextdeliverydate:
            delivery.original?.NextDeliveryDate ||
            delivery.NextDeliveryDate ||
            delivery.nextdeliverydate ||
            "",
          rider_id: rider.rider_id!,
          receipientcode: enrolleeVerificationCode,
          ridercode: riderDeliveryCode,
        }));

      // Reassign delivery
      const result = await reassignPackDeliveries(deliveriesForAPI);

      if (result.IndividualResults[0].Status === "Success") {
        // Send SMS notifications after successful reassignment
        await sendReassignSms(rider, enrolleeVerificationCode);

        toast.success(
          "Delivery reassigned and SMS notifications sent successfully!"
        );
        loadSentForDelivery(lastSearchedEnrolleeId, lastSearchType);
      } else {
        toast.error(
          result.IndividualResults[0].Message || "Failed to reassign delivery"
        );
      }
    } catch (error) {
      console.error("Delivery reassignment error:", error);
      toast.error("Failed to reassign delivery");
    } finally {
      setSelectedDeliveriesToReassign([]);
      setSelectedRider(null);
      setShowRiderModal(false);
    }
  };

  // Initial load effect - now checks for user
  useEffect(() => {
    if (user?.UserName && !hasInitialLoad) {
      loadSentForDelivery();
      setHasInitialLoad(true);
    }

    return () => {
      console.log("SentDeliveryPage cleanup: Clearing deliveries data");
      deliveryActions.clearDeliveries();
    };
  }, [user?.UserName, hasInitialLoad]);

  // Effect for date changes (only after initial load)
  useEffect(() => {
    if (user?.UserName && hasInitialLoad) {
      loadSentForDelivery(lastSearchedEnrolleeId, lastSearchType);
    }
  }, [fromDate, toDate]);

  // Load riders when component mounts
  useEffect(() => {
    riderReload();
  }, [deliveries]);

  const handleClearDates = () => {
    setFromDate(null);
    setToDate(null);
  };

  console.log("Deliveries in SentDeliveryPage:", deliveries);

  return (
    <section>
      <div className="mb-4 pb-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <DatePicker
              label="From Date"
              showMonthAndYearPickers
              value={fromDate}
              onChange={setFromDate}
              // maxValue={toDate || today(getLocalTimeZone())}
              className="w-full sm:max-w-md"
              size="sm"
              radius="sm"
            />
            <DatePicker
              label="To Date"
              showMonthAndYearPickers
              value={toDate}
              onChange={setToDate}
              minValue={fromDate || undefined}
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
            Filtering deliveries
            {fromDate && ` from ${formatDateForAPI(fromDate)}`}
            {toDate && ` to ${formatDateForAPI(toDate)}`}
          </div>
        )}
      </div>

      {error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <DeliveryTable
          deliveries={deliveries}
          isLoading={isLoading}
          onSearch={handleSearch}
          onReassignToRider={handleReassignToRider}
          currentSearchTerm={lastSearchedEnrolleeId}
          currentSearchType={lastSearchType}
        />
      )}

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
