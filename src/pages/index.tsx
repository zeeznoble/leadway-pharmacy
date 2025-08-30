import { useEffect, useState } from "react";
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
import { CalendarDate } from "@internationalized/date";
import { formatDateForAPI } from "@/lib/helpers";
import { fetchDeliveries } from "@/lib/services/delivery-service";
import { DatePicker } from "@heroui/date-picker";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { SelectorIcon } from "@/components/icons/icons";

export const statuses = [
  { key: "packed", label: "Packed" },
  { key: "sent_for_delivery", label: "Sent For Delivery" },
  { key: "pending_approval", label: "Pending Approval" },
  { key: "approved_not_processed", label: "Approved But Not Processed" },
];

export default function IndexPage() {
  const {
    data: stats,
    error: statsError,
    loading: statsLoading,
  } = useAsyncChunk(dashboardStatsChunk);
  const { deliveries, isLoading, error } = useChunkValue(deliveryStore);

  // Date picker states
  const [fromDate, setFromDate] = useState<CalendarDate | null>(null);
  const [toDate, setToDate] = useState<CalendarDate | null>(null);
  const [status, setStatus] = useState<Set<string>>(new Set());

  const loadDeliveries = () => {
    const fromDateStr = formatDateForAPI(fromDate);
    const toDateStr = formatDateForAPI(toDate);

    const selectedStatusKey = Array.from(status)[0] || "";
    const selectedStatusLabel =
      statuses.find((s) => s.key === selectedStatusKey)?.label || "";

    fetchDeliveries("", "", "", fromDateStr, toDateStr, selectedStatusLabel);
  };

  useEffect(() => {
    loadDeliveries();

    console.log("Stats", stats);
  }, [fromDate, toDate, status]);

  const handleClearAll = () => {
    setFromDate(null);
    setToDate(null);
    setStatus(new Set<string>());
  };

  return (
    <section>
      {statsLoading && (
        <div className="bg-gray-50 text-gray-600 rounded-lg mb-6">
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
          title="Pharmacy Count"
          value={stats?.pharmacyCount ?? 0}
          icon={<PharmacyIcon stroke="#475467" />}
          color="border-l-blue-500"
        />
        <StatsCard
          title="Active Enrollees"
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

      <div className="mb-4 py-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <DatePicker
              label="From Date"
              showMonthAndYearPickers
              value={fromDate}
              onChange={setFromDate}
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

            <Select
              disableSelectorIconRotation
              className="max-w-xs"
              label="Delivery Status"
              placeholder="Select a status"
              selectorIcon={<SelectorIcon />}
              selectedKeys={status}
              onSelectionChange={(keys) => setStatus(keys as Set<string>)}
            >
              {statuses.map((status) => (
                <SelectItem key={status.key}>{status.label}</SelectItem>
              ))}
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              onPress={handleClearAll}
              color="default"
              radius="sm"
              size="sm"
              disabled={!fromDate && !toDate && status.size === 0}
            >
              Clear Filters
            </Button>
          </div>
        </div>
        {(fromDate || toDate || status.size > 0) && (
          <div className="mt-2 text-sm text-gray-600">
            Filtering deliveries
            {fromDate && ` from ${formatDateForAPI(fromDate)}`}
            {toDate && ` to ${formatDateForAPI(toDate)}`}
            {status.size > 0 &&
              ` with status: ${Array.from(status)
                .map((key) => statuses.find((s) => s.key === key)?.label)
                .filter(Boolean)
                .join(", ")}`}
          </div>
        )}
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
