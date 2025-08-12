import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { useAsyncChunk, useChunkValue } from "stunk/react";

import RiderTable from "@/components/riders/rider-table";
import RiderForm from "@/components/riders/rider-form";
import { ErrorText } from "@/components/error-text";

import {
  fetchAllRiders,
  createOrUpdateRider,
} from "@/lib/services/rider-service";
import {
  riderStore,
  riderFormData,
  riderActions,
  viewRiderActions,
  viewRiderStore,
} from "@/lib/store/rider-store";
import RiderViewModal from "@/components/riders/rider-view-modal";

export default function RidersPage() {
  const {
    data: riders,
    loading,
    error: fetchError,
    reload,
    refresh,
  } = useAsyncChunk(fetchAllRiders);
  const { showModal, isSubmitting, error, editingRider } =
    useChunkValue(riderStore);
  const { showViewModal, selectedRiderId } = useChunkValue(viewRiderStore);
  const formData = useChunkValue(riderFormData);

  // Local state to track form validity
  const [isFormCurrentlyValid, setIsFormCurrentlyValid] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      riderActions.openModal();
    } else {
      riderActions.closeModal();
    }
  };

  // Modified to accept data parameter for validation
  const isFormValid = (data = formData) => {
    const requiredFields = [
      "first_name",
      "last_name",
      "email",
      "phone_number",
      "address_line1",
      "city",
      "state_province",
      "emergency_contact_name",
      "emergency_contact_phone",
      "status",
    ];

    return requiredFields.every((field) => {
      const value = data[field as keyof typeof data];
      return value && value.toString().trim() !== "";
    });
  };

  const handleFormValidityChange = (isValid: boolean) => {
    setIsFormCurrentlyValid(isValid);
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      riderActions.setError("Please fill in all required fields");
      return;
    }

    riderActions.setSubmitting(true);
    riderActions.setError(null);

    try {
      const riderData = editingRider
        ? { ...formData, rider_id: editingRider.rider_id }
        : formData;

      const result = await createOrUpdateRider(riderData);

      if (result.success) {
        riderActions.closeModal();
        refresh();
      } else {
        riderActions.setError(result.message);
      }
    } catch (err) {
      riderActions.setError("An unexpected error occurred");
    } finally {
      riderActions.setSubmitting(false);
    }
  };
  
  useEffect(() => {
   fetchAllRiders();
  }, []);

  return (
    <section className="py-3 px-2">
      <div className="flex justify-between mb-4">
        <p className="text-xl">List of Riders</p>
        <Button radius="sm" color="primary" onPress={riderActions.openModal}>
          Add Rider
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading riders...</div>
      ) : fetchError ? (
        <div className="text-center py-10 text-red-500">
          Error: {fetchError.message}
          <br />
          <Button color="primary" onPress={reload} className="mt-2">
            Retry
          </Button>
        </div>
      ) : riders ? (
        <RiderTable riders={riders} />
      ) : (
        <div className="text-center py-10 text-gray-500">
          No riders data available
        </div>
      )}

      <Modal
        backdrop="blur"
        isOpen={showModal}
        isDismissable={false}
        onOpenChange={handleOpenChange}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {editingRider ? "Edit Rider" : "Add New Rider"}
          </ModalHeader>
          <ModalBody>
            {error && <ErrorText text={error} />}
            <RiderForm onFormChange={handleFormValidityChange} />
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={riderActions.closeModal}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={isSubmitting || !isFormCurrentlyValid}
            >
              {editingRider ? "Update Rider" : "Create Rider"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {selectedRiderId && (
        <RiderViewModal
          isOpen={showViewModal}
          onClose={viewRiderActions.closeViewModal}
          riderId={selectedRiderId}
        />
      )}
    </section>
  );
}
