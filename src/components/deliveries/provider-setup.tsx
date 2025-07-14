import { useState, useEffect } from "react";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useChunkValue } from "stunk/react";

import { deliveryFormState, deliveryActions } from "@/lib/store/delivery-store";

import ProviderAutocomplete from "./provider-select";

import { Provider } from "@/types";

export default function ProviderSetup() {
  const formState = useChunkValue(deliveryFormState);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  );

  useEffect(() => {
    if (formState.pharmacyId && formState.pharmacyName) {
      setSelectedProvider({
        Pharmacyid: formState.pharmacyId,
        PharmacyName: formState.pharmacyName,
      });
    } else {
      setSelectedProvider(null);
    }
  }, [formState.pharmacyId, formState.pharmacyName]);

  const handleAddProvider = () => {
    if (selectedProvider) {
      deliveryActions.setProvider(selectedProvider);
      // Keep the selected provider in the autocomplete for editing
      // setSelectedProvider(null);
    }
  };

  const handleRemoveProvider = () => {
    deliveryActions.removeProvider();
    setSelectedProvider(null);
  };

  return (
    <Card className="shadow-sm">
      <CardBody className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pharmacy</h3>

        <div className="space-y-4">
          <div className="flex items-center flex-wrap gap-3">
            <div className="flex-1">
              <ProviderAutocomplete
                onSelect={(provider) => {
                  setSelectedProvider(provider);
                }}
                enrolleeId={formState.enrolleeId}
                isDisabled={!!formState.pharmacyId}
                selectedProvider={
                  formState.pharmacyId && formState.pharmacyName
                    ? {
                        Pharmacyid: formState.pharmacyId,
                        PharmacyName: formState.pharmacyName,
                      }
                    : null
                }
              />
            </div>

            <div>
              <Button
                color="primary"
                onPress={handleAddProvider}
                isDisabled={!selectedProvider || !!formState.pharmacyId}
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
