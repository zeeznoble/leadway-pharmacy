import { useEffect, useState } from "react";
import { useChunkValue } from "stunk/react";
import toast from "react-hot-toast";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import { DatePicker } from "@heroui/date-picker";

import PackTable from "@/components/pack-table";

import { deliveryStore, deliveryActions } from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";
import {
  deliverPackDeliveries,
  fetchDeliveries,
  fetchPacked,
} from "@/lib/services/delivery-service";
import PackDateModal from "@/components/pack-date-modal";
import { formatDateForAPI } from "@/lib/helpers";
import { Button } from "@heroui/button";

export default function ToBeDeliveredPage() {
  const state = useChunkValue(deliveryStore);
  const { user } = useChunkValue(authStore);

  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDeliveriesToPack, setSelectedDeliveriesToPack] = useState<any>(
    []
  );

  // Date picker states
  const [fromDate, setFromDate] = useState<CalendarDate | null>(null);
  const [toDate, setToDate] = useState<CalendarDate | null>(null);

  // Load packed deliveries with date filters
  const loadPackedDeliveries = (enrolleeId: string = "") => {
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
        fetchDeliveries(user.UserName, state.lastSearchedEnrolleeId || "");
      }
      deliveryActions.setPackingSuccess(false);
    }
  }, [state.packingSuccess, user?.UserName, state.lastSearchedEnrolleeId]);

  useEffect(() => {
    if (state.packingError) {
      toast.error(state.packingError);
    }
  }, [state.packingError]);

  const handleSearch = async (enrolleeId: string) => {
    if (!user?.UserName) {
      toast.error("User information not available");
      return;
    }

    try {
      deliveryActions.updateLastSearchedEnrolleeId(enrolleeId);

      // Use the date filters when searching
      const fromDateStr = formatDateForAPI(fromDate);
      const toDateStr = formatDateForAPI(toDate);

      if (enrolleeId) {
        await fetchPacked(user.UserName, enrolleeId, fromDateStr, toDateStr);
      } else {
        await fetchPacked(user.UserName, enrolleeId, fromDateStr, toDateStr);
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  const handlePackDelivery = async (selectedDeliveries: any[]) => {
    if (selectedDeliveries.length === 0) {
      toast.error("Please select at least one delivery to mark as delivered");
      return;
    }

    setSelectedDeliveriesToPack(selectedDeliveries);
    setShowDateModal(true);
  };

  const handleConfirmPack = async (nextPackDate: CalendarDate) => {
    try {
      // Format the date as needed for your API
      const formattedDate = nextPackDate.toString();

      // Add the nextdeliverydate to each delivery (different from pack page)
      const deliveriesWithDate = selectedDeliveriesToPack.map(
        (delivery: any) => ({
          ...delivery,
          nextdeliverydate: formattedDate,
        })
      );

      const result = await deliverPackDeliveries(deliveriesWithDate);
      if (result.IndividualResults[0].Status === "Success") {
        toast.success(result.IndividualResults[0].Message);
        // Refresh the data after successful delivery marking
        loadPackedDeliveries();
      } else {
        toast.error(
          result.IndividualResults[0].Message || "Failed to deliver packs"
        );
      }
    } catch (error) {
      console.error("Pack delivery error:", error);
      toast.error("Failed to deliver packs");
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
    </section>
  );
}
