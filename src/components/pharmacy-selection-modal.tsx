import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody } from "@heroui/card";
import { SharedSelection } from "@heroui/system";
import ProviderAutocomplete from "./deliveries/provider-select";
import { useChunkValue } from "stunk/react";
import { deliveryStore } from "@/lib/store/delivery-store";

// Use the same Provider type as in your main app
interface Provider {
  Pharmacyid: number; // Changed from string to number to match your main type
  PharmacyName: string;
}

interface PharmacySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pharmacyData: {
    pharmacyid: number; // Changed from string to number
    pharmacyname: string;
  }) => void;
  selectedCount: number;
}

export default function PharmacySelectionModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
}: PharmacySelectionModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  );
  const [pharmacyType, setPharmacyType] = useState<Set<string>>(new Set([]));
  const formState = useChunkValue(deliveryStore);

  const pharmacyTypeOptions = [
    { key: "Internal", label: "Internal Pharmacy" },
    { key: "External", label: "External Pharmacy" },
  ];

  // Fix the handler to accept SharedSelection and convert it properly
  const handlePharmacyTypeChange = (selection: SharedSelection) => {
    const newPharmacyType = selection as Set<string>;
    setPharmacyType(newPharmacyType);

    // Reset provider when changing pharmacy type
    setSelectedProvider(null);
  };

  const handleProviderSelect = (provider: Provider | null) => {
    setSelectedProvider(provider);
  };

  const handleRemoveProvider = () => {
    setSelectedProvider(null);
  };

  const handleConfirm = () => {
    if (selectedProvider) {
      onConfirm({
        pharmacyid: selectedProvider.Pharmacyid, // Now matches the number type
        pharmacyname: selectedProvider.PharmacyName,
      });
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setSelectedProvider(null);
    setPharmacyType(new Set([]));
    onClose();
  };

  const selectedPharmacyType = Array.from(pharmacyType)[0];
  const isConfirmDisabled = !selectedProvider;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleClose}
      size="2xl"
      isDismissable={false}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Select Pharmacy for {selectedCount} Deliveries
        </ModalHeader>
        <ModalBody>
          <Card className="shadow-sm">
            <CardBody className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Pharmacy Selection
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Pharmacy Type"
                    selectedKeys={pharmacyType}
                    onSelectionChange={handlePharmacyTypeChange}
                    isRequired
                  >
                    {pharmacyTypeOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                {selectedPharmacyType && (
                  <>
                    {!selectedProvider ? (
                      <div>
                        <ProviderAutocomplete
                          onSelect={handleProviderSelect}
                          enrolleeId={String(formState.selectedEnrolleeId)}
                          isDisabled={false}
                          selectedProvider={null}
                          pharmacyType={selectedPharmacyType}
                        />
                        <p className="text-gray-500 text-sm mt-2">
                          Select a pharmacy from the list above
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium text-gray-800">
                            {selectedProvider.PharmacyName}
                          </p>
                          <p className="text-sm text-gray-500">
                            ID: {selectedProvider.Pharmacyid}
                          </p>
                          <p className="text-xs text-blue-600">
                            {selectedPharmacyType} Pharmacy
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
                    )}
                  </>
                )}

                {!selectedPharmacyType && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Please select a pharmacy type to continue
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleConfirm}
            isDisabled={isConfirmDisabled}
          >
            Continue to Pack Date
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
