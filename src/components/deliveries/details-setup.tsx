import { useEffect, useState } from "react";
import { useChunkValue } from "stunk/react";

import { DatePicker } from "@heroui/date-picker";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { DateValue, parseDate } from "@internationalized/date";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";

export default function DeliveryDetailsStep() {
  const formState = useChunkValue(deliveryFormState);
  const [frequencyValue, setFrequencyValue] = useState<Set<string>>(
    new Set(formState.deliveryFrequency ? [formState.deliveryFrequency] : [])
  );

  const startDateValue = formState.delStartDate
    ? parseDate(formState.delStartDate.split("T")[0])
    : undefined;

  const frequencyOptions = [
    { key: "Daily", label: "Daily" },
    { key: "Weekly", label: "Weekly" },
    { key: "Bi-weekly", label: "Bi-weekly" },
    { key: "Monthly", label: "Monthly" },
    { key: "Quarterly", label: "Quarterly" },
  ];

  console.log(formState);

  useEffect(() => {
    const frequency = Array.from(frequencyValue)[0];
    if (frequency) {
      deliveryActions.updateFormField("deliveryFrequency", frequency);
      if (formState.delStartDate) {
        handleStartDateChange(parseDate(formState.delStartDate.split("T")[0]));
      }
    }
  }, [frequencyValue]);

  const handleStartDateChange = (date: DateValue | null) => {
    if (!date) return;

    deliveryActions.updateFormField("delStartDate", date.toString());

    const frequency = formState.deliveryFrequency;
    if (frequency) {
      const nextDate = calculateNextDate(date, frequency);
      deliveryActions.updateFormField("nextDeliveryDate", nextDate.toString());
    }

    if (formState.frequencyDuration) {
      const endDate = calculateEndDate(date, formState.frequencyDuration);
      deliveryActions.updateFormField("endDate", endDate.toString());
    }
  };

  const calculateNextDate = (date: DateValue, frequency: string): DateValue => {
    switch (frequency) {
      case "Daily":
        return date.add({ days: 1 });
      case "Weekly":
        return date.add({ weeks: 1 });
      case "Bi-weekly":
        return date.add({ weeks: 2 });
      case "Monthly":
        return date.add({ months: 1 });
      case "Quarterly":
        return date.add({ months: 3 });
      default:
        return date.add({ days: 1 });
    }
  };

  const calculateEndDate = (date: DateValue, duration: string): DateValue => {
    const months = parseInt(duration);
    return date.add({ months });
  };

  const handleFrequencyDurationChange = (value: string) => {
    deliveryActions.updateFormField("frequencyDuration", value);
    if (formState.delStartDate) {
      const date = parseDate(formState.delStartDate.split("T")[0]);
      const endDate = calculateEndDate(date, value);
      deliveryActions.updateFormField("endDate", endDate.toString());
    }
  };

  const handleSelectionChange = (selection: SharedSelection) => {
    setFrequencyValue(selection as Set<string>);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Delivery Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Delivery Frequency"
          selectedKeys={frequencyValue}
          onSelectionChange={handleSelectionChange}
        >
          {frequencyOptions.map((option) => (
            <SelectItem key={option.key}>{option.label}</SelectItem>
          ))}
        </Select>

        <Input
          label="Frequency Duration (months)"
          type="number"
          value={formState.frequencyDuration}
          onChange={(e) => handleFrequencyDurationChange(e.target.value)}
          min="1"
        />

        <DatePicker
          label="Start Date"
          value={startDateValue}
          onChange={handleStartDateChange}
          isRequired
        />

        <DatePicker
          label="Next Delivery Date"
          value={
            formState.nextDeliveryDate
              ? parseDate(formState.nextDeliveryDate.split("T")[0])
              : undefined
          }
          isDisabled
        />

        <DatePicker
          label="End Date"
          value={
            formState.endDate
              ? parseDate(formState.endDate.split("T")[0])
              : undefined
          }
          isDisabled
        />
      </div>
    </div>
  );
}
