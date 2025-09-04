import { useEffect, useRef, useCallback } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Spinner } from "@heroui/spinner";

import { useChunkValue } from "stunk/react";

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
  const { searchCriteria } = useChunkValue(appChunk);

  const lastSearchRef = useRef<string>("");
  const isFetchingRef = useRef<boolean>(false);

  const fetchDeliveriesWithDebounce = useCallback(
    async (
      searchTermOrEnrolleeId: string = "",
      searchTypeOrEnrolleeId: string = ""
    ) => {
      // Detect if this is the old calling pattern (searchTerm, enrolleeId)
      // or new pattern (searchTerm, searchType)
      const isNewPattern = ["enrollee", "pharmacy", "address"].includes(
        searchTypeOrEnrolleeId
      );

      let searchTerm = "";
      let enrolleeId = "";
      let searchType = "enrollee";

      if (isNewPattern) {
        // New pattern: (searchTerm, searchType)
        searchTerm = searchTermOrEnrolleeId;
        searchType = searchTypeOrEnrolleeId;
      } else {
        // Old pattern: (searchTerm, enrolleeId)
        searchTerm = searchTermOrEnrolleeId;
        enrolleeId = searchTypeOrEnrolleeId;
      }

      const searchKey = isNewPattern
        ? `${searchTerm}-${searchType}`
        : `${searchTerm}-${enrolleeId}`;

      if (lastSearchRef.current === searchKey || isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      lastSearchRef.current = searchKey;

      console.log("Fetching deliveries with:", {
        searchTerm,
        enrolleeId,
        searchType,
        searchKey,
        isNewPattern,
      });

      try {
        if (isNewPattern && searchType === "enrollee") {
          // New enrollee search - pass searchTerm for API to handle ID or name
          await fetchDeliveries(searchTerm, "");
        } else {
          // Old pattern or non-enrollee search - use original logic
          const effectiveEnrolleeId =
            enrolleeId || searchCriteria.enrolleeId || "";
          const effectiveSearchTerm =
            effectiveEnrolleeId && effectiveEnrolleeId.trim() !== ""
              ? ""
              : searchTerm;
          const finalEnrolleeId =
            effectiveEnrolleeId && effectiveEnrolleeId.trim() !== ""
              ? effectiveEnrolleeId
              : "";

          await fetchDeliveries(effectiveSearchTerm, finalEnrolleeId);
        }
      } catch (error) {
        console.error("Error fetching deliveries:", error);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [searchCriteria.enrolleeId]
  );

  useEffect(() => {
    const enrolleeId = searchCriteria.enrolleeId || "";
    // Only fetch if we have a meaningful change
    fetchDeliveriesWithDebounce("", enrolleeId);

    // 👇 THIS IS WHERE IT GETS CALLED AUTOMATICALLY
    return () => {
      deliveryActions.clearDeliveries();
      lastSearchRef.current = "";
      isFetchingRef.current = false;
    };
  }, [searchCriteria.enrolleeId, fetchDeliveriesWithDebounce]);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      deliveryActions.openModal();
    } else {
      deliveryActions.closeModal();
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
    <section className="px-2">
      <div className="flex justify-end mb-4">
        {searchCriteria.enrolleeId !== "" ||
        searchCriteria.firstName !== "" ||
        searchCriteria.lastName !== "" ||
        searchCriteria.mobileNo !== "" ||
        searchCriteria.email !== "" ? (
          <Button
            color="primary"
            radius="md"
            onPress={deliveryActions.openModal}
          >
            Create Delivery
          </Button>
        ) : (
          <p className="text-medium">Select an Enrollee to Create Delivery</p>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-10 flex-col">
          <Spinner color="warning" />
          <p>Loading deliveries...</p>
        </div>
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
        scrollBehavior="outside"
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
