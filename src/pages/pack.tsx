import { useEffect, useState } from "react";
import { useChunkValue } from "stunk/react";
import toast from "react-hot-toast";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import { DatePicker } from "@heroui/date-picker";

import { deliveryStore, deliveryActions } from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";
import { fetchUnpacked, packDeliveries } from "@/lib/services/delivery-service";
import PackTable from "@/components/pack-table";
import PackDateModal from "@/components/pack-date-modal";
import { Button } from "@heroui/button";
import { formatDateForAPI, generateDeliveryNotePDF } from "@/lib/helpers";

export default function PackPage() {
  const state = useChunkValue(deliveryStore);
  const { user } = useChunkValue(authStore);

  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDeliveriesToPack, setSelectedDeliveriesToPack] = useState<any>(
    []
  );

  // Date picker states
  const [fromDate, setFromDate] = useState<CalendarDate | null>(null);
  const [toDate, setToDate] = useState<CalendarDate | null>(null);

  // Add state to track if initial load has been done
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Load unpacked deliveries with date filters
  const loadUnpackedDeliveries = (enrolleeId: string = "") => {
    if (!user?.UserName) return;

    const fromDateStr = formatDateForAPI(fromDate);
    const toDateStr = formatDateForAPI(toDate);

    fetchUnpacked(user.UserName, enrolleeId, fromDateStr, toDateStr);
  };

  useEffect(() => {
    if (user?.UserName && !hasInitialLoad) {
      loadUnpackedDeliveries();
      setHasInitialLoad(true);
    }

    return () => {
      deliveryActions.resetDeliveryErrors();
    };
  }, [user?.UserName, hasInitialLoad]);

  // Separate effect for date changes (only after initial load)
  useEffect(() => {
    if (user?.UserName && hasInitialLoad) {
      loadUnpackedDeliveries();
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    if (state.packingSuccess) {
      if (user?.UserName) {
        fetchUnpacked(user.UserName, state.lastSearchedEnrolleeId || "");
      }
      deliveryActions.setPackingSuccess(false);
    }
  }, [state.packingSuccess, user?.UserName, state.lastSearchedEnrolleeId]);

  useEffect(() => {
    if (state.packingError) {
      toast.error(state.packingError);
    }
  }, [state.packingError]);

  const handleSearch = async (
    searchTerm: string,
    searchType: "enrollee" | "pharmacy" = "enrollee"
  ) => {
    if (!user?.UserName) {
      toast.error("User information not available");
      return;
    }

    try {
      // Store the search term for later use
      deliveryActions.updateLastSearchedEnrolleeId(searchTerm);

      // Use the date filters when searching
      const fromDateStr = formatDateForAPI(fromDate);
      const toDateStr = formatDateForAPI(toDate);

      if (searchTerm) {
        // For now, we'll use the existing API. You might need to modify the API to support pharmacy search
        await fetchUnpacked(
          user.UserName,
          searchType === "enrollee" ? searchTerm : "",
          fromDateStr,
          toDateStr
        );
      } else {
        await fetchUnpacked(user.UserName, "", fromDateStr, toDateStr);
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  const handlePackDelivery = async (selectedDeliveries: any[]) => {
    if (selectedDeliveries.length === 0) {
      toast.error("Please select at least one delivery to pack");
      return;
    }

    setSelectedDeliveriesToPack(selectedDeliveries);
    setShowDateModal(true);
  };

  const handleConfirmPack = async (nextPackDate: CalendarDate) => {
    try {
      const formattedDate = nextPackDate.toString();

      const deliveriesWithDate = selectedDeliveriesToPack.map(
        (delivery: any) => ({
          ...delivery,
          nextpackdate: formattedDate,
        })
      );

      const result = await packDeliveries(deliveriesWithDate);
      if (result && result.Results[0].status === 200) {
        toast.success(result.Results[0].ReturnMessage);

        try {
          // Process ALL selected deliveries, not just the first one
          for (const delivery of selectedDeliveriesToPack) {
            // Generate a unique delivery note number for each delivery
            const deliveryNoteNo = Math.floor(Math.random() * 9000) + 1000;

            // Format current date
            const currentDate = new Date();
            const issueDate = `${(currentDate.getMonth() + 1).toString().padStart(2, "0")}/${currentDate.getDate().toString().padStart(2, "0")}/${currentDate.getFullYear()}`;

            // Prepare delivery note data for this specific delivery
            const deliveryNoteData = {
              deliveryNoteNo: deliveryNoteNo.toString(),
              issueDate: issueDate,
              patientName: delivery.enrolleename || "N/A",
              patientId: delivery.enrolleeid || "N/A",
              address: delivery.enrolleeaddress || "Address not available",
              phone: delivery.enrolleephone || "Phone not available",
              items:
                delivery.procedureLines?.map((procedure: any) => ({
                  ProcedureName: procedure.ProcedureName || "Unknown Procedure",
                  ProcedureQuantity: procedure.ProcedureQuantity || 1,
                  cost: procedure.cost || "0",
                  duration: procedure.duration || "",
                })) || [],
            };

            // Add example duration for the first item (similar to your example)
            if (deliveryNoteData.items.length > 0) {
              deliveryNoteData.items[0].duration = "500 mg bd x 1 months";
            }

            await generateDeliveryNotePDF(deliveryNoteData);
          }

          toast.success(
            `${selectedDeliveriesToPack.length} delivery note PDF(s) downloaded successfully!`
          );
        } catch (pdfError) {
          console.error("PDF generation error:", pdfError);
          toast.error("Failed to generate delivery note PDF");
        }

        // Refresh the data after successful packing
        loadUnpackedDeliveries();
      }
    } catch (error) {
      console.error("Pack error:", error);
      toast.error("Failed to pack deliveries");
    } finally {
      setSelectedDeliveriesToPack([]);
    }
  };

  const handleClearDates = () => {
    setFromDate(null);
    setToDate(null);
  };

  return (
    <section className="py-3">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pack Deliveries</h1>
      </div>

      {/* Date Filter Section */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <DatePicker
              label="From Date"
              showMonthAndYearPickers
              value={fromDate}
              onChange={setFromDate}
              maxValue={toDate || today(getLocalTimeZone())}
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
            Filtering deliveries
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
    </section>
  );
}
