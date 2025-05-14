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
                {formState.procedureLines.map((procedure) => (
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
                      <div className="mt-2 w-24 space-y-3">
                        <Input
                          type="number"
                          min="1"
                          size="sm"
                          value={procedure.ProcedureQuantity.toString()}
                          onChange={(e) =>
                            deliveryActions.updateProcedureQuantity(
                              procedure.ProcedureId,
                              parseInt(e.target.value) || 1
                            )
                          }
                          placeholder="Quantity"
                        />
                        <Input
                          type="text"
                          size="sm"
                          value={formState.cost || ""}
                          onChange={(e) =>
                            deliveryActions.updateFormField(
                              procedure.cost,
                              e.target.value
                            )
                          }
                          placeholder="Cost"
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
                ))}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
