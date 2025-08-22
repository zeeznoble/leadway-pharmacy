import { useState } from "react";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Rider } from "@/types";

interface RiderSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rider: Rider) => void;
  riders: Rider[];
  loading: boolean;
  error: Error | null;
}
export default function RiderSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  riders,
  loading,
  error,
}: RiderSelectionModalProps) {
  const [selectedRiderId, setSelectedRiderId] = useState<string>("");

  const handleConfirm = () => {
    const selectedRider = riders.find(
      (rider) => rider.rider_id?.toString() === selectedRiderId
    );
    if (selectedRider) {
      onConfirm(selectedRider);
      onClose();
    }
  };

  const activeRiders = riders.filter((rider) => rider.status === "Active");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <h2 className="text-xl font-bold mb-4">Select Rider</h2>

        {loading ? (
          <div className="text-center py-8">
            <Spinner color="primary" />
            <p className="mt-2 text-gray-600">Loading riders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500 bg-red-50 rounded-md mb-4">
            {error.message || "Failed to load riders"}{" "}
            {/* Convert error to string */}
          </div>
        ) : (
          <div className="mb-4">
            <Select
              label="Choose a rider"
              placeholder="Select a rider"
              selectedKeys={selectedRiderId ? [selectedRiderId] : []}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as string;
                setSelectedRiderId(key);
              }}
              className="w-full"
            >
              {activeRiders.map((rider) => (
                <SelectItem key={rider.rider_id?.toString() || ""}>
                  {`${rider.first_name} ${rider.last_name} -  ${rider.city}, ${rider.state_province}`}
                </SelectItem>
              ))}
            </Select>

            {activeRiders.length === 0 && (
              <p className="text-gray-500 text-sm mt-2">
                No active riders available
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button onPress={onClose} radius="sm" color="default">
            Cancel
          </Button>
          <Button
            onPress={handleConfirm}
            color="primary"
            radius="sm"
            isDisabled={
              !selectedRiderId || loading || activeRiders.length === 0
            }
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
