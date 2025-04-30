import { asyncChunk } from "stunk";
import { fetchProvider } from "./fetch-providers";
import { fetchDeliveries } from "./delivery-service";

import { getUsername } from "../helpers";

type DashboardStats = {
  pharmacyCount: number;
  enrolleeCount: number;
  totalSchedules: number;
  pendingCount: number;
  isLoading: boolean;
  error: string | null;
};

export const dashboardStatsChunk = asyncChunk<DashboardStats>(
  async () => {
    try {
      // Wait for username to be available
      const username = await getUsername();
      console.log("Fetched username:", username);

      // Fetch data
      const pharmacyData = await fetchProvider({});
      const enrolleeData = await fetchDeliveries(username, "");

      // Log raw data for debugging
      console.log("Enrollee data:", enrolleeData);

      // Calculate counts safely
      const enrolleeCount = enrolleeData?.result?.length
        ?
        new Set(enrolleeData.result.map((item: any) => item.enrolleeid)).size
        : 0;
      const totalSchedules = enrolleeData?.result?.length
        ? // Sum scheduledcount or count records with Packdate
        enrolleeData.result.filter((item: any) => item.Packdate).length
        : 0;
      const pendingCount = enrolleeData?.result?.length
        ? // Count delivered records (isdelivered: true)
        enrolleeData.result.filter((item: any) => item.isdelivered).length
        : 0;

      console.log("Calculated counts:", { enrolleeCount, totalSchedules, pendingCount });

      return {
        pharmacyCount: pharmacyData.totalRecord || 0,
        enrolleeCount,
        totalSchedules,
        pendingCount,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        pharmacyCount: 0,
        enrolleeCount: 0,
        totalSchedules: 0,
        pendingCount: 0,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
  {
    retryCount: 2,
  }
);
