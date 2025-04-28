import { useState, useEffect, useMemo } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";

import { Provider } from "@/types";
import {
  fetchSelectProviders,
  clearProvidersCache,
} from "@/lib/services/fetch-pro-select";

interface ProviderAutocompleteProps {
  onSelect: (provider: Provider | null) => void;
  isDisabled?: boolean;
  enrolleeId?: string;
  stateId?: string;
}

export function useProviderList({
  fetchDelay = 0,
  enrolleeId = "",
  stateId = "0",
} = {}) {
  const [displayedItems, setDisplayedItems] = useState<Provider[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Create a cache key based on enrolleeId and stateId
  const cacheKey = useMemo(
    () => `${enrolleeId}-${stateId}`,
    [enrolleeId, stateId]
  );

  const loadProviders = async (pageNum = 0) => {
    if (!hasMore && pageNum !== 0) return; // Prevent fetching if no more data

    try {
      setIsLoading(true);
      if (fetchDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, fetchDelay));
      }

      const { providers, hasMore: moreAvailable } = await fetchSelectProviders(
        pageNum,
        limit,
        enrolleeId,
        stateId
      );

      if (pageNum === 0) {
        setDisplayedItems(providers);
      } else {
        setDisplayedItems((prev) => [...prev, ...providers]);
      }

      setHasMore(moreAvailable);
    } catch (error) {
      console.error("Load providers error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Clear cache and reset state when enrolleeId or stateId changes
    clearProvidersCache();
    setDisplayedItems([]);
    setHasMore(true);
    setPage(0);
    loadProviders(0);
  }, [cacheKey]);

  const onLoadMore = () => {
    if (isLoading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadProviders(nextPage);
  };

  return {
    items: displayedItems,
    hasMore,
    isLoading,
    onLoadMore,
    reload: () => {
      clearProvidersCache();
      setPage(0);
      loadProviders(0);
    },
  };
}

export default function ProviderAutocomplete({
  onSelect,
  isDisabled,
  enrolleeId = "",
  stateId = "0",
}: ProviderAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { items, hasMore, isLoading, onLoadMore } = useProviderList({
    fetchDelay: 500,
    enrolleeId,
    stateId,
  });

  const [, scrollerRef] = useInfiniteScroll({
    hasMore,
    isEnabled: isOpen,
    shouldUseLoader: false,
    onLoadMore,
  });

  return (
    <Autocomplete
      className="w-full"
      defaultItems={items}
      isLoading={isLoading}
      label="Select Provider"
      placeholder="Search for a provider"
      scrollRef={scrollerRef}
      variant="bordered"
      isDisabled={isDisabled}
      onOpenChange={setIsOpen}
      onSelectionChange={(key) => {
        const selected = items.find((item) => `${item.Pharmacyid}` === key);
        onSelect(selected || null);
      }}
    >
      {(item) => (
        <AutocompleteItem key={`${item.Pharmacyid}`}>
          {item.PharmacyName}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
}
