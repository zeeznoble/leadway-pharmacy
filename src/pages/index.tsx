import { useEffect, useState } from "react";
import { useAsyncChunk, useChunkValue } from "stunk/react";
import { StatsCard } from "@/components/stats-card";
import { dashboardStatsChunk } from "@/lib/services/dashboard-stats";
import {
  EnrolleeIcon,
  PackageIcon,
  PendingIcon,
  PharmacyIcon,
} from "@/components/icons/main-icons";
import StaticDeliveryTable from "@/components/static-del-table";
import { deliveryStore } from "@/lib/store/delivery-store";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { formatDateForAPI, formatDateForDisplay } from "@/lib/helpers";
import { fetchDeliveries } from "@/lib/services/delivery-service";
import { DatePicker } from "@heroui/date-picker";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { SelectorIcon } from "@/components/icons/icons";
import { Spinner } from "@heroui/spinner";
import { Input } from "@heroui/input";

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

  const [fromDate, setFromDate] = useState<CalendarDate | null>(
    today(getLocalTimeZone())
  );
  const [toDate, setToDate] = useState<CalendarDate | null>(
    today(getLocalTimeZone()).add({ months: 1 })
  );
  const [status, setStatus] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!isInitialLoad) return;

    console.log("Initial useEffect triggered with:", {
      fromDate: fromDate?.toString(),
      toDate: toDate?.toString(),
      status: Array.from(status),
      searchQuery,
      timestamp: new Date().toLocaleTimeString(),
    });

    const fromDateStr = formatDateForAPI(fromDate);
    const toDateStr = formatDateForAPI(toDate);
    const selectedStatusKey = Array.from(status)[0] || "";
    const selectedStatusLabel =
      statuses.find((s) => s.key === selectedStatusKey)?.label || "";

    fetchDeliveries(
      "",
      searchQuery,
      "",
      fromDateStr,
      toDateStr,
      selectedStatusLabel
    );
    setIsInitialLoad(false);
  }, [fromDate, toDate, status, searchQuery, isInitialLoad]);

  useEffect(() => {
    if (isInitialLoad) return;

    console.log("Filter change useEffect triggered with:", {
      fromDate: fromDate?.toString(),
      toDate: toDate?.toString(),
      status: Array.from(status),
      searchQuery,
      timestamp: new Date().toLocaleTimeString(),
    });

    const fromDateStr = formatDateForAPI(fromDate);
    const toDateStr = formatDateForAPI(toDate);
    const selectedStatusKey = Array.from(status)[0] || "";
    const selectedStatusLabel =
      statuses.find((s) => s.key === selectedStatusKey)?.label || "";

    fetchDeliveries(
      "",
      searchQuery,
      "",
      fromDateStr,
      toDateStr,
      selectedStatusLabel
    );
  }, [fromDate, toDate, status, searchQuery]);

  const handleClearAll = () => {
    setFromDate(null);
    setToDate(null);
    setStatus(new Set<string>());
    setSearchQuery("");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Pharmacy Count"
          value={stats?.pharmacyCount ?? 0}
          icon={<PharmacyIcon color="oklch(62.3% 0.214 259.815)" />}
          color="border-l-blue-500"
        />
        <StatsCard
          title="Active Enrollees"
          value={stats?.enrolleeCount ?? 0}
          icon={<EnrolleeIcon color="oklch(72.3% 0.219 149.579)" />}
          color="border-l-green-500"
        />
        <StatsCard
          title="Packed but not delivered"
          value={stats?.totalSchedules ?? 0}
          icon={<PendingIcon color="oklch(62.7% 0.265 303.9)" />}
          color="border-l-purple-500"
        />
        <StatsCard
          title="Delivered"
          value={stats?.pendingCount ?? 0}
          icon={<PackageIcon color="oklch(79.5% 0.184 86.047)" />}
          color="border-l-yellow-500"
        />
      </div>
      <div className="mb-4 py-4 px-0 bg-gray-50 rounded-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1 w-full">
            <Input
              aria-label="Search deliveries"
              className="w-full md:max-w-md"
              placeholder="Search by enrollee name..."
              radius="sm"
              label="Search"
              size="sm"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <DatePicker
              label="From Date"
              showMonthAndYearPickers
              value={fromDate}
              onChange={setFromDate}
              className="w-full md:max-w-md"
              size="sm"
              radius="sm"
            />
            <DatePicker
              label="To Date"
              showMonthAndYearPickers
              value={toDate}
              onChange={setToDate}
              minValue={fromDate || undefined}
              className="w-full md:max-w-md"
              size="sm"
              radius="sm"
            />
            <Select
              disableSelectorIconRotation
              className="w-full md:max-w-xs"
              size="sm"
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
              disabled={
                !fromDate && !toDate && status.size === 0 && !searchQuery
              }
            >
              Clear Filters
            </Button>
          </div>
        </div>
        {(fromDate || toDate || status.size > 0 || searchQuery) && (
          <div className="mt-4 text-sm text-gray-600">
            Filtering deliveries
            {searchQuery && ` for "${searchQuery}"`}
            {fromDate && ` from ${formatDateForDisplay(fromDate)}`}
            {toDate && ` to ${formatDateForDisplay(toDate)}`}
            {status.size > 0 &&
              ` with status: ${Array.from(status)
                .map((key) => statuses.find((s) => s.key === key)?.label)
                .filter(Boolean)
                .join(", ")}`}
          </div>
        )}
      </div>

      {isLoading || statsLoading ? (
        <div className="text-center py-10 flex-col">
          <Spinner color="warning" />
          <p>Loading deliveries...</p>
        </div>
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
