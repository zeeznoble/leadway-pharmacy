import { useEffect, useRef, useState, useCallback } from "react";
import { useAsyncChunk, useChunk } from "stunk/react";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { City, citiesChunk } from "@/lib/store/states-store";
import { appChunk } from "@/lib/store/app-store";

interface SelectCitiesProps {
  stateId: string;
  onCityChange?: (cityId: string) => void;
}

export default function SelectCities({
  stateId,
  onCityChange,
}: SelectCitiesProps) {
  const [appState, setAppState] = useChunk(appChunk);
  const { data, loading: initLoading, error } = useAsyncChunk(citiesChunk);

  const [displayedCities, setDisplayedCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<Set<string>>(new Set());

  const cities = Array.isArray(data)
    ? data.sort((a, b) => a.Text.localeCompare(b.Text))
    : [];

  const dataLoaded = useRef(false);
  const prevStateId = useRef<string>("");
  const LIMIT = 10;
  const currentOffset = useRef(0);

  // Initialize selected city from global state
  useEffect(() => {
    if (appState.cityId && !selectedCity.has(appState.cityId)) {
      setSelectedCity(new Set([appState.cityId]));
    }
  }, [appState.cityId]);

  // Update params and fetch cities when stateId changes
  useEffect(() => {
    if (stateId && stateId !== prevStateId.current) {
      setSelectedCity(new Set());
      setDisplayedCities([]);
      setHasMore(true);
      currentOffset.current = 0;
      dataLoaded.current = false;
      prevStateId.current = stateId;

      setAppState((prev) => ({
        ...prev,
        cityId: "",
      }));

      citiesChunk.setParams(stateId);
      citiesChunk.reload(stateId);
    }
  }, [stateId, setAppState]);

  useEffect(() => {
    if (!stateId) {
      setDisplayedCities([]);
      setSelectedCity(new Set());
      setHasMore(false);
      currentOffset.current = 0;
      dataLoaded.current = false;
      prevStateId.current = "";
    }
  }, [stateId]);

  useEffect(() => {
    if (
      cities.length > 0 &&
      !dataLoaded.current &&
      stateId === prevStateId.current
    ) {
      const initialBatch = cities.slice(0, LIMIT);
      setDisplayedCities(initialBatch);
      setHasMore(cities.length > LIMIT);
      currentOffset.current = LIMIT;
      dataLoaded.current = true;
    }
  }, [cities, stateId]);

  const loadMore = useCallback(async () => {
    if (!cities || isLoading || !hasMore) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const nextBatch = cities.slice(
      currentOffset.current,
      currentOffset.current + LIMIT
    );
    if (nextBatch.length === 0) {
      setHasMore(false);
    } else {
      setDisplayedCities((prev) => [...prev, ...nextBatch]);
      currentOffset.current += LIMIT;
      setHasMore(currentOffset.current < cities.length);
    }
    setIsLoading(false);
  }, [cities, isLoading, hasMore]);

  const handleSelectionChange = useCallback(
    (keys: SharedSelection) => {
      const selectedArray = Array.from(keys as Iterable<string>);
      const newCityId = selectedArray[0] || "";

      // Create new Set to trigger React re-render
      setSelectedCity(new Set(newCityId ? [newCityId] : []));

      setAppState((prev) => ({
        ...prev,
        cityId: newCityId,
      }));

      // Find the city name for the callback
      const selectedCityData = cities.find((city) => city.Value === newCityId);
      if (selectedCityData && onCityChange) {
        onCityChange(selectedCityData.Text);
      }
    },
    [setAppState, cities, onCityChange]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setIsOpen(isOpen);
      if (isOpen && cities && displayedCities.length === 0) {
        const initialBatch = cities.slice(0, LIMIT);
        setDisplayedCities(initialBatch);
        currentOffset.current = LIMIT;
        setHasMore(cities.length > LIMIT);
      }
    },
    [cities, displayedCities.length]
  );

  const [, scrollerRef] = useInfiniteScroll({
    hasMore,
    isEnabled: isOpen,
    shouldUseLoader: false,
    onLoadMore: loadMore,
  });

  if (!stateId) {
    return (
      <Select
        label="Select City"
        radius="sm"
        isDisabled={true}
        placeholder="Select state first"
      >
        <SelectItem key="placeholder">Select state first</SelectItem>
      </Select>
    );
  }

  if (error) {
    return (
      <div>
        <p className="text-red-500 text-sm">
          Failed to load cities. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Select
        label="Select City"
        placeholder={initLoading ? "Loading cities..." : "Select a city"}
        radius="sm"
        isLoading={initLoading || isLoading}
        items={displayedCities ?? []}
        isDisabled={cities.length === 0 || initLoading}
        selectedKeys={selectedCity}
        scrollRef={scrollerRef}
        onSelectionChange={handleSelectionChange}
        onOpenChange={handleOpenChange}
      >
        {(city: City) => <SelectItem key={city.Value}>{city.Text}</SelectItem>}
      </Select>
    </div>
  );
}
