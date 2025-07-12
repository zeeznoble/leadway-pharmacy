import { useState } from "react";

import { useChunkValue } from "stunk/react";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";

import DiagnosisAutocomplete from "./diagnosis-select";
import ProcedureAutocomplete from "./procedure-select";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";
import { Diagnosis, Procedure } from "@/types";

export default function DiagnosisProcedureStep() {
  const formState = useChunkValue(deliveryFormState);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(
    null
  );
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(
    null
  );

  const handleAddDiagnosis = () => {
    if (selectedDiagnosis) {
      deliveryActions.addDiagnosis(selectedDiagnosis);
      setSelectedDiagnosis(null);
    }
  };

  const handleAddProcedure = () => {
    if (selectedProcedure) {
      deliveryActions.addProcedure(selectedProcedure);
      setSelectedProcedure(null);
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

    // Calculate unit cost from current total cost
    const unitCost =
      currentQuantity > 0 ? numericCost / currentQuantity : numericCost;

    // Calculate new total cost
    const newTotalCost = Math.round(unitCost * newQuantity).toString();

    // Update both quantity and cost
    deliveryActions.updateProcedureQuantity(procedureId, newQuantity);
    deliveryActions.updateProcedureCost(procedureId, newTotalCost);
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
            <div className="flex items-center flex-wrap gap-3">
              <div className="flex-1">
                <ProcedureAutocomplete
                  onSelect={setSelectedProcedure}
                  isDisabled={formState.procedureLines.length >= 5}
                />
              </div>

              <div>
                <Button
                  color="primary"
                  onPress={handleAddProcedure}
                  isDisabled={!selectedProcedure}
                >
                  Add Medication
                </Button>
              </div>
            </div>

            {formState.procedureLines.length === 0 ? (
              <p className="text-gray-500 text-sm">No procedures added yet</p>
            ) : (
              <ul className="space-y-2 mt-4">
                {formState.procedureLines.map((procedure) => {
                  return (
                    <li
                      key={procedure.ProcedureId}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {procedure.ProcedureName}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {procedure.ProcedureId}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Total: ₦
                          {Math.round(
                            parseFloat(procedure.cost || "0") *
                              procedure.ProcedureQuantity
                          )}
                        </p>
                        <div className="mt-2 w-24 space-y-3">
                          <Input
                            type="text"
                            size="sm"
                            value={procedure.cost || ""}
                            onChange={(e) =>
                              deliveryActions.updateProcedureCost(
                                procedure.ProcedureId,
                                e.target.value
                              )
                            }
                            placeholder="Unit Cost"
                          />
                          <Input
                            type="number"
                            min="1"
                            size="sm"
                            value={procedure.ProcedureQuantity.toString()}
                            onChange={(e) =>
                              handleQuantityChange(
                                procedure.ProcedureId,
                                parseInt(e.target.value) || 1,
                                procedure.cost || "0"
                              )
                            }
                            placeholder="Quantity"
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() =>
                          deliveryActions.removeProcedure(procedure.ProcedureId)
                        }
                      >
                        Remove
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
