import { asyncChunk } from "stunk";
import { fetchProvider } from "./fetch-providers";
import { fetchDeliveries } from "./delivery-service";
import { authStore } from "../store/app-store";

type DashboardStats = {
  pharmacyCount: number;
  enrolleeCount: number;
  totalSchedules: number;
  pendingCount: number;
  isLoading: boolean;
  error: string | null;
};

export const dashboardStatsChunk = asyncChunk<DashboardStats>(async () => {
  try {
    const username = authStore.get().user?.UserName || '';

    // Use the fetchProvider function with default parameters
    const pharmacyData = await fetchProvider({});
    const enrolleeData = await fetchDeliveries(username, '');

    // Calculate enrolleeCount safely
    const enrolleeCount = enrolleeData?.result[0].enrolleeCount || 0;
    const totalSchedules = enrolleeData?.result[0].scheduledcount || 0;
    const deliverycount = enrolleeData?.result[0].Deliverycount || 0;

    console.log(enrolleeCount, totalSchedules, deliverycount)

    return {
      pharmacyCount: pharmacyData.totalRecord || 0,
      enrolleeCount,
      totalSchedules,
      pendingCount: deliverycount,
      isLoading: false,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      pharmacyCount: 0,
      enrolleeCount: 0,
      totalSchedules: 0,
      pendingCount: 0,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});
