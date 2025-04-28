import { useState } from "react";

import { useChunkValue } from "stunk/react";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";

import DiagnosisAutocomplete from "./diagnosis-select";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";
import { Diagnosis, Procedure } from "@/types";
import ProcedureAutocomplete from "./procedure-select";

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
      <h3 className="text-lg font-semibold text-gray-800">
        Diagnosis and Procedures
      </h3>

      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="flex items-center mb-4 gap-2">
            <h4
              className="text-base font-medium text-gray-700"
              style={{ flex: "0 0 25%" }}
            >
              Add Diagnosis
            </h4>
            <div
              className="flex sm:items-center sm:flex-row flex-col gap-2"
              style={{ flex: "0 0 65%" }}
            >
              <div style={{ flex: "0 0 85%" }}>
                <DiagnosisAutocomplete
                  onSelect={setSelectedDiagnosis}
                  isDisabled={formState.diagnosisLines.length >= 5}
                />
              </div>
              <div style={{ flex: "0 0 15%" }}>
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
          <div className="flex items-center mb-4 gap-2">
            <div
              className="flex items-center gap-2"
              style={{ flex: "0 0 25%" }}
            >
              <h4 className="text-base font-medium text-gray-700">
                Add Procedures
              </h4>
            </div>
            <div
              className="flex sm:items-center sm:flex-row flex-col gap-2"
              style={{ flex: "0 0 65%" }}
            >
              <div style={{ flex: "0 0 85%" }}>
                <ProcedureAutocomplete
                  onSelect={setSelectedProcedure}
                  isDisabled={formState.procedureLines.length >= 5}
                />
              </div>
              <div style={{ flex: "0 0 15%" }}>
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleAddProcedure}
                  isDisabled={
                    !selectedProcedure || formState.procedureLines.length >= 5
                  }
                  className="w-full sm:w-auto truncate"
                  style={{ minWidth: "80px" }}
                >
                  Add Procedure
                </Button>
              </div>
            </div>
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
