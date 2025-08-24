import { useEffect } from "react";
import toast from "react-hot-toast";
import { useChunkValue } from "stunk/react";

import DeliveryTable from "@/components/delivery-table";

import { deliveryStore } from "@/lib/store/delivery-store";
import { fetchSentForDelivery } from "@/lib/services/delivery-service";

export default function SentDeliveryPage() {
  const { deliveries, isLoading, error } = useChunkValue(deliveryStore);

  useEffect(() => {
    const loadSentForDelivery = async () => {
      try {
        await fetchSentForDelivery();
      } catch (error) {
        console.error("Failed to load sent for delivery:", error);
        toast.error("Failed to load sent for delivery data");
      }
    };

    loadSentForDelivery();
  }, []);

  console.log("Deliveries in SentDeliveryPage:", deliveries);

  return (
    <section className="px-2">
      {isLoading ? (
        <div className="text-center py-10">Loading deliveries...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <DeliveryTable deliveries={deliveries} />
      )}
    </section>
  );
}
