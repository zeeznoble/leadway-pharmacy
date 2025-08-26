import { useState } from "react";

import { useChunkValue } from "stunk/react";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { toast } from "react-hot-toast";

import DiagnosisAutocomplete from "./diagnosis-select";
import { useProcedureSearch } from "./procedure-select";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";
import { Diagnosis, Procedure } from "@/types";
import { SearchIcon } from "../icons/icons";

export default function DiagnosisProcedureStep() {
  const formState = useChunkValue(deliveryFormState);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(
    null
  );

  // Procedure search states
  const [inputValue, setInputValue] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState<Set<string>>(
    new Set()
  );
  const [selectedProcedureObj, setSelectedProcedureObj] =
    useState<Procedure | null>(null);

  const { items, hasMore, isLoading, onLoadMore, handleSearch, hasSearched } =
    useProcedureSearch({
      fetchDelay: 300,
    });

  const [, scrollerRef] = useInfiniteScroll({
    hasMore,
    isEnabled: items.length > 0,
    shouldUseLoader: false,
    onLoadMore,
  });

  const handleAddDiagnosis = () => {
    if (selectedDiagnosis) {
      deliveryActions.addDiagnosis(selectedDiagnosis);
      setSelectedDiagnosis(null);
    }
  };

  const handleAddProcedure = () => {
    if (selectedProcedureObj) {
      deliveryActions.addProcedure(selectedProcedureObj);
      setSelectedProcedureObj(null);
      setSelectedProcedure(new Set());
    }
  };

  const handleQuantityChange = (
    procedureId: string,
    newQuantity: number,
    currentCost: string
  ) => {
    const numericCost = parseFloat(currentCost) || 0;
    const currentQuantity =
      formState.procedureLines.find((p) => p.ProcedureId === procedureId)
        ?.ProcedureQuantity || 1;

    const unitCost =
      currentQuantity > 0 ? numericCost / currentQuantity : numericCost;

    const newTotalCost = Math.round(unitCost * newQuantity).toString();

    deliveryActions.updateProcedureQuantity(procedureId, newQuantity);
    deliveryActions.updateProcedureCost(procedureId, newTotalCost);
  };

  const handleSearchClick = () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    handleSearch(inputValue);
    setSelectedProcedure(new Set());
    setSelectedProcedureObj(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  const handleSelectionChange = (selection: SharedSelection) => {
    setSelectedProcedure(selection as Set<string>);

    const selectedKey = Array.from(selection as Set<string>)[0];
    if (selectedKey) {
      const selected = items.find(
        (item) => `${item.ProcedureId}-${item.ProcedureName}` === selectedKey
      );
      setSelectedProcedureObj(selected || null);
    } else {
      setSelectedProcedureObj(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Diagnosis Section */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Diagnosis
          </h3>

          <div className="space-y-4">
            <div className="flex items-center flex-wrap gap-3">
              <div className="flex-1">
                <DiagnosisAutocomplete
                  onSelect={setSelectedDiagnosis}
                  isDisabled={formState.diagnosisLines.length >= 5}
                />
              </div>

              <div>
                <Button
                  color="primary"
                  onPress={handleAddDiagnosis}
                  isDisabled={
                    !selectedDiagnosis || formState.diagnosisLines.length >= 5
                  }
                >
                  Add Diagnosis
                </Button>
              </div>
            </div>

            {formState.diagnosisLines.length === 0 ? (
              <p className="text-gray-500 text-sm">No diagnoses added yet</p>
            ) : (
              <ul className="space-y-2 mt-4">
                {formState.diagnosisLines.map((diagnosis) => (
                  <li
                    key={diagnosis.DiagnosisId}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {diagnosis.DiagnosisName}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {diagnosis.DiagnosisId}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={() =>
                        deliveryActions.removeDiagnosis(diagnosis.DiagnosisId)
                      }
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Procedures Section */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Medication
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-20 gap-4">
              <div className="md:col-span-7 space-y-3">
                <Input
                  label="Search Procedures"
                  placeholder="Enter procedure name to search..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyUp={handleKeyPress}
                  isDisabled={formState.procedureLines.length >= 5}
                  startContent={
                    <SearchIcon className="w-4 h-4 text-gray-400" />
                  }
                />
                <Button
                  color="primary"
                  onPress={handleSearchClick}
                  isLoading={isLoading}
                  isDisabled={
                    formState.procedureLines.length >= 5 || !inputValue.trim()
                  }
                  className="w-full"
                >
                  Search
                </Button>
              </div>

              <div className="md:col-span-13 space-y-3">
                {hasSearched && items.length > 0 ? (
                  <Select
                    label="Select Procedure"
                    placeholder="Choose from search results..."
                    selectedKeys={selectedProcedure}
                    onSelectionChange={handleSelectionChange}
                    isDisabled={formState.procedureLines.length >= 5}
                    scrollRef={scrollerRef}
                  >
                    {items.map((item: Procedure) => (
                      <SelectItem
                        key={`${item.ProcedureId}-${item.ProcedureName}`}
                      >
                        {item.ProcedureName}
                      </SelectItem>
                    ))}
                  </Select>
                ) : (
                  <div className="h-14 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-gray-400 text-sm">
                      {hasSearched
                        ? "No results found"
                        : "Search to see options"}
                    </p>
                  </div>
                )}

                <Button
                  color="primary"
                  onPress={handleAddProcedure}
                  isDisabled={
                    !selectedProcedureObj ||
                    formState.procedureLines.length >= 5
                  }
                  className="w-full"
                >
                  Add Medication
                </Button>
              </div>
            </div>

            {isLoading && items.length > 0 && (
              <div className="text-center py-2 text-sm text-gray-500">
                Loading more results...
              </div>
            )}

            {hasSearched && items.length === 0 && !isLoading && (
              <div className="text-center py-4 text-gray-500">
                <p>No procedures found for "{inputValue}"</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            )}

            {!hasSearched && !isLoading && (
              <div className="text-center py-4 text-gray-500">
                <SearchIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  Enter a search term and click "Search" to find procedures
                </p>
              </div>
            )}

            {formState.procedureLines.length === 0 ? (
              <p className="text-gray-500 text-sm">No procedures added yet</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-3">
                {formState.procedureLines.map((procedure) => {
                  return (
                    <div
                      key={procedure.ProcedureId}
                      className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <p className="font-medium text-gray-900 truncate">
                            {procedure.ProcedureName}
                          </p>
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-500">
                              ID: {procedure.ProcedureId}
                            </p>
                            <p className="text-sm font-medium text-gray-700">
                              ₦
                              {Math.round(
                                parseFloat(procedure.cost || "0") *
                                  procedure.ProcedureQuantity
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 max-w-xs">
                          <Input
                            type="text"
                            size="sm"
                            label="Unit Cost"
                            value={procedure.cost || ""}
                            onChange={(e) =>
                              deliveryActions.updateProcedureCost(
                                procedure.ProcedureId,
                                e.target.value
                              )
                            }
                            placeholder="0"
                            className="w-24"
                          />
                          <Input
                            type="number"
                            min="1"
                            size="sm"
                            label="Quantity"
                            value={procedure.ProcedureQuantity.toString()}
                            onChange={(e) =>
                              handleQuantityChange(
                                procedure.ProcedureId,
                                parseInt(e.target.value) || 1,
                                procedure.cost || "0"
                              )
                            }
                            placeholder="1"
                            className="w-20"
                          />
                        </div>
                      </div>

                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        className="ml-4"
                        onPress={() =>
                          deliveryActions.removeProcedure(procedure.ProcedureId)
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
