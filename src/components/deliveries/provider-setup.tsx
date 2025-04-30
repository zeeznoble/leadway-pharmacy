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
      // Using the new dedicated action instead of separate field updates
      deliveryActions.setProvider(selectedProvider);
      setSelectedProvider(null);
    }
  };

  const handleRemoveProvider = () => {
    // Using the new dedicated action
    deliveryActions.removeProvider();
    setSelectedProvider(null);
  };

  return (
    <Card className="shadow-sm">
      <CardBody className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Provider Selection
        </h3>

        <div className="space-y-4">
          <div className="flex items-center flex-wrap gap-3">
            <div className="flex-1">
              <ProviderAutocomplete
                onSelect={setSelectedProvider}
                enrolleeId={formState.enrolleeId}
                isDisabled={!!formState.pharmacyId}
              />
            </div>

            <div>
              <Button
                color="primary"
                onPress={handleAddProvider}
                isDisabled={!selectedProvider}
              >
                Add Pharmacy
              </Button>
            </div>
          </div>

          {formState.pharmacyId ? (
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <div>
                <p className="font-medium text-gray-800">
                  {formState.pharmacyName}
                </p>
                <p className="text-sm text-gray-500">
                  ID: {formState.pharmacyId}
                </p>
              </div>
              <Button
                size="sm"
                color="danger"
                variant="light"
                onPress={handleRemoveProvider}
              >
                Remove
              </Button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No provider selected</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
