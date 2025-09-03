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

import EnrolleeSelectionStep from "@/components/deliveries/enrollee-step";
import DeliveryDetailsStep from "@/components/deliveries/details-setup";
import DiagnosisProcedureStep from "@/components/deliveries/procedure-setup";
import ProgressStep from "@/components/deliveries/progress-step";
import ProviderSetup from "@/components/deliveries/provider-setup";
import AdditionalInfoStep from "@/components/deliveries/additional-setup";
import DuplicateModal from "@/components/deliveries/duplicate-modal";

import { authStore } from "@/lib/store/app-store";
import {
  deliveryActions,
  deliveryFormState,
  deliveryStore,
} from "@/lib/store/delivery-store";
import { fetchDeliveries } from "@/lib/services/delivery-service";
import { formatDateForAPI, formatDateForDisplay } from "@/lib/helpers";
import { CalendarDate } from "@internationalized/date";
import { DatePicker } from "@heroui/date-picker";
import { fetchPendingApprovalList } from "@/lib/services/approval-service";
import { ArrowLeft } from "@/components/icons/icons";
import ProviderPendingsDeliveryTable from "@/components/provider-pending-table";
import DistinctDeliveryTable from "@/components/distinct-delivery";
import ViewAllMedicationsModal from "@/components/view-medication-modal";

export default function ProviderPendingsPage() {
  const {
    deliveries,
    pendingApprovalList,
    isLoading,
    error,
    showModal,
    isSubmitting,
    pendingSubmission,
    selectedEnrolleeId,
    showDetailView,
  } = useChunkValue(deliveryStore);
  const formState = useChunkValue(deliveryFormState);
  const { user } = useChunkValue(authStore);

  const [fromDate, setFromDate] = useState<CalendarDate | null>(null);
  const [toDate, setToDate] = useState<CalendarDate | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const [showMedicationsModal, setShowMedicationsModal] = useState(false);

  const [lastSearchedTerm, setLastSearchedTerm] = useState("");
  const [lastSearchType, setLastSearchType] = useState<
    "enrollee" | "pharmacy" | "address"
  >("enrollee");

  // Load pending approval list (first level)
  const loadPendingApprovalList = () => {
    if (!user?.UserName) return;

    const fromDateStr = formatDateForAPI(fromDate);
    const toDateStr = formatDateForAPI(toDate);

    fetchPendingApprovalList(user.UserName, fromDateStr, toDateStr);
  };

  // Load detailed deliveries for selected enrollee (second level)
  const loadDeliveriesForEnrollee = (enrolleeId: string) => {
    if (!user?.UserName) return;

    const fromDateStr = formatDateForAPI(fromDate);
    const toDateStr = formatDateForAPI(toDate);

    fetchDeliveries(user.UserName, enrolleeId, "9", fromDateStr, toDateStr);
  };

  // Initial load
  useEffect(() => {
    if (user?.UserName && !hasInitialLoad) {
      loadPendingApprovalList();
      setHasInitialLoad(true);
    }
  }, [user?.UserName, hasInitialLoad]);

  // Reload when date filters change
  useEffect(() => {
    if (user?.UserName && hasInitialLoad) {
      if (showDetailView && selectedEnrolleeId) {
        // If we're in detail view, reload the detailed deliveries
        loadDeliveriesForEnrollee(selectedEnrolleeId);
      } else {
        // If we're in list view, reload the pending approval list
        loadPendingApprovalList();
      }
    }
  }, [fromDate, toDate]);

  // 👇 NEW: Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      deliveryActions.clearDeliveries();
      deliveryActions.backToListView();
      setFromDate(null);
      setToDate(null);
      setHasInitialLoad(false);
      setLastSearchedTerm("");
      setLastSearchType("enrollee");
    };
  }, []);

  const handleViewAllMedications = () => {
    setShowMedicationsModal(true);
  };

  const handleCloseMedicationsModal = () => {
    setShowMedicationsModal(false);
  };

  const handleDistinctSearch = async (
    searchTerm: string,
    searchType: "enrollee" | "pharmacy" | "address" = "enrollee"
  ) => {
    if (!user?.UserName) {
      toast.error("User information not available");
      return;
    }

    try {
      setLastSearchedTerm(searchTerm);
      setLastSearchType(searchType);

      // For the distinct table, we'll reload the pending approval list
      // and let the component handle local filtering
      loadPendingApprovalList();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  const handleDetailSearch = async (
    searchTerm: string,
    searchType: "enrollee" | "pharmacy" | "address" = "enrollee"
  ) => {
    if (!user?.UserName || !selectedEnrolleeId) {
      toast.error("User information not available");
      return;
    }

    try {
      setLastSearchedTerm(searchTerm);
      setLastSearchType(searchType);

      // For detail view, reload deliveries for the selected enrollee
      loadDeliveriesForEnrollee(selectedEnrolleeId);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  const handleRowClick = (enrolleeId: string) => {
    deliveryActions.selectEnrolleeForDetails(enrolleeId);
    loadDeliveriesForEnrollee(enrolleeId);
  };

  const handleBackToList = () => {
    deliveryActions.backToListView();
    setLastSearchedTerm("");
    setLastSearchType("enrollee");
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
        <div className="flex items-center gap-4">
          {showDetailView && (
            <Button
              isIconOnly
              onPress={handleBackToList}
              color="default"
              radius="sm"
              size="sm"
            >
              <ArrowLeft size={16} />
            </Button>
          )}
          <p className="text-xl">
            {showDetailView
              ? `Deliveries for Enrollee: ${selectedEnrolleeId}`
              : "List of Provider Pendings"}
          </p>
        </div>
      </div>

      {/* Date Filter Section - Only show in detail view */}
      {showDetailView && (
        <div className="mb-4 py-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              <DatePicker
                label="From Date"
                showMonthAndYearPickers
                value={fromDate}
                onChange={setFromDate}
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
              {fromDate && ` from ${formatDateForDisplay(fromDate)}`}
              {toDate && ` to ${formatDateForDisplay(toDate)}`}
            </div>
          )}
        </div>
      )}

      {error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : (
        <>
          {showDetailView ? (
            // Show detailed delivery table for selected enrollee with pack functionality
            <ProviderPendingsDeliveryTable
              deliveries={deliveries}
              isLoading={isLoading}
              onSearch={handleDetailSearch}
              currentSearchTerm={lastSearchedTerm}
              currentSearchType={lastSearchType}
              user={user}
              onViewAllMedications={handleViewAllMedications}
              selectedEnrolleeId={String(selectedEnrolleeId)}
            />
          ) : (
            // Show distinct delivery table (pending approval list)
            <DistinctDeliveryTable
              pendingApprovalList={pendingApprovalList}
              isLoading={isLoading}
              onRowClick={handleRowClick}
              onSearch={handleDistinctSearch}
            />
          )}
        </>
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

      {showDetailView && selectedEnrolleeId && (
        <ViewAllMedicationsModal
          isOpen={showMedicationsModal}
          onClose={handleCloseMedicationsModal}
          enrolleeId={selectedEnrolleeId}
          enrolleeName={`Enrollee ${selectedEnrolleeId}`}
          user={user}
        />
      )}
    </section>
  );
}
