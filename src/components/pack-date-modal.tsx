import React from "react";
import { getLocalTimeZone, CalendarDate, today } from "@internationalized/date";
import { Input } from "@heroui/input";
import { useDateFormatter } from "@react-aria/i18n";
import { Button } from "@heroui/button";
import { useLocation } from "react-router-dom";

interface DeliveryAdjustment {
  enrolleeId: string;
  enrolleeName: string;
  memberExpiryDate: string;
  adjustedDate: CalendarDate;
  adjustedMonths: number;
  isAdjusted: boolean;
}

interface PackDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Make onConfirm flexible to handle both old and new interfaces
  onConfirm:
    | ((
        originalMonths: number,
        deliveryAdjustments: DeliveryAdjustment[]
      ) => void)
    | ((date: CalendarDate) => void);
  selectedDeliveries?: any[];
  // Add a mode prop to determine which interface to use
  mode?: "advanced" | "simple";
}

export default function PackDateModal({
  isOpen,
  onClose,
  onConfirm,
  selectedDeliveries = [],
  mode = "advanced", // Default to advanced mode
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

  // Calculate adjustments for each delivery based on member expiry dates
  const calculateDeliveryAdjustments = (
    requestedMonths: number
  ): DeliveryAdjustment[] => {
    if (mode === "simple") {
      return []; // No adjustments in simple mode
    }

    return selectedDeliveries.map((delivery) => {
      // Try multiple possible field names for member expiry date
      const memberExpiryDate =
        delivery.Member_ExpiryDate ||
        delivery.memberExpiryDate ||
        delivery.member_expiry_date ||
        delivery.MemberExpiryDate;
      const enrolleeId =
        delivery.EnrolleeId || delivery.enrolleeid || "Unknown";
      const enrolleeName =
        delivery.EnrolleeName || delivery.enrolleename || "Unknown";

      const calculatedDate = calculateFutureDate(requestedMonths);

      if (!memberExpiryDate) {
        return {
          enrolleeId,
          enrolleeName,
          memberExpiryDate: "N/A",
          adjustedDate: calculatedDate,
          adjustedMonths: requestedMonths,
          isAdjusted: false,
        };
      }

      try {
        const expiryDate = new Date(memberExpiryDate);
        const expiryCalendarDate = new CalendarDate(
          expiryDate.getFullYear(),
          expiryDate.getMonth() + 1,
          expiryDate.getDate()
        );

        const calculatedDateObj = calculatedDate.toDate(getLocalTimeZone());
        const expiryDateObj = expiryDate;

        if (calculatedDateObj > expiryDateObj) {
          // Calculate actual months difference between today and expiry date
          const today = todayDate.toDate(getLocalTimeZone());
          const yearsDiff = expiryDateObj.getFullYear() - today.getFullYear();
          const monthsDiff = expiryDateObj.getMonth() - today.getMonth();
          const daysDiff = expiryDateObj.getDate() - today.getDate();

          let actualMonths = yearsDiff * 12 + monthsDiff;

          // If the day difference is negative, reduce by one month
          if (daysDiff < 0) {
            actualMonths -= 1;
          }

          // Ensure actualMonths is at least 1 and not greater than requested
          actualMonths = Math.max(1, Math.min(actualMonths, requestedMonths));

          return {
            enrolleeId,
            enrolleeName,
            memberExpiryDate,
            adjustedDate: expiryCalendarDate,
            adjustedMonths: actualMonths,
            isAdjusted: true,
          };
        }

        return {
          enrolleeId,
          enrolleeName,
          memberExpiryDate,
          adjustedDate: calculatedDate,
          adjustedMonths: requestedMonths,
          isAdjusted: false,
        };
      } catch (error) {
        console.error("Error parsing member expiry date:", error);
        return {
          enrolleeId,
          enrolleeName,
          memberExpiryDate,
          adjustedDate: calculatedDate,
          adjustedMonths: requestedMonths,
          isAdjusted: false,
        };
      }
    });
  };

  const deliveryAdjustments = calculateDeliveryAdjustments(selectedMonths);
  const hasAdjustments = deliveryAdjustments.some((adj) => adj.isAdjusted);
  const uniqueMembers = deliveryAdjustments.reduce((acc, adj) => {
    if (!acc.find((item) => item.enrolleeId === adj.enrolleeId)) {
      acc.push(adj);
    }
    return acc;
  }, [] as DeliveryAdjustment[]);

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

    if (mode === "simple") {
      // Simple mode: just pass the calculated date
      const calculatedDate = calculateFutureDate(selectedMonths);
      (onConfirm as (date: CalendarDate) => void)(calculatedDate);
    } else {
      // Advanced mode: pass original months and delivery adjustments
      (
        onConfirm as (
          originalMonths: number,
          deliveryAdjustments: DeliveryAdjustment[]
        ) => void
      )(selectedMonths, deliveryAdjustments);
    }

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
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] shadow-xl overflow-y-auto">
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

          {/* Show member adjustments only in advanced mode */}
          {mode === "advanced" && uniqueMembers.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-sm mb-2">Member Details:</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uniqueMembers.map((adjustment, index) => (
                  <div
                    key={`${adjustment.enrolleeId}-${index}`}
                    className={`p-3 rounded-md border text-sm ${
                      adjustment.isAdjusted
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="font-medium">
                      {adjustment.enrolleeName} ({adjustment.enrolleeId})
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Member Expiry:{" "}
                      {adjustment.memberExpiryDate !== "N/A"
                        ? formatter.format(
                            new Date(adjustment.memberExpiryDate)
                          )
                        : "N/A"}
                    </div>
                    <div className="text-xs mt-1">
                      {adjustment.isAdjusted ? (
                        <span className="text-yellow-700">
                          ⚠️ Adjusted to {adjustment.adjustedMonths} months
                          (expires{" "}
                          {formatter.format(
                            adjustment.adjustedDate.toDate(getLocalTimeZone())
                          )}
                          )
                        </span>
                      ) : (
                        <span className="text-green-700">
                          ✓ {adjustment.adjustedMonths} months (
                          {formatter.format(
                            adjustment.adjustedDate.toDate(getLocalTimeZone())
                          )}
                          )
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show simple calculated date in simple mode */}
          {mode === "simple" && (
            <p className="text-gray-500 text-sm mt-2">
              Calculated {label.toLowerCase()}:{" "}
              {!isMonthsInvalid
                ? formatter.format(
                    calculateFutureDate(selectedMonths).toDate(
                      getLocalTimeZone()
                    )
                  )
                : "Invalid input"}
            </p>
          )}

          {/* Show overall adjustment warning only in advanced mode */}
          {mode === "advanced" && hasAdjustments && !isMonthsInvalid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-4">
              <p className="text-yellow-800 text-sm">
                <strong>⚠️ Some Dates Adjusted:</strong> Some members'{" "}
                {label.toLowerCase()}
                dates have been adjusted due to their membership expiry dates.
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Each delivery will be packed with the appropriate number of
                months based on the individual member's expiry date.
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
            Confirm{" "}
            {mode === "advanced" && hasAdjustments ? `(with adjustments)` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
