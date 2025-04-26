import { useEffect } from "react";
import { useChunkValue } from "stunk/react";

import { appChunk, authStore } from "@/lib/store/app-store";
import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";

export default function EnrolleeSelectionStep() {
  const formState = useChunkValue(deliveryFormState);
  const { user } = useChunkValue(authStore);
  const { enrolleeId, enrolleeData } = useChunkValue(appChunk);

  console.log(enrolleeId);

  useEffect(() => {
    if (user) {
      deliveryActions.updateFormField("enrolleeId", enrolleeId);
      deliveryActions.updateFormField(
        "enrolleeName",
        `${enrolleeData?.Member_MemberTitle} ${enrolleeData?.Member_FirstName} ${enrolleeData?.Member_Surname}`
      );
      deliveryActions.updateFormField("enrolleeAge", enrolleeData?.Member_Age);
      deliveryActions.updateFormField("schemeId", user.insco_id.toString());
      deliveryActions.updateFormField(
        "schemeName",
        enrolleeData?.client_schemename
      );
    }
  }, [user]);

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Enrollee Information</h3>

      <div className="mt-4 p-5 bg-gray-50 rounded-md">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Enrollee ID</p>
            <p className="font-medium">{formState.enrolleeId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{formState.enrolleeName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Age</p>
            <p className="font-medium">{formState.enrolleeAge}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Scheme</p>
            <p className="font-medium">{formState.schemeName}</p>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>This delivery will be created for the displayed enrollee</p>
        </div>
      </div>
    </div>
  );
}
