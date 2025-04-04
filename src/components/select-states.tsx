import { useEffect, useRef, useState, useCallback } from "react";

import { useAsyncChunk, useChunk } from "stunk/react";

import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { State, statesChunk } from "@/lib/store/states-store";
import { IdsChunk } from "@/lib/store/enrollee-store";

export default function SelectStates() {
  const [_, setIds] = useChunk(IdsChunk);
  const { data, loading: initLoading, error } = useAsyncChunk(statesChunk);

  const [selectedState, setSelectedState] = useState<Set<string>>(new Set([]));
  const [displayedStates, setDisplayedStates] = useState<State[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const states = Array.isArray(data) ? data : [];

  const dataLoaded = useRef(false);
  const LIMIT = 10;
  const currentOffset = useRef(0);

  useEffect(() => {
    if (states.length > 0 && !dataLoaded.current) {
      const initialBatch = states.slice(0, LIMIT);
      setDisplayedStates(initialBatch);
      setHasMore(states.length > LIMIT);
      currentOffset.current = LIMIT;
      if (selectedState.size === 0) {
        setSelectedState(new Set([states[0].Value]));
      }
      dataLoaded.current = true;
    }
  }, [states, selectedState]);

  useEffect(() => {
    setIds((prev) => ({
      ...prev,
      stateId: Array.from(selectedState)[0] || "",
    }));
  }, [selectedState]);

  const loadMore = useCallback(async () => {
    if (!states || isLoading || !hasMore) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const nextBatch = states.slice(
      currentOffset.current,
      currentOffset.current + LIMIT
    );
    if (nextBatch.length === 0) {
      setHasMore(false);
    } else {
      setDisplayedStates((prev) => [...prev, ...nextBatch]);
      currentOffset.current += LIMIT;
      setHasMore(currentOffset.current < states.length);
    }
    setIsLoading(false);
  }, [states, isLoading, hasMore]);

  const handleSelectionChange = (keys: SharedSelection) => {
    setSelectedState(new Set(Array.from(keys as Iterable<string>)));
    const selectedState = Array.from(keys as Iterable<string>);

    console.log("Selected state:", selectedState);
    setIds((prev) => ({
      ...prev,
      stateId: Array.from(selectedState)[0] || "",
    }));
  };

  const handleOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen);
    if (isOpen && states && displayedStates.length === 0) {
      const initialBatch = states.slice(0, LIMIT);
      setDisplayedStates(initialBatch);
      currentOffset.current = LIMIT;
      setHasMore(states.length > LIMIT);
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
        label="Select State"
        radius="sm"
        size="lg"
        isLoading={initLoading || isLoading}
        items={displayedStates ?? []}
        isDisabled={states.length === 0 || initLoading}
        selectedKeys={selectedState}
        scrollRef={scrollerRef}
        onSelectionChange={handleSelectionChange}
        onOpenChange={handleOpenChange}
      >
        {(state: State) => (
          <SelectItem key={state.Value}>{state.Text}</SelectItem>
        )}
      </Select>
    </div>
  );
}
