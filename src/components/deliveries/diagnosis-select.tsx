import { useState, useEffect } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";

import {
  getAllDiagnoses,
  isDiagnosesDataLoaded,
} from "@/lib/services/fetch-diagnosis";

import { Diagnosis } from "@/types";

interface DiagnosisAutocompleteProps {
  onSelect: (diagnosis: Diagnosis | null) => void;
  isDisabled?: boolean;
}

export function useDiagnosisList() {
  const [allItems, setAllItems] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAllDiagnoses = async () => {
    try {
      setIsLoading(true);

      // Wait for data to be loaded if it's not ready yet
      let attempts = 0;
      while (!isDiagnosesDataLoaded() && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (isDiagnosesDataLoaded()) {
        const diagnoses = getAllDiagnoses();
        setAllItems(diagnoses);
        console.log("Loaded all diagnoses for autocomplete:", diagnoses.length);
      } else {
        console.warn("Diagnoses data not loaded after waiting");
      }
    } catch (error) {
      console.error("Load all diagnoses error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllDiagnoses();
  }, []);

  return {
    items: allItems,
    isLoading,
  };
}

export default function DiagnosisAutocomplete({
  onSelect,
  isDisabled,
}: DiagnosisAutocompleteProps) {
  const { items, isLoading } = useDiagnosisList();

  return (
    <Autocomplete
      className="w-full"
      defaultItems={items}
      isVirtualized
      isLoading={isLoading}
      label="Select Diagnosis"
      placeholder="Search for a diagnosis"
      variant="bordered"
      isDisabled={isDisabled}
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
