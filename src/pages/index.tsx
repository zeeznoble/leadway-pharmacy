import { useAsyncChunk, useChunkValue } from "stunk/react";
import { StatsCard } from "@/components/stats-card";
import { dashboardStatsChunk } from "@/lib/services/dashboard-stats";
import {
  EnrolleeIcon,
  PendingIcon,
  PharmacyIcon,
  ScheduleIcon,
} from "@/components/icons/main-icons";
import StaticDeliveryTable from "@/components/static-del-table";
import { deliveryStore } from "@/lib/store/delivery-store";

export default function IndexPage() {
  const {
    data: stats,
    error: statsError,
    loading: statsLoading,
  } = useAsyncChunk(dashboardStatsChunk);
  const { deliveries, isLoading, error } = useChunkValue(deliveryStore);

  return (
    <section className="py-6">
      {statsLoading && (
        <div className="bg-gray-50 text-gray-600 p-4 rounded-lg mb-6">
          Loading dashboard stats...
        </div>
      )}
      {statsError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          Error loading dashboard stats: {statsError.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatsCard
          title="Total Pharmacies"
          value={stats?.pharmacyCount ?? 0}
          icon={<PharmacyIcon stroke="#475467" />}
          color="border-l-blue-500"
        />
        <StatsCard
          title="Total Enrollees"
          value={stats?.enrolleeCount ?? 0}
          icon={<EnrolleeIcon stroke="#475467" />}
          color="border-l-green-500"
        />
        <StatsCard
          title="Packed but not delivered"
          value={stats?.totalSchedules ?? 0}
          icon={<ScheduleIcon />}
          color="border-l-purple-500"
        />
        <StatsCard
          title="Delivered"
          value={stats?.pendingCount ?? 0}
          icon={<PendingIcon />}
          color="border-l-yellow-500"
        />
      </div>

      {isLoading || statsLoading ? (
        <div className="text-center py-10">Loading deliveries...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : deliveries && deliveries.length > 0 ? (
        <StaticDeliveryTable deliveries={deliveries} />
      ) : (
        <div className="text-center p-8 text-gray-500">No deliveries found</div>
      )}
    </section>
  );
}
