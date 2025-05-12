import { useState, useEffect } from "react";
import { Provider } from "@/types";
import { fetchSelectProviders } from "@/lib/services/fetch-pro-select";

export function useProviderList({
  enrolleeId,
  fetchDelay = 0,
}: { enrolleeId?: string; fetchDelay?: number } = {}) {
  const [displayedItems, setDisplayedItems] = useState<Provider[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const loadProviders = async (reset = false) => {
    if (!enrolleeId) {
      setDisplayedItems([]);
      setHasMore(false);
      return;
    }

    try {
      setIsLoading(true);

      if (fetchDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, fetchDelay));
      }

      const currentOffset = reset ? 0 : offset;
      console.log("Loading providers with offset:", currentOffset);

      const { providers, hasMore: moreAvailable, currentPage, totalPages } =
        await fetchSelectProviders(currentOffset, limit, enrolleeId);

      console.log("Loaded providers:", {
        providersCount: providers.length,
        currentPage,
        totalPages,
        hasMore: moreAvailable,
        providerIds: providers.map((p) => p.Pharmacyid),
      });

      if (reset) {
        setDisplayedItems(providers);
      } else {
        const existingIds = new Set(displayedItems.map((item) => item.Pharmacyid));
        const newItems = providers.filter((item) => !existingIds.has(item.Pharmacyid));
        setDisplayedItems((prev) => [...prev, ...newItems]);
      }

      // Log all displayed provider IDs
      console.log("Current displayed provider IDs:", displayedItems.map((item) => item.Pharmacyid));
      console.log("Current displayed provider IDs:", displayedItems.map((item) => item.PharmacyName));

      setHasMore(moreAvailable);
    } catch (error) {
      console.error("Load providers error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    loadProviders(true);
  }, [enrolleeId]);

  const onLoadMore = () => {
    if (!isLoading && hasMore) {
      console.log("onLoadMore triggered, new offset:", offset + limit);
      setOffset((prev) => prev + limit);
      loadProviders(false);
    }
  };

  return {
    items: displayedItems,
    hasMore,
    isLoading,
    onLoadMore,
    setDisplayedItems,
  };
}
