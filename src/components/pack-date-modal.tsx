import React from "react";
import {
  parseDate,
  getLocalTimeZone,
  CalendarDate,
} from "@internationalized/date";
import { DateInput } from "@heroui/date-input";
import { useDateFormatter } from "@react-aria/i18n";
import { Button } from "@heroui/button";
import { useLocation } from "react-router-dom";

interface PackDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: CalendarDate) => void;
}

export default function PackDateModal({
  isOpen,
  onClose,
  onConfirm,
}: PackDateModalProps) {
  const [selectedDate, setSelectedDate] = React.useState<CalendarDate>(
    parseDate(new Date().toISOString().split("T")[0])
  );
  const formatter = useDateFormatter({ dateStyle: "full" });

  const location = useLocation();

  const label =
    location.pathname === "/pack" ? "Next Pack Date" : "Next Delivery Date";

  const handleConfirm = () => {
    onConfirm(selectedDate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <h2 className="text-xl font-bold mb-4">Select {label}</h2>

        <div className="mb-4">
          <DateInput
            label={label}
            value={selectedDate as any}
            onChange={setSelectedDate as any}
          />
          <p className="text-gray-500 text-sm mt-2">
            Selected date:{" "}
            {selectedDate
              ? formatter.format(selectedDate.toDate(getLocalTimeZone()))
              : "--"}
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button onPress={onClose} radius="sm" color="default">
            Cancel
          </Button>
          <Button onPress={handleConfirm} color="primary" radius="sm">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
