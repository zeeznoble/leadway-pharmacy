import { useEffect, useState } from "react";
import { useChunkValue } from "stunk/react";

import { DatePicker } from "@heroui/date-picker";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import {
  DateValue,
  getLocalTimeZone,
  parseDate,
} from "@internationalized/date";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";

export default function DeliveryDetailsStep() {
  const formState = useChunkValue(deliveryFormState);
  const [frequencyValue, setFrequencyValue] = useState<Set<string>>(
    new Set(formState.deliveryFrequency ? [formState.deliveryFrequency] : [])
  );

  const startDateValue = formState.delStartDate
    ? parseDate(formState.delStartDate)
    : undefined;

  const frequencyOptions = [
    { key: "Daily", label: "Daily" },
    { key: "Weekly", label: "Weekly" },
    { key: "Bi-weekly", label: "Bi-weekly" },
    { key: "Monthly", label: "Monthly" },
    { key: "Quarterly", label: "Quarterly" },
  ];

  // Update form state when frequency selection changes
  useEffect(() => {
    const frequency = Array.from(frequencyValue)[0] as string;
    if (frequency) {
      deliveryActions.updateFormField("deliveryFrequency", frequency);

      if (formState.delStartDate) {
        handleStartDateChange(parseDate(formState.delStartDate));
      }
    }
  }, [frequencyValue]);

  const handleStartDateChange = (date: DateValue | null) => {
    if (!date) return;

    const dateString = date
      .toDate(getLocalTimeZone())
      .toISOString()
      .split("T")[0];
    deliveryActions.updateFormField("delStartDate", dateString);

    const startDate = date.toDate(getLocalTimeZone());
    let nextDate = new Date(startDate);

    switch (formState.deliveryFrequency) {
      case "Daily":
        nextDate.setDate(startDate.getDate() + 1);
        break;
      case "Weekly":
        nextDate.setDate(startDate.getDate() + 7);
        break;
      case "Bi-weekly":
        nextDate.setDate(startDate.getDate() + 14);
        break;
      case "Monthly":
        nextDate.setMonth(startDate.getMonth() + 1);
        break;
      case "Quarterly":
        nextDate.setMonth(startDate.getMonth() + 3);
        break;
    }

    deliveryActions.updateFormField(
      "nextDeliveryDate",
      nextDate.toISOString().split("T")[0]
    );

    if (formState.frequencyDuration) {
      const months = parseInt(formState.frequencyDuration);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);
      deliveryActions.updateFormField(
        "endDate",
        endDate.toISOString().split("T")[0]
      );
    }
  };

  const handleFrequencyDurationChange = (value: string) => {
    deliveryActions.updateFormField("frequencyDuration", value);

    if (formState.delStartDate) {
      const startDate = new Date(formState.delStartDate);
      const months = parseInt(value);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);
      deliveryActions.updateFormField(
        "endDate",
        endDate.toISOString().split("T")[0]
      );
    }
  };

  const handleSelectionChange = (selection: SharedSelection) => {
    setFrequencyValue(selection as Set<string>);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Delivery Details</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select
            label="Delivery Frequency"
            placeholder="Select frequency"
            selectedKeys={frequencyValue}
            onSelectionChange={handleSelectionChange}
            className="w-full"
          >
            {frequencyOptions.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <Input
            label="Frequency Duration (months)"
            type="number"
            placeholder="1"
            min="1"
            value={formState.frequencyDuration}
            onChange={(e) => handleFrequencyDurationChange(e.target.value)}
            required
          />
        </div>

        <div>
          <DatePicker
            label="Start Date"
            value={startDateValue}
            onChange={(date) => handleStartDateChange(date)}
            isRequired
          />
        </div>

        <div>
          <DatePicker
            label="Next Delivery Date"
            value={
              formState.nextDeliveryDate
                ? parseDate(formState.nextDeliveryDate)
                : undefined
            }
            onChange={(date) =>
              deliveryActions.updateFormField("nextDeliveryDate", date)
            }
            isDisabled
          />
        </div>

        <div>
          <DatePicker
            label="End Date"
            value={formState.endDate ? parseDate(formState.endDate) : undefined}
            onChange={(date) =>
              deliveryActions.updateFormField("endDate", date)
            }
            isDisabled
          />
        </div>
      </div>
    </div>
  );
}
