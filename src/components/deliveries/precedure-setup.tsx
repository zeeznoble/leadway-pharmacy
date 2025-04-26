import { useState } from "react";

import { useChunkValue } from "stunk/react";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Badge } from "@heroui/badge";

import DiagnosisAutocomplete from "./diagnosis-select";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";
import { Diagnosis } from "@/types";

export default function DiagnosisProcedureStep() {
  const formState = useChunkValue(deliveryFormState);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(
    null
  );

  const handleAddDiagnosis = () => {
    if (selectedDiagnosis) {
      deliveryActions.addDiagnosis(selectedDiagnosis);
      setSelectedDiagnosis(null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Diagnosis and Procedures
      </h3>

      {/* Diagnosis Section */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-medium text-gray-700">
                Add Diagnosis
              </h4>
              <Badge
                color={
                  formState.diagnosisLines.length >= 5 ? "danger" : "primary"
                }
                variant="flat"
                size="sm"
              >
                {formState.diagnosisLines.length}/5
              </Badge>
            </div>
            <div className="flex gap-2 sm:items-center sm:flex-row flex-col">
              <DiagnosisAutocomplete
                onSelect={setSelectedDiagnosis}
                isDisabled={formState.diagnosisLines.length >= 5}
              />
              <Button
                size="sm"
                color="primary"
                onPress={handleAddDiagnosis}
                isDisabled={
                  !selectedDiagnosis || formState.diagnosisLines.length >= 5
                }
                className="w-full sm:w-auto"
              >
                Add Diagnosis
              </Button>
            </div>
          </div>

          {formState.diagnosisLines.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No diagnoses added yet
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {formState.diagnosisLines.map((diagnosis) => (
                <li
                  key={diagnosis.DiagnosisId}
                  className="flex justify-between items-center py-3 px-2 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-700">
                    {diagnosis.DiagnosisName}
                  </span>
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
        </CardBody>
      </Card>

      {/* Procedures Section */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base font-medium text-gray-700">
              Add Procedures
            </h4>
            <Button
              size="sm"
              color="primary"
              onPress={() => {
                const dummyProcedure = {
                  ProcedureId: `proc-${Date.now()}`,
                  ProcedureName: "Sample Procedure",
                  ProcedureQuantity: 1,
                };
                deliveryActions.addProcedure(dummyProcedure);
              }}
            >
              Add Procedure
            </Button>
          </div>

          {formState.procedureLines.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No procedures added yet
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {formState.procedureLines.map((procedure) => (
                <li
                  key={procedure.ProcedureId}
                  className="flex justify-between items-center py-3 px-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <span className="text-gray-700">
                      {procedure.ProcedureName}
                    </span>
                    <div className="mt-2 w-24">
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
        </CardBody>
      </Card>
    </div>
  );
}
