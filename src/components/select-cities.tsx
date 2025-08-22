import { useCallback, useEffect, useRef, useState } from "react";
import { SharedSelection } from "@heroui/system";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { Select, SelectItem } from "@heroui/select";
import { useAsyncChunk } from "stunk/react";

import { City, citiesChunk } from "@/lib/store/states-store";

interface SelectCitiesProps {
  stateId: string;
  onCityChange?: (cityName: string) => void;
  selectedCityName?: string;
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

  const isLagosState = stateId === "72" || stateId === "73";
  const shouldDisable = isLagosState;

  useEffect(() => {
    if (cities.length > 0 && selectedCityName) {
      const foundCity = cities.find(
        (city) =>
          city.Text.toLowerCase().trim() ===
          selectedCityName.toLowerCase().trim()
      );

      if (foundCity) {
        setSelectedCity(new Set([foundCity.Value]));
      }
    }
  }, [cities, selectedCityName]);

  useEffect(() => {
    if (stateId && stateId !== prevStateId.current && stateId.trim() !== "") {
      setIsStateChanging(true);

      setSelectedCity(new Set());
      setDisplayedCities([]);
      setHasMore(true);
      currentOffset.current = 0;
      dataLoaded.current = false;

      prevStateId.current = stateId;

      citiesChunk.setParams(stateId);
      citiesChunk.reload(stateId);
    }
  }, [stateId]);

  useEffect(() => {
    if (!initLoading && stateId === prevStateId.current) {
      setIsStateChanging(false);
    }
  }, [initLoading, stateId]);

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

      if (selectedCityName) {
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
  }, [cities, stateId, data, selectedCityName]);

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
      if (shouldDisable) return;

      const selectedArray = Array.from(keys as Iterable<string>);
      const newCityId = selectedArray[0] || "";

      setSelectedCity(new Set(newCityId ? [newCityId] : []));

      const selectedCityData = cities.find((city) => city.Value === newCityId);
      if (selectedCityData && onCityChange) {
        onCityChange(selectedCityData.Text);
      } else if (!newCityId && onCityChange) {
        onCityChange("");
      }
    },
    [cities, onCityChange, shouldDisable]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (shouldDisable) return;

      setIsOpen(isOpen);
      if (isOpen && cities && displayedCities.length === 0 && stateId) {
        const initialBatch = cities.slice(0, LIMIT);
        setDisplayedCities(initialBatch);
        currentOffset.current = LIMIT;
        setHasMore(cities.length > LIMIT);
      }
    },
    [cities, displayedCities.length, stateId, shouldDisable]
  );

  const [, scrollerRef] = useInfiniteScroll({
    hasMore,
    isEnabled: isOpen && !shouldDisable,
    shouldUseLoader: false,
    onLoadMore: loadMore,
  });

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

  if (shouldDisable && selectedCityName) {
    return (
      <div>
        <Select
          label="Select City"
          radius="sm"
          isDisabled={true}
          placeholder={selectedCityName}
          selectedKeys={selectedCity}
        >
          <SelectItem key="auto">{selectedCityName}</SelectItem>
        </Select>
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
          !stateId ||
          cities.length === 0 ||
          initLoading ||
          isStateChanging ||
          shouldDisable
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
