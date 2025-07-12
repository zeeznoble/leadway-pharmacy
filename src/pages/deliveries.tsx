import { useEffect } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";

import { useChunkValue } from "stunk/react";

import DeliveryTable from "@/components/delivery-table";
import EnrolleeSelectionStep from "@/components/deliveries/enrollee-step";
import DeliveryDetailsStep from "@/components/deliveries/details-setup";
import DiagnosisProcedureStep from "@/components/deliveries/procedure-setup";
import ProgressStep from "@/components/deliveries/progress-step";
import ProviderSetup from "@/components/deliveries/provider-setup";
import AdditionalInfoStep from "@/components/deliveries/additional-setup";

import {
  deliveryActions,
  deliveryFormState,
  deliveryStore,
} from "@/lib/store/delivery-store";
import { fetchDeliveries } from "@/lib/services/delivery-service";
import { appChunk, authStore } from "@/lib/store/app-store";

export default function DeliveriesPage() {
  const {
    deliveries,
    isLoading,
    error,
    showModal,
    showDuplicateModal,
    isSubmitting,
    duplicateDeliveries,
    pendingSubmission,
  } = useChunkValue(deliveryStore);
  const formState = useChunkValue(deliveryFormState);
  const { user } = useChunkValue(authStore);
  const { enrolleeId } = useChunkValue(appChunk);

  useEffect(() => {
    fetchDeliveries(user?.UserName!, enrolleeId);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      deliveryActions.openModal();
    } else {
      deliveryActions.closeModal();
      // Only reset form if not editing
      if (!formState.isEditing) {
        deliveryFormState.reset();
      }
    }
  };

  const handleSubmit = () => {
    if (formState.currentStep < formState.totalSteps) {
      deliveryActions.nextStep();
    } else {
      deliveryActions.submitForm(false);
    }
  };

  const renderFormStep = () => {
    switch (formState.currentStep) {
      case 1:
        return <EnrolleeSelectionStep />;
      case 2:
        return <DeliveryDetailsStep />;
      case 3:
        return <ProviderSetup />;
      case 4:
        return <DiagnosisProcedureStep />;
      case 5:
        return <AdditionalInfoStep />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderDuplicateModal = () => (
    <Modal
      backdrop="blur"
      isOpen={showDuplicateModal}
      isDismissable={false}
      size="2xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-orange-600">
            ⚠️ Duplicate Delivery Warning
          </h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-gray-700">
              We found existing deliveries with similar medications that haven't
              reached their end date yet. Creating a duplicate delivery might
              result in over-medication.
            </p>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">
                Existing Deliveries:
              </h4>
              <div className="space-y-2">
                {duplicateDeliveries.map((delivery, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded border border-orange-200"
                  >
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Delivery ID:</strong> {delivery.DeliveryId}
                      </p>
                      <p>
                        <strong>Enrollee:</strong> {delivery.EnrolleeName}
                      </p>
                      <p>
                        <strong>Frequency:</strong> {delivery.DeliveryFrequency}
                      </p>
                      <p>
                        <strong>End Date:</strong>{" "}
                        {formatDate(delivery.EndDate)}
                      </p>
                      <div className="mt-2">
                        <p>
                          <strong>Medications:</strong>
                        </p>
                        <ul className="list-disc list-inside ml-2 text-xs">
                          {delivery.ProcedureLines?.map((procedure, idx) => (
                            <li key={idx}>
                              {procedure.ProcedureName} (Qty:{" "}
                              {procedure.ProcedureQuantity})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-800 text-sm">
                <strong>⚠️ Warning:</strong> Creating duplicate deliveries may
                lead to:
              </p>
              <ul className="list-disc list-inside text-red-700 text-sm mt-2 ml-4">
                <li>Over-medication of the patient</li>
                <li>Increased costs</li>
                <li>Potential health risks</li>
                <li>Inventory management issues</li>
              </ul>
            </div>

            <p className="text-gray-700 font-medium">
              Do you still want to proceed with creating this delivery?
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-between w-full">
            <Button
              color="default"
              variant="light"
              onPress={() => deliveryActions.handleDuplicateConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              color="warning"
              className="text-white"
              onPress={() => deliveryActions.handleDuplicateConfirmation(true)}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              Yes, Create Duplicate
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  return (
    <section className="py-3 px-2">
      <div className="flex justify-between mb-4">
        <p className="text-xl">List of Deliveries</p>
        {enrolleeId !== "" ? (
          <Button
            size="lg"
            radius="sm"
            color="primary"
            onPress={deliveryActions.openModal}
          >
            Create Delivery
          </Button>
        ) : (
          <p className="text-medium">Select an Enrollee to Create Delivery</p>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading deliveries...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <DeliveryTable deliveries={deliveries} />
      )}

      {/* Main Form Modal */}
      <Modal
        backdrop="blur"
        isOpen={showModal}
        isDismissable={false}
        onOpenChange={handleOpenChange}
        shouldCloseOnInteractOutside={(element) => {
          return !element.className.includes("heroui-select");
        }}
        size="3xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {formState.isEditing ? "Edit Delivery" : "Create Delivery"} - Step{" "}
            {formState.currentStep} of {formState.totalSteps}
          </ModalHeader>
          <ModalBody>
            <ProgressStep />
            {renderFormStep()}
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-between w-full">
              {formState.currentStep > 1 && (
                <Button
                  color="default"
                  radius="sm"
                  onPress={deliveryActions.prevStep}
                >
                  Previous
                </Button>
              )}
              <div className="ml-auto">
                <Button
                  color="primary"
                  radius="sm"
                  isLoading={isSubmitting && !pendingSubmission}
                  isDisabled={isSubmitting}
                  onPress={handleSubmit}
                >
                  {formState.currentStep < formState.totalSteps
                    ? "Next"
                    : "Submit"}
                </Button>
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Duplicate Confirmation Modal */}
      {renderDuplicateModal()}
    </section>
  );
}
