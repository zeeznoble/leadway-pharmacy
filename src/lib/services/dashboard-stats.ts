import { asyncChunk } from "stunk";
import { fetchProvider } from "./fetch-providers";
import { fetchDeliveries } from "./delivery-service";
import { getUsername } from "../helpers";

type DashboardStats = {
  pharmacyCount: number;
  enrolleeCount: number;
  totalSchedules: number;
  pendingCount: number;
};

export const dashboardStatsChunk = asyncChunk<DashboardStats>(
  async () => {
    // Wait for username to be available
    const username = await getUsername();
    console.log("Fetched username:", username);

    // Fetch data in parallel
    const [pharmacyData, enrolleeData] = await Promise.all([
      fetchProvider({}),
      fetchDeliveries(username, "")
    ]);

    // Calculate counts safely
    const enrolleeCount = enrolleeData?.result?.length
      ? new Set(enrolleeData.result.map((item: any) => item.enrolleeid)).size
      : 0;

    const totalSchedules = enrolleeData?.result?.length
      ? enrolleeData.result.filter((item: any) => item.Packdate).length
      : 0;

    const pendingCount = enrolleeData?.result?.length
      ? enrolleeData.result.filter((item: any) => item.isdelivered).length
      : 0;

    console.log("Calculated counts:", { enrolleeCount, totalSchedules, pendingCount });

    return {
      pharmacyCount: pharmacyData.totalRecord || 0,
      enrolleeCount,
      totalSchedules,
      pendingCount,
    };
  }
);
