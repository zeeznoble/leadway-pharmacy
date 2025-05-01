import { useState, useEffect } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";

import { Provider } from "@/types";
import { fetchSelectProviders } from "@/lib/services/fetch-pro-select";

interface ProviderAutocompleteProps {
  onSelect: (provider: Provider | null) => void;
  enrolleeId: string;
  isDisabled?: boolean;
  selectedProvider?: Provider | null;
}

export function useProviderList({
  enrolleeId,
  fetchDelay = 0,
}: { enrolleeId?: string; fetchDelay?: number } = {}) {
  const [displayedItems, setDisplayedItems] = useState<Provider[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  const loadProviders = async (pageNum = 0) => {
    try {
      setIsLoading(true);
      if (fetchDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, fetchDelay));
      }

      if (!enrolleeId) {
        setDisplayedItems([]);
        setHasMore(false);
        return;
      }

      const { providers, hasMore: moreAvailable } = await fetchSelectProviders(
        pageNum,
        limit,
        enrolleeId
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
    if (enrolleeId) {
      loadProviders(0);
    }
  }, [enrolleeId]);

  const onLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadProviders(nextPage);
  };

  return {
    items: displayedItems,
    hasMore,
    isLoading,
    onLoadMore,
    setDisplayedItems, // Export this so we can update items if needed
  };
}

export default function ProviderAutocomplete({
  onSelect,
  enrolleeId,
  isDisabled,
  selectedProvider,
}: ProviderAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { items, hasMore, isLoading, onLoadMore } = useProviderList({
    enrolleeId,
    fetchDelay: 500,
  });

  const [, scrollerRef] = useInfiniteScroll({
    hasMore,
    isEnabled: isOpen,
    shouldUseLoader: false,
    onLoadMore,
  });

  // Log selectedProvider for debugging
  console.log("ProviderAutocomplete selectedProvider:", selectedProvider);

  // Set default selected key
  const defaultKey = selectedProvider
    ? `${selectedProvider.Pharmacyid}-${selectedProvider.PharmacyName}`
    : undefined;

  return (
    <Autocomplete
      className="w-full"
      defaultItems={items}
      isLoading={isLoading}
      label="Select Pharmacy"
      placeholder="Search for a pharmacy"
      scrollRef={scrollerRef}
      variant="bordered"
      isDisabled={isDisabled}
      onOpenChange={setIsOpen}
      defaultSelectedKey={defaultKey}
      onSelectionChange={(key) => {
        const selected = items.find(
          (item) => `${item.Pharmacyid}-${item.PharmacyName}` === key
        );
        console.log("ProviderAutocomplete onSelect:", selected); // Debug log
        onSelect(selected || null);
      }}
    >
      {(item: Provider) => (
        <AutocompleteItem key={`${item.Pharmacyid}-${item.PharmacyName}`}>
          {item.PharmacyName}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
}
