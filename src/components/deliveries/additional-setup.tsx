import { useChunkValue } from "stunk/react";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";
import { Input } from "@heroui/input";

export default function AdditionalInfoStep() {
  const formState = useChunkValue(deliveryFormState);

  // const calculateTotalCost = () => {
  //   if (!formState.procedureLines || formState.procedureLines.length === 0) {
  //     return "0";
  //   }

  //   return formState.procedureLines
  //     .map((proc) => {
  //       const costValue = proc.cost ? proc.cost : "0";
  //       return costValue;
  //     })
  //     .join(" + ");
  // };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Alternative Phone Number</h3>

      <Input
        label="Alternative Phone Number"
        placeholder="Enter Alt Phone Number"
        value={formState.additionalInformation}
        onChange={(e) =>
          deliveryActions.updateFormField(
            "additionalInformation",
            e.target.value
          )
        }
      />

      {/* Summary Section */}
      <div className="mt-6">
        <h4 className="font-medium mb-2">Delivery Summary</h4>

        <div className="bg-gray-50 p-4 rounded-md">
          <p>
            <strong>Enrollee:</strong> {formState.enrolleeName}
          </p>
          <p>
            <strong>Scheme:</strong> {formState.schemeName}
          </p>
          <p>
            <strong>Frequency:</strong> {formState.deliveryFrequency}
          </p>
          <p>
            <strong>Start Date:</strong> {formState.delStartDate}
          </p>

          <p>
            <strong>Diagnoses:</strong> {formState.diagnosisLines.length}
          </p>
          <p>
            <strong>Procedures:</strong> {formState.procedureLines.length}
          </p>
          {/* <p>
            <strong>Cost:</strong> {calculateTotalCost()}
          </p> */}
        </div>
      </div>
    </div>
  );
}
