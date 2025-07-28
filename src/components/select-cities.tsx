import { useCallback, useEffect, useRef, useState } from "react";
import { SharedSelection } from "@heroui/system";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { Select, SelectItem } from "@heroui/select";
import { useAsyncChunk } from "stunk/react";

import { City, citiesChunk } from "@/lib/store/states-store";

interface SelectCitiesProps {
  stateId: string;
  onCityChange?: (cityName: string) => void;
  selectedCityName?: string; // Add this prop to set initial city
}

export default function SelectCities({
  stateId,
  onCityChange,
  selectedCityName,
}: SelectCitiesProps) {
  const { data, loading: initLoading, error } = useAsyncChunk(citiesChunk);

  const [displayedCities, setDisplayedCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<Set<string>>(new Set());
  const [isStateChanging, setIsStateChanging] = useState(false);

  const cities = Array.isArray(data)
    ? data.sort((a, b) => a.Text.localeCompare(b.Text))
    : [];

  const dataLoaded = useRef(false);
  const prevStateId = useRef<string>("");
  const LIMIT = 10;
  const currentOffset = useRef(0);

  // Set initial city selection when cities data loads and we have a selectedCityName
  useEffect(() => {
    if (cities.length > 0 && selectedCityName && selectedCity.size === 0) {
      const foundCity = cities.find(
        (city) =>
          city.Text.toLowerCase().trim() ===
          selectedCityName.toLowerCase().trim()
      );

      if (foundCity) {
        setSelectedCity(new Set([foundCity.Value]));
      }
    }
  }, [cities, selectedCityName, selectedCity.size]);

  // Update params and fetch cities when stateId changes
  useEffect(() => {
    if (stateId && stateId !== prevStateId.current && stateId.trim() !== "") {
      setIsStateChanging(true);

      // Clear everything immediately
      setSelectedCity(new Set());
      setDisplayedCities([]);
      setHasMore(true);
      currentOffset.current = 0;
      dataLoaded.current = false;

      // Update the previous state reference
      prevStateId.current = stateId;

      // Fetch cities for the new state
      citiesChunk.setParams(stateId);
      citiesChunk.reload(stateId);
    }
  }, [stateId]);

  // Reset state changing flag when new data arrives
  useEffect(() => {
    if (!initLoading && stateId === prevStateId.current) {
      setIsStateChanging(false);
    }
  }, [initLoading, stateId]);

  // Clear cities when no state is selected
  useEffect(() => {
    if (!stateId || stateId.trim() === "") {
      setDisplayedCities([]);
      setSelectedCity(new Set());
      setHasMore(false);
      currentOffset.current = 0;
      dataLoaded.current = false;
      prevStateId.current = "";
    }
  }, [stateId]);

  // Load initial batch of cities
  useEffect(() => {
    if (
      cities.length > 0 &&
      !dataLoaded.current &&
      stateId === prevStateId.current &&
      stateId &&
      data
    ) {
      const initialBatch = cities.slice(0, LIMIT);
      setDisplayedCities(initialBatch);
      setHasMore(cities.length > LIMIT);
      currentOffset.current = LIMIT;
      dataLoaded.current = true;

      // Set selected city if we have selectedCityName
      if (selectedCityName && selectedCity.size === 0) {
        const foundCity = cities.find(
          (city) =>
            city.Text.toLowerCase().trim() ===
            selectedCityName.toLowerCase().trim()
        );

        if (foundCity) {
          setSelectedCity(new Set([foundCity.Value]));
        }
      }
    }
  }, [cities, stateId, data, selectedCityName, selectedCity.size]);

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

      setSelectedCity(new Set(newCityId ? [newCityId] : []));

      // Find the city name for the callback
      const selectedCityData = cities.find((city) => city.Value === newCityId);
      if (selectedCityData && onCityChange) {
        onCityChange(selectedCityData.Text);
      } else if (!newCityId && onCityChange) {
        onCityChange("");
      }
    },
    [cities, onCityChange]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setIsOpen(isOpen);
      if (isOpen && cities && displayedCities.length === 0 && stateId) {
        const initialBatch = cities.slice(0, LIMIT);
        setDisplayedCities(initialBatch);
        currentOffset.current = LIMIT;
        setHasMore(cities.length > LIMIT);
      }
    },
    [cities, displayedCities.length, stateId]
  );

  const [, scrollerRef] = useInfiniteScroll({
    hasMore,
    isEnabled: isOpen,
    shouldUseLoader: false,
    onLoadMore: loadMore,
  });

  // Check if state is selected and not empty
  if (!stateId || stateId.trim() === "") {
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
        <Select
          label="Select City"
          radius="sm"
          isDisabled={true}
          placeholder="Failed to load cities"
        >
          <SelectItem key="error">Failed to load cities</SelectItem>
        </Select>
        <p className="text-red-500 text-sm mt-1">
          Failed to load cities. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Select
        label="Select City"
        placeholder={
          isStateChanging || initLoading ? "Loading cities..." : "Select a city"
        }
        radius="sm"
        isLoading={initLoading || isLoading || isStateChanging}
        items={displayedCities ?? []}
        isDisabled={
          !stateId || cities.length === 0 || initLoading || isStateChanging
        }
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
