import { useChunkValue } from "stunk/react";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";
import { Textarea } from "@heroui/input";

export default function AdditionalInfoStep() {
  const formState = useChunkValue(deliveryFormState);

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Additional Information</h3>

      <Textarea
        label="Additional Notes"
        placeholder="Enter any additional information about this delivery"
        rows={5}
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
            <strong>Duration:</strong> {formState.frequencyDuration} months
          </p>
          <p>
            <strong>Diagnoses:</strong> {formState.diagnosisLines.length}
          </p>
          <p>
            <strong>Procedures:</strong> {formState.procedureLines.length}
          </p>
        </div>
      </div>
    </div>
  );
}
