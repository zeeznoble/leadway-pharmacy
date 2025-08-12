import React from "react";
import { getLocalTimeZone, CalendarDate, today } from "@internationalized/date";
import { Input } from "@heroui/input";
import { useDateFormatter } from "@react-aria/i18n";
import { Button } from "@heroui/button";
import { useLocation } from "react-router-dom";

interface PackDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: CalendarDate, months: number, actualMonths: number) => void;
  selectedDeliveries?: any[]; // Add selected deliveries to get EndDate
}

export default function PackDateModal({
  isOpen,
  onClose,
  onConfirm,
  selectedDeliveries = [],
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

  // Find the earliest EndDate from selected deliveries
  const getEarliestEndDate = (): CalendarDate | null => {
    if (!selectedDeliveries.length) return null;

    let earliestDate: Date | any = null;

    selectedDeliveries.forEach((delivery) => {
      const endDate = delivery.EndDate || delivery.enddate;
      if (endDate) {
        const date = new Date(endDate);
        if (!earliestDate || date < earliestDate) {
          earliestDate = date;
        }
      }
    });

    if (earliestDate) {
      return new CalendarDate(
        earliestDate.getFullYear(),
        earliestDate.getMonth() + 1,
        earliestDate.getDate()
      );
    }

    return null;
  };

  const calculateAdjustedDateAndMonths = (requestedMonths: number) => {
    const calculatedDate = calculateFutureDate(requestedMonths);
    const earliestEndDate = getEarliestEndDate();

    if (!earliestEndDate) {
      return {
        finalDate: calculatedDate,
        actualMonths: requestedMonths,
        isAdjusted: false,
      };
    }

    // Compare calculated date with earliest end date
    const calculatedDateObj = calculatedDate.toDate(getLocalTimeZone());
    const endDateObj = earliestEndDate.toDate(getLocalTimeZone());

    if (calculatedDateObj > endDateObj) {
      // Calculate actual months difference between today and end date
      const today = todayDate.toDate(getLocalTimeZone());
      const yearsDiff = endDateObj.getFullYear() - today.getFullYear();
      const monthsDiff = endDateObj.getMonth() - today.getMonth();
      const daysDiff = endDateObj.getDate() - today.getDate();

      let actualMonths = yearsDiff * 12 + monthsDiff;

      // If the day difference is negative, reduce by one month
      if (daysDiff < 0) {
        actualMonths -= 1;
      }

      // Ensure actualMonths is at least 1 and not greater than requested
      actualMonths = Math.max(1, Math.min(actualMonths, requestedMonths));

      return {
        finalDate: earliestEndDate,
        actualMonths,
        isAdjusted: true,
      };
    }

    return {
      finalDate: calculatedDate,
      actualMonths: requestedMonths,
      isAdjusted: false,
    };
  };

  const { finalDate, actualMonths, isAdjusted } =
    calculateAdjustedDateAndMonths(selectedMonths);
  const earliestEndDate = getEarliestEndDate();

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
    onConfirm(finalDate, selectedMonths, actualMonths); // Pass original months, actual months, and final date
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

          {/* Show earliest end date if available */}
          {earliestEndDate && (
            <p className="text-orange-600 text-sm mt-2">
              <strong>Earliest End Date:</strong>{" "}
              {formatter.format(earliestEndDate.toDate(getLocalTimeZone()))}
            </p>
          )}

          <p className="text-gray-500 text-sm mt-2">
            Calculated {label.toLowerCase()}:{" "}
            {!isMonthsInvalid
              ? formatter.format(finalDate.toDate(getLocalTimeZone()))
              : "Invalid input"}
          </p>

          {/* Show adjustment warning */}
          {isAdjusted && !isMonthsInvalid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
              <p className="text-yellow-800 text-sm">
                <strong>⚠️ Date Adjusted:</strong> The requested date exceeds
                the treatment end date.
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                • Requested months: <strong>{selectedMonths}</strong>
                <br />• Actual months possible: <strong>{actualMonths}</strong>
                <br />• Final date:{" "}
                <strong>
                  {formatter.format(finalDate.toDate(getLocalTimeZone()))}
                </strong>
              </p>
            </div>
          )}
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
            Confirm {isAdjusted ? `(${actualMonths} months)` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
