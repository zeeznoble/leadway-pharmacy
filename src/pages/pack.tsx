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

interface DeliveryAdjustment {
  enrolleeId: string;
  enrolleeName: string;
  memberExpiryDate: string;
  adjustedDate: CalendarDate;
  adjustedMonths: number;
  isAdjusted: boolean;
}

export default function PackPage() {
  const state = useChunkValue(deliveryStore);
  const { user } = useChunkValue(authStore);

  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDeliveriesToPack, setSelectedDeliveriesToPack] = useState<any>(
    []
  );

  console.log(selectedDeliveriesToPack);
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

    fetchUnpacked("", enrolleeId, fromDateStr, toDateStr);
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
        fetchUnpacked("", state.lastSearchedEnrolleeId || "");
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
          "",
          searchType === "enrollee" ? searchTerm : "",
          fromDateStr,
          toDateStr
        );
      } else {
        await fetchUnpacked("", fromDateStr, toDateStr);
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

  const handleConfirmPack = async (
    originalMonths: number,
    deliveryAdjustments: DeliveryAdjustment[]
  ) => {
    try {
      // Create a map for quick lookup of adjustments by enrollee ID
      const adjustmentMap = new Map<string, DeliveryAdjustment>();
      deliveryAdjustments.forEach((adj) => {
        adjustmentMap.set(adj.enrolleeId, adj);
      });

      // Prepare deliveries for API call with individual adjustments
      const deliveriesForAPI = selectedDeliveriesToPack.map((delivery: any) => {
        const enrolleeId = delivery.EnrolleeId || delivery.enrolleeid;
        const adjustment = adjustmentMap.get(enrolleeId);

        console.log(`Processing delivery for ${enrolleeId}:`, {
          originalMonths,
          adjustment,
          delivery: delivery.EntryNo,
        });

        let finalMonths = originalMonths;
        let finalDate = "";

        if (adjustment) {
          finalMonths = adjustment.adjustedMonths;
          finalDate = adjustment.adjustedDate.toString();

          if (adjustment.isAdjusted) {
            console.log(`Adjusted delivery ${delivery.EntryNo}:`);
            console.log(`- Original months: ${originalMonths}`);
            console.log(`- Adjusted months: ${finalMonths}`);
            console.log(`- Final date: ${finalDate}`);
            console.log(`- Member expiry: ${adjustment.memberExpiryDate}`);
          }
        } else {
          // Fallback: calculate date manually if no adjustment found
          const today = new Date();
          const futureDate = new Date(today);
          futureDate.setMonth(futureDate.getMonth() + originalMonths);
          finalDate = futureDate.toISOString().split("T")[0];
        }

        // Create API payload with individual adjustments
        const apiPayload = {
          DeliveryEntryNo: delivery.EntryNo,
          PackedBy: user?.UserName || "",
          Notes: `${finalMonths}`, // Use individually calculated months
          nextpackdate: finalDate, // Use individually calculated date
        };

        return apiPayload;
      });

      console.log("API Payload with individual adjustments:", deliveriesForAPI);

      // Make API call with adjusted data
      const result = await packDeliveries(deliveriesForAPI);

      if (result && result.Results[0].status === 200) {
        toast.success(result.Results[0].ReturnMessage);

        try {
          // Calculate the effective months for PDF (use the most common adjusted months or original)
          const monthsCount = new Map<number, number>();
          deliveryAdjustments.forEach((adj) => {
            const count = monthsCount.get(adj.adjustedMonths) || 0;
            monthsCount.set(adj.adjustedMonths, count + 1);
          });

          // Find the most common months value
          let mostCommonMonths = originalMonths;
          let maxCount = 0;
          for (const [months, count] of monthsCount.entries()) {
            if (count > maxCount) {
              maxCount = count;
              mostCommonMonths = months;
            }
          }

          // Generate single PDF with all selected deliveries
          console.log(
            "Selected Deliveries for PDF (full data):",
            selectedDeliveriesToPack
          );

          await generateDeliveryNotePDF(
            selectedDeliveriesToPack,
            mostCommonMonths
          );

          // Show success message with adjustment info
          const adjustedCount = deliveryAdjustments.filter(
            (adj) => adj.isAdjusted
          ).length;
          const adjustmentInfo =
            adjustedCount > 0
              ? ` (${adjustedCount} delivery${adjustedCount > 1 ? "ies" : ""} adjusted due to member expiry dates)`
              : "";

          toast.success(
            `Delivery note PDF with ${selectedDeliveriesToPack.length} deliveries downloaded successfully!${adjustmentInfo}`
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
        selectedDeliveries={selectedDeliveriesToPack}
      />
    </section>
  );
}
