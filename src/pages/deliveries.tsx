import { useEffect } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";

// import { useChunkValue } from "stunk/react";

import DeliveryTable from "@/components/delivery-table";
import EnrolleeSelectionStep from "@/components/deliveries/enrollee-step";
import DeliveryDetailsStep from "@/components/deliveries/details-setup";
import DiagnosisProcedureStep from "@/components/deliveries/procedure-setup";
import ProgressStep from "@/components/deliveries/progress-step";
import ProviderSetup from "@/components/deliveries/provider-setup";
import AdditionalInfoStep from "@/components/deliveries/additional-setup";
import DuplicateModal from "@/components/deliveries/duplicate-modal";

import { appChunk } from "@/lib/store/app-store";
import {
  deliveryActions,
  deliveryFormState,
  deliveryStore,
} from "@/lib/store/delivery-store";
import { fetchDeliveries } from "@/lib/services/delivery-service";

export default function DeliveriesPage() {
  const {
    deliveries,
    isLoading,
    error,
    showModal,
    isSubmitting,
    pendingSubmission,
  } = useChunkValue(deliveryStore);
  const formState = useChunkValue(deliveryFormState);
  // const { user } = useChunkValue(authStore);
  const { enrolleeId } = useChunkValue(appChunk);

  useEffect(() => {
    fetchDeliveries("", enrolleeId);
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

      <DuplicateModal />
    </section>
  );
}
