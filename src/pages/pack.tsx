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

  // Updated to receive both date and months
  // const handleConfirmPack = async (
  //   nextPackDate: CalendarDate,
  //   selectedMonths: number
  // ) => {
  //   try {
  //     const formattedDate = nextPackDate.toString();

  //     // Prepare deliveries for API call (minimal data only)
  //     const deliveriesForAPI = selectedDeliveriesToPack.map((delivery: any) => {
  //       console.log(delivery);
  //       // Extract the API payload and update the Notes with months
  //       const apiPayload = {
  //         DeliveryEntryNo: delivery.EntryNo,
  //         PackedBy: user?.UserName || "",
  //         Notes: `${selectedMonths}`,
  //         nextpackdate: formattedDate,
  //       };

  //       return apiPayload;
  //     });

  //     console.log("API Payload (minimal data):", deliveriesForAPI);

  //     // Make API call with minimal data only
  //     const result = await packDeliveries(deliveriesForAPI);

  //     if (result && result.Results[0].status === 200) {
  //       toast.success(result.Results[0].ReturnMessage);

  //       try {
  //         // Generate single PDF with all selected deliveries grouped by enrollee
  //         console.log(
  //           "Selected Deliveries for PDF (full data):",
  //           selectedDeliveriesToPack
  //         );

  //         // Call the modified PDF generation function
  //         await generateDeliveryNotePDF(
  //           selectedDeliveriesToPack,
  //           selectedMonths
  //         );

  //         toast.success(
  //           `Delivery note PDF with ${selectedDeliveriesToPack.length} deliveries downloaded successfully!`
  //         );
  //       } catch (pdfError) {
  //         console.error("PDF generation error:", pdfError);
  //         toast.error("Failed to generate delivery note PDF");
  //       }

  //       // Refresh the data after successful packing
  //       loadUnpackedDeliveries();
  //     }
  //   } catch (error) {
  //     console.error("Pack error:", error);
  //     toast.error("Failed to pack deliveries");
  //   } finally {
  //     setSelectedDeliveriesToPack([]);
  //   }
  // };

  const handleConfirmPack = async (
    nextPackDate: CalendarDate,
    originalMonths: number,
    actualMonths: number
  ) => {
    try {
      const formattedDate = nextPackDate.toString();

      // Prepare deliveries for API call with adjusted logic
      const deliveriesForAPI = selectedDeliveriesToPack.map((delivery: any) => {
        console.log("Processing delivery:", delivery);

        // Extract EndDate from delivery
        const endDate = delivery.EndDate || delivery.enddate;
        let finalDate = formattedDate;
        let finalMonths = originalMonths;

        if (endDate) {
          const endDateObj = new Date(endDate);
          const nextPackDateObj = nextPackDate.toDate(getLocalTimeZone());

          if (nextPackDateObj > endDateObj) {
            // Use EndDate as the final date
            finalDate = endDateObj.toISOString().split("T")[0];

            // Calculate months difference between today and EndDate
            const today = new Date();
            const yearsDiff = endDateObj.getFullYear() - today.getFullYear();
            const monthsDiff = endDateObj.getMonth() - today.getMonth();
            const daysDiff = endDateObj.getDate() - today.getDate();

            let calculatedMonths = yearsDiff * 12 + monthsDiff;

            // If the day difference is negative, reduce by one month
            if (daysDiff < 0) {
              calculatedMonths -= 1;
            }

            // Ensure calculated months is at least 1
            finalMonths = Math.max(1, calculatedMonths);

            console.log(`Date adjusted for delivery ${delivery.EntryNo}:`);
            console.log(`- Original months: ${originalMonths}`);
            console.log(`- Calculated months: ${finalMonths}`);
            console.log(`- Original next pack date: ${formattedDate}`);
            console.log(`- Final next pack date: ${finalDate}`);
            console.log(`- End date: ${endDate}`);
          }
        }

        // Create API payload with adjusted values
        const apiPayload = {
          DeliveryEntryNo: delivery.EntryNo,
          PackedBy: user?.UserName || "",
          Notes: `${finalMonths}`, // Use calculated months
          nextpackdate: finalDate, // Use adjusted date if necessary
        };

        return apiPayload;
      });

      console.log("API Payload with date adjustments:", deliveriesForAPI);

      // Make API call with adjusted data
      const result = await packDeliveries(deliveriesForAPI);

      if (result && result.Results[0].status === 200) {
        toast.success(result.Results[0].ReturnMessage);

        try {
          // Generate single PDF with all selected deliveries grouped by enrollee
          // Use actualMonths for PDF generation (the months that were actually confirmed)
          console.log(
            "Selected Deliveries for PDF (full data):",
            selectedDeliveriesToPack
          );

          // Call the modified PDF generation function with actualMonths
          await generateDeliveryNotePDF(selectedDeliveriesToPack, actualMonths);

          // Show success message with adjustment info if applicable
          const adjustmentInfo =
            actualMonths !== originalMonths
              ? ` (adjusted from ${originalMonths} to ${actualMonths} months due to treatment end dates)`
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
        selectedDeliveries={selectedDeliveriesToPack} // Pass selected deliveries
      />
    </section>
  );
}
