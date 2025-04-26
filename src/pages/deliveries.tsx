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
import DiagnosisProcedureStep from "@/components/deliveries/precedure-setup";

import {
  deliveryActions,
  deliveryFormState,
  deliveryStore,
} from "@/lib/store/delivery-store";
import { fetchDeliveries } from "@/lib/services/delivery-service";
import AdditionalInfoStep from "@/components/deliveries/additional-setup";
import { appChunk, authStore } from "@/lib/store/app-store";
import ProgressStep from "@/components/deliveries/progress-step";

export default function DeliveriesPage() {
  const { deliveries, isLoading, error, showModal, isSubmitting } =
    useChunkValue(deliveryStore);
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
    }
  };

  const renderFormStep = () => {
    switch (formState.currentStep) {
      case 1:
        return <EnrolleeSelectionStep />;
      case 2:
        return <DeliveryDetailsStep />;
      case 3:
        return <DiagnosisProcedureStep />;
      case 4:
        return <AdditionalInfoStep />;
      default:
        return null;
    }
  };

  return (
    <section className="py-3 px-2">
      <div className="flex justify-between mb-4">
        <p className="text-xl">List of Deliveries</p>
        <Button
          size="lg"
          radius="sm"
          color="primary"
          onPress={deliveryActions.openModal}
        >
          Create Delivery
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading deliveries...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <DeliveryTable deliveries={deliveries} />
      )}

      {/* Multi-step Modal */}
      <Modal
        backdrop="blur"
        isOpen={showModal}
        isDismissable={false}
        onOpenChange={handleOpenChange}
        shouldCloseOnInteractOutside={(element) => {
          return !element.className.includes("heroui-select");
        }}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Create Delivery - Step {formState.currentStep} of{" "}
            {formState.totalSteps}
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
                  isLoading={isSubmitting}
                  isDisabled={isSubmitting}
                  onPress={
                    formState.currentStep < formState.totalSteps
                      ? deliveryActions.nextStep
                      : deliveryActions.submitForm
                  }
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
    </section>
  );
}
