import { useEffect, useRef, useState, useCallback } from "react";
import { useAsyncChunk, useChunk } from "stunk/react";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { State, statesChunk } from "@/lib/store/states-store";
import { appChunk } from "@/lib/store/app-store";

export default function SelectStates() {
  const [appState, setAppState] = useChunk(appChunk);
  const { data, loading: initLoading, error } = useAsyncChunk(statesChunk);

  const [displayedStates, setDisplayedStates] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const states = Array.isArray(data)
    ? data
        .filter((state) => state.Value !== "71" && state.Value !== "25")
        .sort((a, b) => a.Text.localeCompare(b.Text))
    : [];

  const dataLoaded = useRef(false);
  const LIMIT = 10;
  const currentOffset = useRef(0);

  // Use a regular Set state with proper React state management
  const [selectedState, setSelectedState] = useState<Set<string>>(new Set());

  // Initialize selected state from global state
  useEffect(() => {
    if (appState.stateId && !selectedState.has(appState.stateId)) {
      setSelectedState(new Set([appState.stateId]));
    }
  }, [appState.stateId]);

  useEffect(() => {
    if (states.length > 0 && !dataLoaded.current) {
      const initialBatch = states.slice(0, LIMIT);
      setDisplayedStates(initialBatch);
      setHasMore(states.length > LIMIT);
      currentOffset.current = LIMIT;

      // Only set default state if no state is currently selected
      if (!appState.stateId && states.length > 0) {
        const defaultStateId = states[0].Value;
        setSelectedState(new Set([defaultStateId]));
        setAppState((prev) => ({
          ...prev,
          stateId: defaultStateId,
        }));
      }

      dataLoaded.current = true;
    }
  }, [states, appState.stateId, setAppState]);

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

  const handleSelectionChange = useCallback(
    (keys: SharedSelection) => {
      const selectedArray = Array.from(keys as Iterable<string>);
      const newStateId = selectedArray[0] || "";

      // Only update if the state actually changed
      if (newStateId !== appState.stateId) {
        // Create a new Set to trigger React re-render
        setSelectedState(new Set([newStateId]));

        setAppState((prev) => ({
          ...prev,
          stateId: newStateId,
          cityId: "", // Reset city when state changes
        }));
      }
    },
    [appState.stateId, setAppState]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setIsOpen(isOpen);
      if (isOpen && states && displayedStates.length === 0) {
        const initialBatch = states.slice(0, LIMIT);
        setDisplayedStates(initialBatch);
        currentOffset.current = LIMIT;
        setHasMore(states.length > LIMIT);
      }
    },
    [states, displayedStates.length]
  );

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
        placeholder="Select a state"
        radius="sm"
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
