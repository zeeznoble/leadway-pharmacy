import { useState } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { useProviderList } from "@/lib/hooks/use-provider-list";
import { Provider } from "@/types";

interface ProviderAutocompleteProps {
  onSelect: (provider: Provider | null) => void;
  enrolleeId: string;
  isDisabled?: boolean;
  selectedProvider?: Provider | null;
}

export default function ProviderAutocomplete({
  onSelect,
  enrolleeId,
  isDisabled,
  selectedProvider,
}: ProviderAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { items, hasMore, isLoading, onLoadMore } = useProviderList({
    enrolleeId,
    fetchDelay: 300,
  });

  const [, scrollerRef] = useInfiniteScroll({
    hasMore,
    isEnabled: isOpen && !isLoading,
    shouldUseLoader: false,
    onLoadMore,
  });

  const filteredItems = searchQuery
    ? items.filter((item) =>
        item.PharmacyName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  const defaultKey = selectedProvider
    ? `${selectedProvider.Pharmacyid}-${selectedProvider.PharmacyName}`
    : undefined;

  return (
    <div className="w-full">
      <Autocomplete
        className="w-full"
        defaultItems={items}
        items={filteredItems}
        isLoading={isLoading}
        label="Select Pharmacy"
        placeholder="Search for a pharmacy"
        scrollRef={scrollerRef}
        variant="bordered"
        isDisabled={isDisabled}
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
          const selected = items.find(
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
      {isLoading && isOpen && items.length > 0 && (
        <div className="text-center py-2 text-sm text-gray-500">
          Loading more options...
        </div>
      )}
      {filteredItems.length === 0 && searchQuery && !isLoading && (
        <div className="text-center py-2 text-sm text-gray-500">
          No providers found for "{searchQuery}"
        </div>
      )}
    </div>
  );
}
