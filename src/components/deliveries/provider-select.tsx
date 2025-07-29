import { useState } from "react";
import { Button } from "@heroui/button";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { useProviderList } from "@/lib/hooks/use-provider-list";
import { Provider } from "@/types";

interface ProviderAutocompleteProps {
  onSelect: (provider: Provider | null) => void;
  enrolleeId: string;
  isDisabled?: boolean;
  selectedProvider?: Provider | null;
  pharmacyType?: string;
}

export default function ProviderAutocomplete({
  onSelect,
  enrolleeId,
  isDisabled,
  selectedProvider,
  pharmacyType,
}: ProviderAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { items, hasMore, isLoading, onLoadMore, retry, error } =
    useProviderList({
      enrolleeId,
      fetchDelay: 300,
    });

  const [, scrollerRef] = useInfiniteScroll({
    hasMore,
    isEnabled: isOpen && !isLoading,
    shouldUseLoader: false,
    onLoadMore,
  });

  // Filter items based on pharmacy type
  const getFilteredItemsByType = (items: Provider[]) => {
    if (!pharmacyType) return items;

    if (pharmacyType === "Internal") {
      // Show only items that include "Pharmacy benefits"
      return items.filter((item) =>
        item.PharmacyName.toLowerCase().includes("pharmacy benefit")
      );
    } else if (pharmacyType === "External") {
      // Exclude items that include "Pharmacy benefits"
      return items.filter(
        (item) => !item.PharmacyName.toLowerCase().includes("pharmacy benefit")
      );
    }

    return items;
  };

  const typeFilteredItems = getFilteredItemsByType(items);

  const filteredItems = searchQuery
    ? typeFilteredItems.filter((item) =>
        item.PharmacyName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : typeFilteredItems;

  const defaultKey = selectedProvider
    ? `${selectedProvider.Pharmacyid}-${selectedProvider.PharmacyName}`
    : undefined;

  const getPlaceholderText = () => {
    if (!pharmacyType) return "Select pharmacy type first";
    return pharmacyType === "Internal"
      ? "Search for internal pharmacy"
      : "Search for external pharmacy";
  };

  const getLabelText = () => {
    if (!pharmacyType) return "Select Pharmacy";
    return pharmacyType === "Internal"
      ? "Select Internal Pharmacy"
      : "Select External Pharmacy";
  };

  return (
    <div className="w-full">
      {error && (
        <div className="flex justify-between mt-2">
          <p className="text-sm text-red-600">{error}</p>
          <Button size="sm" onPress={retry}>
            Retry
          </Button>
        </div>
      )}
      <Autocomplete
        className="w-full"
        defaultItems={typeFilteredItems}
        items={filteredItems}
        isLoading={isLoading}
        label={getLabelText()}
        placeholder={getPlaceholderText()}
        scrollRef={scrollerRef}
        variant="bordered"
        isDisabled={isDisabled || !pharmacyType}
        onOpenChange={(open) => {
          console.log("Autocomplete open state:", open);
          setIsOpen(open);
        }}
        onInputChange={(value) => {
          console.log("Input changed:", value);
          setSearchQuery(value);
        }}
        defaultSelectedKey={defaultKey}
        onSelectionChange={(key) => {
          const selected = typeFilteredItems.find(
            (item) => `${item.Pharmacyid}-${item.PharmacyName}` === key
          );
          onSelect(selected || null);
        }}
      >
        {(item: Provider) => (
          <AutocompleteItem key={`${item.Pharmacyid}-${item.PharmacyName}`}>
            {item.PharmacyName}
          </AutocompleteItem>
        )}
      </Autocomplete>
      {isLoading && isOpen && typeFilteredItems.length > 0 && (
        <div className="text-center py-2 text-sm text-gray-500">
          Loading more options...
        </div>
      )}
      {filteredItems.length === 0 && searchQuery && !isLoading && (
        <div className="text-center py-2 text-sm text-gray-500">
          No providers found for "{searchQuery}"
        </div>
      )}
      {filteredItems.length === 0 &&
        !searchQuery &&
        !isLoading &&
        pharmacyType && (
          <div className="text-center py-2 text-sm text-gray-500">
            No {pharmacyType.toLowerCase()} pharmacies available
          </div>
        )}
    </div>
  );
}
