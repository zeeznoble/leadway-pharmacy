import { asyncChunk } from "stunk";
import { fetchProvider } from "./fetch-providers";
import { fetchDeliveries } from "./delivery-service";

type DashboardStats = {
  pharmacyCount: number;
  enrolleeCount: number;
  totalSchedules: number;
  pendingCount: number;
};

export const dashboardStatsChunk = asyncChunk<DashboardStats>(
  async () => {
    const [pharmacyData, enrolleeData] = await Promise.all([
      fetchProvider({}),
      fetchDeliveries("", "")
    ]);

    const dashboardStats = enrolleeData?.result
      ? enrolleeData?.result[0] : 0

    console.log(dashboardStats)

    const enrolleeCount = dashboardStats.enrolleeCount;
    const totalSchedules = dashboardStats.scheduledcount
    const pendingCount = dashboardStats.deliverycount

    return {
      pharmacyCount: pharmacyData.totalRecord || 0,
      enrolleeCount,
      totalSchedules,
      pendingCount,
    };
  }
);
