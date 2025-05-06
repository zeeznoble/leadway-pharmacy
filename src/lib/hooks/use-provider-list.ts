import { useState, useEffect } from "react";
import { Provider } from "@/types";
import { fetchSelectProviders } from "@/lib/services/fetch-pro-select";

export function useProviderList({
  enrolleeId,
  fetchDelay = 0,
}: { enrolleeId?: string; fetchDelay?: number } = {}) {
  const [items, setItems] = useState<Provider[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const loadProviders = async (currentOffset: number) => {
    if (!enrolleeId) {
      setItems([]);
      setHasMore(false);
      return;
    }

    try {
      setIsLoading(true);
      if (fetchDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, fetchDelay));
      }

      const { providers, hasMore: moreAvailable } = await fetchSelectProviders(
        currentOffset,
        limit,
        enrolleeId
      );

      setItems((prev) => {
        // Deduplicate by creating a Map of unique providers
        const providerMap = new Map<string, Provider>();
        const allProviders = currentOffset === 0 ? providers : [...prev, ...providers];
        allProviders.forEach((provider) => {
          const key = `${provider.Pharmacyid}-${provider.PharmacyName}`;
          providerMap.set(key, provider);
        });
        return Array.from(providerMap.values());
      });
      setHasMore(moreAvailable);
    } catch (error) {
      console.error("Load providers error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProviders(0);
  }, [enrolleeId]);

  const onLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    loadProviders(newOffset);
  };

  return {
    items,
    hasMore,
    isLoading,
    onLoadMore,
  };
}
