import { useState, useEffect } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";

import { fetchDiagnoses } from "@/lib/services/fetch-diagnosis";

import { Diagnosis } from "@/types";

interface DiagnosisAutocompleteProps {
  onSelect: (diagnosis: Diagnosis | null) => void;
  isDisabled?: boolean;
}

export function useDiagnosisList({ fetchDelay = 0 } = {}) {
  const [displayedItems, setDisplayedItems] = useState<Diagnosis[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  const loadDiagnoses = async (pageNum = 0) => {
    try {
      setIsLoading(true);
      if (fetchDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, fetchDelay));
      }

      const { diagnoses, hasMore: moreAvailable } = await fetchDiagnoses(
        pageNum,
        limit
      );

      if (pageNum === 0) {
        setDisplayedItems(diagnoses);
      } else {
        setDisplayedItems((prev) => [...prev, ...diagnoses]);
      }

      setHasMore(moreAvailable);
    } catch (error) {
      console.error("Load diagnoses error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnoses(0);
  }, []);

  const onLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadDiagnoses(nextPage);
  };

  return {
    items: displayedItems,
    hasMore,
    isLoading,
    onLoadMore,
  };
}

export default function DiagnosisAutocomplete({
  onSelect,
  isDisabled,
}: DiagnosisAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { items, hasMore, isLoading, onLoadMore } = useDiagnosisList({
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
      label="Select Diagnosis"
      placeholder="Search for a diagnosis"
      scrollRef={scrollerRef}
      variant="bordered"
      isDisabled={isDisabled}
      onOpenChange={setIsOpen}
      onSelectionChange={(key) => {
        const selected = items.find(
          (item) => `${item.DiagnosisId}-${item.DiagnosisName}` === key
        );
        onSelect(selected || null);
      }}
    >
      {(item: Diagnosis) => (
        <AutocompleteItem key={`${item.DiagnosisId}-${item.DiagnosisName}`}>
          {item.DiagnosisName}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
}
