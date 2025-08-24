import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";

import { useChunkValue } from "stunk/react";
import toast from "react-hot-toast";

import DeliveryTable from "@/components/delivery-table";
import EnrolleeSelectionStep from "@/components/deliveries/enrollee-step";
import DeliveryDetailsStep from "@/components/deliveries/details-setup";
import DiagnosisProcedureStep from "@/components/deliveries/procedure-setup";
import ProgressStep from "@/components/deliveries/progress-step";
import ProviderSetup from "@/components/deliveries/provider-setup";
import AdditionalInfoStep from "@/components/deliveries/additional-setup";
import DuplicateModal from "@/components/deliveries/duplicate-modal";

import { appChunk, authStore } from "@/lib/store/app-store";
import {
  deliveryActions,
  deliveryFormState,
  deliveryStore,
} from "@/lib/store/delivery-store";
import { fetchDeliveries } from "@/lib/services/delivery-service";
import { formatDateForAPI } from "@/lib/helpers";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { DatePicker } from "@heroui/date-picker";

export default function ProviderPendingsPage() {
  const {
    deliveries,
    isLoading,
    error,
    showModal,
    isSubmitting,
    pendingSubmission,
  } = useChunkValue(deliveryStore);
  const formState = useChunkValue(deliveryFormState);
  const { user } = useChunkValue(authStore);
  const { enrolleeId } = useChunkValue(appChunk);

  // Date picker states
  const [fromDate, setFromDate] = useState<CalendarDate | null>(null);
  const [toDate, setToDate] = useState<CalendarDate | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Store the last searched term for refresh purposes
  const [lastSearchedEnrolleeId, setLastSearchedEnrolleeId] = useState("");
  const [lastSearchType, setLastSearchType] = useState<
    "enrollee" | "pharmacy" | "address"
  >("enrollee");

  const loadDeliveries = (
    searchEnrolleeId: string = "",
    searchType: "enrollee" | "pharmacy" | "address" = "enrollee"
  ) => {
    if (!user?.UserName) return;

    const fromDateStr = formatDateForAPI(fromDate);
    const toDateStr = formatDateForAPI(toDate);

    // For now, the API only supports enrollee search, so we only use searchEnrolleeId for enrollee searches
    const enrolleeIdToUse =
      searchType === "enrollee" ? searchEnrolleeId || enrolleeId : enrolleeId;

    fetchDeliveries(
      "",
      enrolleeIdToUse,
      "9", // Status for provider pendings
      fromDateStr,
      toDateStr
    );
  };

  // Initial load effect
  useEffect(() => {
    if (user?.UserName && !hasInitialLoad) {
      loadDeliveries();
      setHasInitialLoad(true);
    }
  }, [user?.UserName, hasInitialLoad]);

  // Effect for date changes (only after initial load)
  useEffect(() => {
    if (user?.UserName && hasInitialLoad) {
      loadDeliveries(lastSearchedEnrolleeId, lastSearchType);
    }
  }, [fromDate, toDate]);

  const handleSearch = async (
    searchTerm: string,
    searchType: "enrollee" | "pharmacy" | "address" = "enrollee"
  ) => {
    if (!user?.UserName) {
      toast.error("User information not available");
      return;
    }

    try {
      // Store the search term and type for later use
      setLastSearchedEnrolleeId(searchTerm);
      setLastSearchType(searchType);

      // Use the date filters when searching
      const fromDateStr = formatDateForAPI(fromDate);
      const toDateStr = formatDateForAPI(toDate);

      if (searchTerm && searchType === "enrollee") {
        // Only for enrollee search, use the API parameter
        await fetchDeliveries("", searchTerm, "9", fromDateStr, toDateStr);
      } else {
        // For pharmacy, address, or empty search, load all records
        // The filtering will be handled by DeliveryTable locally
        await fetchDeliveries("", enrolleeId, "9", fromDateStr, toDateStr);
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

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

  const handleClearDates = () => {
    setFromDate(null);
    setToDate(null);
  };

  return (
    <section className="px-2">
      <div className="flex justify-between mb-4">
        <p className="text-xl">List of Provider Pendings</p>
      </div>

      {/* Date Filter Section */}
      <div className="mb-4 py-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <DatePicker
              label="From Date"
              showMonthAndYearPickers
              value={fromDate}
              onChange={setFromDate}
              maxValue={toDate || today(getLocalTimeZone())}
              className="w-full sm:max-w-md"
              size="sm"
              radius="sm"
            />
            <DatePicker
              label="To Date"
              showMonthAndYearPickers
              value={toDate}
              onChange={setToDate}
              minValue={fromDate || undefined}
              className="w-full sm:max-w-md"
              size="sm"
              radius="sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onPress={handleClearDates}
              color="default"
              radius="sm"
              size="sm"
              disabled={!fromDate && !toDate}
            >
              Clear Dates
            </Button>
          </div>
        </div>
        {(fromDate || toDate) && (
          <div className="mt-2 text-sm text-gray-600">
            Filtering deliveries
            {fromDate && ` from ${formatDateForAPI(fromDate)}`}
            {toDate && ` to ${formatDateForAPI(toDate)}`}
          </div>
        )}
      </div>

      {error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <DeliveryTable
          deliveries={deliveries}
          isLoading={isLoading}
          onSearch={handleSearch}
          currentSearchTerm={lastSearchedEnrolleeId}
          currentSearchType={lastSearchType}
        />
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
