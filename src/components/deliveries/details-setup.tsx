import { useEffect, useState } from "react";
import { useChunkValue } from "stunk/react";

import { DatePicker } from "@heroui/date-picker";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { DateValue, parseDate } from "@internationalized/date";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";
import { appChunk } from "@/lib/store/app-store"; // Add this import

export default function DeliveryDetailsStep() {
  const formState = useChunkValue(deliveryFormState);
  const { enrolleeData } = useChunkValue(appChunk);

  const [frequencyValue, setFrequencyValue] = useState<Set<string>>(
    new Set(formState.deliveryFrequency ? [formState.deliveryFrequency] : [])
  );

  const startDateValue = formState.delStartDate
    ? parseDate(formState.delStartDate.split("T")[0])
    : undefined;

  const memberExpiryDate = enrolleeData?.Member_ExpiryDate
    ? parseDate(enrolleeData.Member_ExpiryDate.split("T")[0])
    : undefined;

  const frequencyOptions = [
    { key: "One-off", label: "One-off" },
    { key: "Routine", label: "Routine" },
  ];

  // const isOneOff = formState.deliveryFrequency === "One-off";
  const isRoutine = formState.deliveryFrequency === "Routine";

  console.log(formState);

  // Set default values in form state if they don't exist
  useEffect(() => {
    if (!formState.deliveryFrequency) {
      deliveryActions.updateFormField("deliveryFrequency", "One-off");
      setFrequencyValue(new Set(["One-off"]));
    }
    if (!formState.delStartDate) {
      const today = new Date().toISOString();
      deliveryActions.updateFormField("delStartDate", today);
    }
  }, []);

  useEffect(() => {
    const frequency = Array.from(frequencyValue)[0];
    if (frequency) {
      deliveryActions.updateFormField("deliveryFrequency", frequency);

      // Clear routine-specific fields when switching to one-off
      if (frequency === "One-off") {
        deliveryActions.updateFormField("frequencyDuration", "");
        deliveryActions.updateFormField("nextDeliveryDate", "");
        deliveryActions.updateFormField("endDate", "");
      }

      // Recalculate dates for routine if start date exists
      if (frequency === "Routine" && formState.delStartDate) {
        handleStartDateChange(parseDate(formState.delStartDate.split("T")[0]));
      }
    }
  }, [frequencyValue]);

  const handleStartDateChange = (date: DateValue | null) => {
    if (!date) return;

    deliveryActions.updateFormField("delStartDate", date.toString());

    // Only calculate next delivery and end dates for routine deliveries
    if (isRoutine) {
      // For routine, next delivery is based on monthly frequency
      const nextDate = date.add({ months: 1 });
      deliveryActions.updateFormField("nextDeliveryDate", nextDate.toString());

      if (formState.frequencyDuration) {
        const endDate = calculateEndDate(date, formState.frequencyDuration);
        deliveryActions.updateFormField("endDate", endDate.toString());
      }
    }
  };

  const calculateEndDate = (date: DateValue, duration: string): DateValue => {
    const months = parseInt(duration);
    const calculatedEndDate = date.add({ months });

    // Ensure end date doesn't exceed member expiry date
    if (memberExpiryDate && calculatedEndDate.compare(memberExpiryDate) > 0) {
      return memberExpiryDate;
    }

    return calculatedEndDate;
  };

  const handleFrequencyDurationChange = (value: string) => {
    deliveryActions.updateFormField("frequencyDuration", value);
    if (formState.delStartDate && isRoutine) {
      const date = parseDate(formState.delStartDate.split("T")[0]);
      const endDate = calculateEndDate(date, value);
      deliveryActions.updateFormField("endDate", endDate.toString());
    }
  };

  const handleSelectionChange = (selection: SharedSelection) => {
    setFrequencyValue(selection as Set<string>);
  };

  // Calculate max duration in months based on member expiry date
  const getMaxDuration = (): number | undefined => {
    if (!memberExpiryDate || !startDateValue) return undefined;

    // Calculate difference in months manually
    const startYear = startDateValue.year;
    const startMonth = startDateValue.month;
    const expiryYear = memberExpiryDate.year;
    const expiryMonth = memberExpiryDate.month;

    const diffInMonths =
      (expiryYear - startYear) * 12 + (expiryMonth - startMonth);
    return Math.max(0, diffInMonths);
  };

  const maxDuration = getMaxDuration();

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Delivery Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Delivery Type"
          selectedKeys={frequencyValue}
          onSelectionChange={handleSelectionChange}
        >
          {frequencyOptions.map((option) => (
            <SelectItem key={option.key}>{option.label}</SelectItem>
          ))}
        </Select>

        <DatePicker
          label={
            formState.deliveryFrequency === "One-off" ? "Start" : "Start Date"
          }
          value={startDateValue}
          onChange={handleStartDateChange}
          isRequired
          maxValue={memberExpiryDate}
        />

        {isRoutine && (
          <>
            <Input
              label="Frequency Duration (months)"
              type="number"
              value={formState.frequencyDuration}
              onChange={(e) => handleFrequencyDurationChange(e.target.value)}
              min="1"
              max={maxDuration?.toString()}
              description={
                maxDuration
                  ? `Maximum ${maxDuration} months (based on member expiry date)`
                  : "Enter duration in months"
              }
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
          </>
        )}
      </div>
    </div>
  );
}
