import React from "react";
import { getLocalTimeZone, CalendarDate, today } from "@internationalized/date";
import { Input } from "@heroui/input";
import { useDateFormatter } from "@react-aria/i18n";
import { Button } from "@heroui/button";
import { useLocation } from "react-router-dom";

interface PackDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: CalendarDate, months: number) => void;
}

export default function PackDateModal({
  isOpen,
  onClose,
  onConfirm,
}: PackDateModalProps) {
  const [selectedMonths, setSelectedMonths] = React.useState<number>(1);
  const formatter = useDateFormatter({ dateStyle: "full" });
  const location = useLocation();
  const todayDate = today(getLocalTimeZone());

  const label =
    location.pathname === "/pack" ? "Next Pack Date" : "Next Delivery Date";

  // Calculate the future date based on selected months
  const calculateFutureDate = (months: number): CalendarDate => {
    const currentDate = todayDate.toDate(getLocalTimeZone());
    const futureDate = new Date(currentDate);
    futureDate.setMonth(futureDate.getMonth() + months);

    return new CalendarDate(
      futureDate.getFullYear(),
      futureDate.getMonth() + 1,
      futureDate.getDate()
    );
  };

  const calculatedDate = calculateFutureDate(selectedMonths);

  // Validate months input (1-12)
  const isMonthsInvalid =
    selectedMonths < 1 ||
    selectedMonths > 12 ||
    !Number.isInteger(selectedMonths);

  const handleMonthsChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setSelectedMonths(numValue);
    } else if (value === "") {
      setSelectedMonths(1); // Default to 1 if empty
    }
  };

  const handleConfirm = () => {
    if (isMonthsInvalid) {
      return; // Prevent confirming if invalid months
    }
    onConfirm(calculatedDate, selectedMonths); // Pass both date and months
    onClose();
    setSelectedMonths(1); // Reset to default
  };

  const handleClose = () => {
    onClose();
    setSelectedMonths(1); // Reset to default
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Select {label}</h2>

        <div className="mb-4">
          <Input
            type="number"
            label="Number of Months"
            value={selectedMonths.toString()}
            onChange={(e) => handleMonthsChange(e.target.value)}
            min="1"
            max="12"
            step="1"
            description="Enter number of months from today (1-12)"
            isInvalid={isMonthsInvalid}
            errorMessage={
              isMonthsInvalid ? "Please enter a number between 1 and 12" : ""
            }
          />
          <p className="text-gray-500 text-sm mt-2">
            Calculated {label.toLowerCase()}:{" "}
            {!isMonthsInvalid
              ? formatter.format(calculatedDate.toDate(getLocalTimeZone()))
              : "Invalid input"}
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button onPress={handleClose} radius="sm" color="default">
            Cancel
          </Button>
          <Button
            onPress={handleConfirm}
            color="primary"
            radius="sm"
            isDisabled={isMonthsInvalid}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
