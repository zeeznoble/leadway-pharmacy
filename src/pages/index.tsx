import { useAsyncChunk } from "stunk/react";

import { StatsCard } from "@/components/stats-card";

import { dashboardStatsChunk } from "@/lib/services/dashboard-stats";
import {
  EnrolleeIcon,
  PendingIcon,
  PharmacyIcon,
  ScheduleIcon,
} from "@/components/icons/main-icons";

export default function IndexPage() {
  const { data: stats, error, loading } = useAsyncChunk(dashboardStatsChunk);

  return (
    <section className="py-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          Error loading dashboard data: {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          title="Total Schedules"
          value={stats?.totalSchedules ?? 0}
          icon={<ScheduleIcon />}
          color="border-l-purple-500"
        />

        <StatsCard
          title="Pending Approvals"
          value={stats?.pendingCount ?? 0}
          icon={<PendingIcon />}
          color="border-l-yellow-500"
        />
      </div>

      {loading && (
        <div className="flex justify-center mt-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </section>
  );
}
