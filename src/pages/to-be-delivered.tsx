import { useEffect } from "react";
import { useChunkValue } from "stunk/react";
import toast from "react-hot-toast";

import PackTable from "@/components/pack-table";

import { deliveryStore, deliveryActions } from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";
import {
  deliverPackDeliveries,
  fetchDeliveries,
} from "@/lib/services/delivery-service";

export default function ToBeDeliveredPage() {
  const {
    deliveries,
    isLoading,
    error,
    isPackingLoading,
    packingError,
    packingSuccess,
    lastSearchedEnrolleeId,
  } = useChunkValue(deliveryStore);

  const { user } = useChunkValue(authStore);

  useEffect(() => {
    if (user?.UserName) {
      fetchDeliveries(user.UserName, "");
    }

    return () => {
      deliveryActions.resetDeliveryErrors();
    };
  }, [user?.UserName]);

  useEffect(() => {
    if (packingSuccess) {
      if (user?.UserName) {
        fetchDeliveries(user.UserName, lastSearchedEnrolleeId || "");
      }
      deliveryActions.setPackingSuccess(false);
    }
  }, [packingSuccess, user?.UserName, lastSearchedEnrolleeId]);

  useEffect(() => {
    if (packingError) {
      toast.error(packingError);
    }
  }, [packingError]);

  const handleSearch = async (enrolleeId: string) => {
    if (!user?.UserName) {
      toast.error("User information not available");
      return;
    }

    try {
      deliveryActions.updateLastSearchedEnrolleeId(enrolleeId);
      await fetchDeliveries(user.UserName, enrolleeId);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handlePackDelivery = async (selectedDeliveries: any[]) => {
    if (selectedDeliveries.length === 0) {
      toast.error("Please select at least one delivery to pack");
      return;
    }

    try {
      const result = await deliverPackDeliveries(selectedDeliveries);
      if (result.IndividualResults[0].Status === "Success") {
        toast.success(result.IndividualResults[0].Message);
      }
    } catch (error) {
      console.error("Pack error:", error);
    }
  };

  return (
    <section className="py-3">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Packs to be Delivered</h1>
      </div>

      <PackTable
        deliveries={deliveries}
        isLoading={isLoading || isPackingLoading}
        error={error}
        onSearch={handleSearch}
        onPackDelivery={handlePackDelivery}
      />
    </section>
  );
}
