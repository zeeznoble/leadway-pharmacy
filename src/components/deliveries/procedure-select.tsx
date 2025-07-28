import { useState, useEffect, useMemo } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { toast } from "react-hot-toast";

import { deliveryFormState } from "@/lib/store/delivery-store";
import {
  clearProceduresCache,
  fetchProcedures,
} from "@/lib/services/fetch-procedure";

import { Procedure } from "@/types";

interface ProcedureAutocompleteProps {
  onSelect: (procedure: Procedure | null) => void;
  isDisabled?: boolean;
}

export function useProcedureList({ fetchDelay = 0 } = {}) {
  const [displayedItems, setDisplayedItems] = useState<Procedure[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  const pharmacyId = deliveryFormState.get().pharmacyId;
  const cacheKey = useMemo(() => pharmacyId, [pharmacyId]);

  const loadProcedures = async (pageNum = 0) => {
    if (!hasMore && pageNum !== 0) return;
    if (!pharmacyId) {
      setDisplayedItems([]);
      setHasMore(false);
      toast.error("Please select a pharmacy first");
      return;
    }

    try {
      setIsLoading(true);
      if (fetchDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, fetchDelay));
      }

      const { procedures, hasMore: moreAvailable } = await fetchProcedures(
        pageNum,
        limit
      );

      if (pageNum === 0) {
        setDisplayedItems(procedures);
      } else {
        setDisplayedItems((prev) => [...prev, ...procedures]);
      }

      setHasMore(moreAvailable);
      console.log("HasMore:", moreAvailable, "Items:", displayedItems.length);
    } catch (error) {
      console.error("Load procedures error:", error);
      toast.error("Failed to load procedures");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    clearProceduresCache();
    setDisplayedItems([]);
    setHasMore(true);
    setPage(0);
    loadProcedures(0);
  }, [cacheKey]);

  const onLoadMore = () => {
    if (isLoading || !hasMore) return;
    console.log("Loading more procedures, page:", page + 1);
    const nextPage = page + 1;
    setPage(nextPage);
    loadProcedures(nextPage);
  };

  return {
    items: displayedItems,
    hasMore,
    isLoading,
    onLoadMore,
    reload: () => {
      clearProceduresCache();
      setPage(0);
      loadProcedures(0);
    },
  };
}

export default function ProcedureAutocomplete({
  onSelect,
  isDisabled,
}: ProcedureAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { items, hasMore, isLoading, onLoadMore } = useProcedureList({
    fetchDelay: 500,
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
      label="Select Procedure"
      placeholder="Search for a procedure"
      scrollRef={scrollerRef}
      variant="bordered"
      isDisabled={isDisabled}
      onOpenChange={setIsOpen}
      onSelectionChange={(key) => {
        const selected = items.find(
          (item) => `${item.ProcedureId}-${item.ProcedureName}` === key
        );
        onSelect(selected || null);
      }}
    >
      {(item: Procedure) => (
        <AutocompleteItem key={`${item.ProcedureId}-${item.ProcedureName}`}>
          {item.ProcedureName}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
}
