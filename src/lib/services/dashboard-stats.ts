import { asyncChunk } from "stunk";

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
      const response = await fetch("/api/dashboard/stats");

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      return {
        pharmacyCount: data.pharmacyCount || 0,
        enrolleeCount: data.enrolleeCount || 0,
        totalSchedules: data.totalSchedules || 0,
        pendingCount: data.pendingCount || 0,
        isLoading: false,
        error: null
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        pharmacyCount: 0,
        enrolleeCount: 0,
        totalSchedules: 0,
        pendingCount: 0,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
);
