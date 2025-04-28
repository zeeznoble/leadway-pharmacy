import { deliveryFormState, deliveryActions } from "@/lib/store/delivery-store";
import { Provider } from "@/types";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useState } from "react";
import { useChunkValue } from "stunk/react";
import ProviderAutocomplete from "./provider-select";

export default function ProviderSetup() {
  const formState = useChunkValue(deliveryFormState);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    formState.pharmacyId && formState.pharmacyName
      ? {
          Pharmacyid: formState.pharmacyId,
          PharmacyName: formState.pharmacyName,
        }
      : null
  );

  const handleAddProvider = () => {
    if (selectedProvider) {
      // Update the form state with the selected provider
      deliveryActions.updateFormField(
        "pharmacyId",
        selectedProvider.Pharmacyid
      );
      deliveryActions.updateFormField(
        "pharmacyName",
        selectedProvider.PharmacyName
      );

      // Optionally clear the selectedProvider state if you want to select a new one
      // setSelectedProvider(null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Provider Selection
      </h3>

      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="flex items-center mb-4 gap-2">
            <h4
              className="text-base font-medium text-gray-700"
              style={{ flex: "0 0 25%" }}
            >
              Add Provider
            </h4>
            <div
              className="flex sm:items-center sm:flex-row flex-col gap-2"
              style={{ flex: "0 0 65%" }}
            >
              <div style={{ flex: "0 0 85%" }}>
                <ProviderAutocomplete
                  onSelect={setSelectedProvider}
                  enrolleeId={formState.enrolleeId}
                  isDisabled={!!formState.pharmacyId}
                />
              </div>
              <div style={{ flex: "0 0 15%" }}>
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleAddProvider}
                  isDisabled={!selectedProvider || !!formState.pharmacyId}
                  className="w-full sm:w-auto"
                >
                  Add Pharmacy
                </Button>
              </div>
            </div>
          </div>

          {formState.pharmacyId && formState.pharmacyName ? (
            <ul className="divide-y divide-gray-200">
              <li className="flex justify-between items-center py-3 px-2 hover:bg-gray-50 transition-colors">
                <span className="text-gray-700">{formState.pharmacyName}</span>
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => {
                    deliveryActions.updateFormField("pharmacyId", "");
                    deliveryActions.updateFormField("pharmacyName", "");
                    setSelectedProvider(null);
                  }}
                >
                  Remove
                </Button>
              </li>
            </ul>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              No provider selected
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
