import DeliveryTable from "@/components/delivery-table";
import { deliveryStore } from "@/lib/store/delivery-store";
import { useChunkValue } from "stunk/react";

export default function SentDeliveryPage() {
  const { deliveries, isLoading, error } = useChunkValue(deliveryStore);
  return (
    <section className="px-2">
      <div className="flex justify-between mb-4">
        <p className="text-xl">Sent for Delivery</p>
      </div>

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
