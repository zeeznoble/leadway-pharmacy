import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useChunkValue } from "stunk/react";
import { CalendarDate } from "@internationalized/date";
import { DatePicker } from "@heroui/date-picker";
import { Button } from "@heroui/button";

import DeliveryTable from "@/components/delivery-table";
import { deliveryStore } from "@/lib/store/delivery-store";
import { fetchSentForDelivery } from "@/lib/services/delivery-service";
import { formatDateForAPI } from "@/lib/helpers";
import { authStore, appChunk } from "@/lib/store/app-store";
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

  // Initial load effect - now checks for user
  useEffect(() => {
    if (user?.UserName && !hasInitialLoad) {
      loadSentForDelivery();
      setHasInitialLoad(true);
    }
  }, [user?.UserName, hasInitialLoad]); // Added user?.UserName dependency

  // Effect for date changes (only after initial load)
  useEffect(() => {
    if (user?.UserName && hasInitialLoad) {
      loadSentForDelivery(lastSearchedEnrolleeId, lastSearchType);
    }
  }, [fromDate, toDate]); // This should also include user?.UserName dependency if needed

  const handleClearDates = () => {
    setFromDate(null);
    setToDate(null);
  };

  console.log("Deliveries in SentDeliveryPage:", deliveries);

  return (
    <section className="px-2">
      <div className="flex justify-between mb-4">
        <p className="text-xl">Sent for Delivery</p>
      </div>

      {/* Date Filter Section */}
      <div className="mb-4 py-4 bg-gray-50 rounded-lg">
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
          currentSearchTerm={lastSearchedEnrolleeId}
          currentSearchType={lastSearchType}
        />
      )}
    </section>
  );
}
