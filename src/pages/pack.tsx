import { useEffect, useState } from "react";
import { useChunkValue } from "stunk/react";
import toast from "react-hot-toast";
import { CalendarDate } from "@internationalized/date";

import { deliveryStore, deliveryActions } from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";
import {
  fetchDeliveries,
  fetchUnpacked,
  packDeliveries,
} from "@/lib/services/delivery-service";
import PackTable from "@/components/pack-table";
import PackDateModal from "@/components/pack-date-modal";

export default function PackPage() {
  const state = useChunkValue(deliveryStore);

  const { user } = useChunkValue(authStore);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDeliveriesToPack, setSelectedDeliveriesToPack] = useState<any>(
    []
  );

  useEffect(() => {
    if (user?.UserName) {
      fetchUnpacked(user.UserName, "", "2024-01-01", "2024-06-30");
    }

    return () => {
      deliveryActions.resetDeliveryErrors();
    };
  }, [user?.UserName]);

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
      await fetchDeliveries(user.UserName, enrolleeId);
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

    // Save selected deliveries and show date modal instead of immediately packing
    setSelectedDeliveriesToPack(selectedDeliveries);
    setShowDateModal(true);
  };

  const handleConfirmPack = async (nextPackDate: CalendarDate) => {
    try {
      // Format the date as needed for your API
      const formattedDate = nextPackDate.toString();

      // Add the nextPackDate to each delivery
      const deliveriesWithDate = selectedDeliveriesToPack.map(
        (delivery: any) => ({
          ...delivery,
          nextpackdate: formattedDate,
        })
      );

      const result = await packDeliveries(deliveriesWithDate);
      if (result && result.Results[0].status === 200) {
        toast.success(result.Results[0].ReturnMessage);
      }
    } catch (error) {
      console.error("Pack error:", error);
      toast.error("Failed to pack deliveries");
    } finally {
      setSelectedDeliveriesToPack([]);
    }
  };

  return (
    <section className="py-3">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pack Deliveries</h1>
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
