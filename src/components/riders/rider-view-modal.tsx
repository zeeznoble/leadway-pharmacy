import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { Card, CardBody } from "@heroui/card";
import { useAsyncChunk } from "stunk/react";
import { Spinner } from "@heroui/spinner";
import { fetchRiderById } from "@/lib/services/rider-service";

interface RiderViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  riderId: number;
}

export default function RiderViewModal({
  isOpen,
  onClose,
  riderId,
}: RiderViewModalProps) {
  const {
    data: rider,
    loading,
    error,
    reload,
  } = useAsyncChunk(fetchRiderById, [riderId!]);

  const shouldShowData = riderId && rider && !loading && !error;

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "default";
      case "suspended":
        return "danger";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Rider Details</h2>
        </ModalHeader>

        <ModalBody className="gap-4">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Spinner color="warning" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              <p>Error loading rider details: {error.message}</p>
              <Button
                color="primary"
                variant="flat"
                size="sm"
                className="mt-3"
                onPress={() => {
                  if (riderId) {
                    reload();
                  }
                }}
              >
                Retry
              </Button>
            </div>
          ) : shouldShowData ? (
            <div className="space-y-6">
              <Card shadow="none">
                <CardBody className="flex flex-row items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {rider.first_name} {rider.last_name}
                    </h3>
                    <p className="text-gray-600">{rider.email}</p>
                  </div>
                  <Chip
                    color={getStatusColor(rider.status)}
                    variant="flat"
                    size="lg"
                  >
                    {rider.status}
                  </Chip>
                </CardBody>
              </Card>

              {/* Personal Information */}
              <Card shadow="none">
                <CardBody>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Phone Number
                      </label>
                      <p className="text-gray-800">
                        {rider.phone_number || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Date of Birth
                      </label>
                      <p className="text-gray-800">
                        {formatDate(rider.date_of_birth)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Gender
                      </label>
                      <p className="text-gray-800">
                        {rider.gender || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        License Number
                      </label>
                      <p className="text-gray-800">
                        {rider.license_number || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        License Expiry
                      </label>
                      <p className="text-gray-800">
                        {formatDate(rider.license_expiry_date)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Address Information */}
              <Card shadow="none">
                <CardBody>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">
                    Address
                  </h4>
                  <div className="space-y-2">
                    <p className="text-gray-800">{rider.address_line1}</p>
                    {rider.address_line2 && (
                      <p className="text-gray-800">{rider.address_line2}</p>
                    )}
                    <p className="text-gray-800">
                      {rider.city}, {rider.state_province} {rider.postal_code}
                    </p>
                    <p className="text-gray-800">{rider.country}</p>
                  </div>
                </CardBody>
              </Card>

              {/* Emergency Contact */}
              <Card shadow="none">
                <CardBody>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Name
                      </label>
                      <p className="text-gray-800">
                        {rider.emergency_contact_name || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Phone
                      </label>
                      <p className="text-gray-800">
                        {rider.emergency_contact_phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Notes */}
              {rider.notes && (
                <Card shadow="none">
                  <CardBody>
                    <h4 className="text-lg font-semibold mb-4 text-gray-800">
                      Notes
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {rider.notes}
                    </p>
                  </CardBody>
                </Card>
              )}

              {/* Profile Picture */}
              {rider.profile_picture_url && (
                <Card>
                  <CardBody>
                    <h4 className="text-lg font-semibold mb-4 text-gray-800">
                      Profile Picture
                    </h4>
                    <img
                      src={rider.profile_picture_url}
                      alt={`${rider.first_name} ${rider.last_name}`}
                      className="w-32 h-32 rounded-full object-cover mx-auto"
                    />
                  </CardBody>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              {riderId ? "No rider data available" : "No rider selected"}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
