import { useEffect, useRef, useState, useCallback } from "react";

import { useAsyncChunk, useChunk } from "stunk/react";

import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";

import { appChunk } from "@/lib/store/app-store";
import { Discipline, disciplineChunk } from "@/lib/store/discipline-store";

export default function SelectDiscipline() {
  const [_, setState] = useChunk(appChunk);
  const { data, loading: initLoading, error } = useAsyncChunk(disciplineChunk);

  const [selectedDisc, setSelectedDisc] = useState<Set<string>>(new Set([]));
  const [displayedDisc, setDisplayedDisc] = useState<Discipline[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const discipline = Array.isArray(data) ? data : [];

  const dataLoaded = useRef(false);
  const LIMIT = 10;
  const currentOffset = useRef(0);

  useEffect(() => {
    if (discipline.length > 0 && !dataLoaded.current) {
      const initialBatch = discipline.slice(1, LIMIT);
      setDisplayedDisc(initialBatch);
      setHasMore(discipline.length > LIMIT);
      currentOffset.current = LIMIT;
      if (selectedDisc.size === 0) {
        setSelectedDisc(new Set([String(discipline[1].Department_id)]));
      }
      dataLoaded.current = true;
    }
  }, [discipline, selectedDisc]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      disciplineId: Array.from(selectedDisc)[0] || "",
    }));
  }, [selectedDisc]);

  const loadMore = useCallback(async () => {
    if (!discipline || isLoading || !hasMore) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const nextBatch = discipline.slice(
      currentOffset.current,
      currentOffset.current + LIMIT
    );
    if (nextBatch.length === 0) {
      setHasMore(false);
    } else {
      setDisplayedDisc((prev) => [...prev, ...nextBatch]);
      currentOffset.current += LIMIT;
      setHasMore(currentOffset.current < discipline.length);
    }
    setIsLoading(false);
  }, [discipline, isLoading, hasMore]);

  const handleSelectionChange = (keys: SharedSelection) => {
    setSelectedDisc(new Set(Array.from(keys as Iterable<string>)));
    const selectedDisc = Array.from(keys as Iterable<string>);

    setState((prev) => ({
      ...prev,
      disciplineId: Array.from(selectedDisc)[0] || "",
    }));
  };

  const handleOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen);
    if (isOpen && discipline && displayedDisc.length === 0) {
      const initialBatch = discipline.slice(0, LIMIT);
      setDisplayedDisc(initialBatch);
      currentOffset.current = LIMIT;
      setHasMore(discipline.length > LIMIT);
    }
  };

  const [, scrollerRef] = useInfiniteScroll({
    hasMore,
    isEnabled: isOpen,
    shouldUseLoader: false,
    onLoadMore: loadMore,
  });

  if (error) {
    return (
      <div>
        <p className="text-red-500 text-sm">
          Failed to load states. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Select
        label="Select Discipline"
        radius="sm"
        size="lg"
        isLoading={initLoading || isLoading}
        items={displayedDisc ?? []}
        isDisabled={discipline.length === 0 || initLoading}
        selectedKeys={selectedDisc}
        scrollRef={scrollerRef}
        onSelectionChange={handleSelectionChange}
        onOpenChange={handleOpenChange}
      >
        {(discipline) => (
          <SelectItem key={discipline.Department_id}>
            {discipline.Department}
          </SelectItem>
        )}
      </Select>
    </div>
  );
}
