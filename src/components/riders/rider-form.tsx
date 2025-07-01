import { useState, useEffect } from "react";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";
import { useChunk } from "stunk/react";

import { riderFormData } from "@/lib/store/rider-store";
import { appChunk } from "@/lib/store/app-store";
import { parseDateString } from "@/lib/helpers";
import SelectStates from "../select-state";
import SelectCities from "../select-cities";

const genderOptions = [
  { key: "Male", label: "Male" },
  { key: "Female", label: "Female" },
  { key: "Other", label: "Other" },
];

const statusOptions = [
  { key: "Active", label: "Active" },
  { key: "Inactive", label: "Inactive" },
  { key: "Suspended", label: "Suspended" },
  { key: "Pending", label: "Pending" },
];

interface RiderFormProps {
  onFormChange?: (isValid: boolean, formData?: any) => void;
}

export default function RiderForm({ onFormChange }: RiderFormProps) {
  const [globalFormData, setGlobalFormData] = useChunk(riderFormData);
  const [appState] = useChunk(appChunk);
  const [localFormData, setLocalFormData] = useState(globalFormData);

  // Sync local state when global state changes (for edit mode)
  useEffect(() => {
    setLocalFormData(globalFormData);
  }, [globalFormData]);

  const isFormValid = (data = localFormData) => {
    const requiredFields = [
      "first_name",
      "last_name",
      "email",
      "phone_number",
      "address_line1",
      "city",
      "state_province",
      "postal_code",
      "country",
      "emergency_contact_name",
      "emergency_contact_phone",
      "status",
    ];

    return requiredFields.every((field) => {
      const value = data[field as keyof typeof data];
      return value && value.toString().trim() !== "";
    });
  };

  // Notify parent of form validity changes
  useEffect(() => {
    if (onFormChange) {
      onFormChange(isFormValid(localFormData), localFormData);
    }
  }, [localFormData, onFormChange]);

  const updateLocalField = (
    field: keyof typeof localFormData,
    value: string
  ) => {
    setLocalFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateGlobalField = (
    field: keyof typeof globalFormData,
    value: string
  ) => {
    setGlobalFormData((state) => ({ ...state, [field]: value }));
  };

  const handleBlur = (field: keyof typeof localFormData) => {
    if (localFormData[field] !== globalFormData[field]) {
      updateGlobalField(field, localFormData[field]);
    }
  };

  const handleDateChange = (field: keyof typeof globalFormData, date: any) => {
    const dateString = date ? date.toString() : "";
    setLocalFormData((prev) => ({ ...prev, [field]: dateString }));
    updateGlobalField(field, dateString);
  };

  const handleSelectChange = (
    field: keyof typeof globalFormData,
    value: string
  ) => {
    setLocalFormData((prev) => ({ ...prev, [field]: value }));
    updateGlobalField(field, value);
  };

  const handleCityChange = (cityName: string) => {
    updateLocalField("city", cityName);
    updateGlobalField("city", cityName);
  };

  // Set default country to Nigeria
  useEffect(() => {
    if (!localFormData.country) {
      updateLocalField("country", "Nigeria");
      updateGlobalField("country", "Nigeria");
    }
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Input
        label="First Name"
        placeholder="Enter first name"
        value={localFormData.first_name}
        onChange={(e) => updateLocalField("first_name", e.target.value)}
        onBlur={() => handleBlur("first_name")}
        isRequired
      />
      <Input
        label="Last Name"
        placeholder="Enter last name"
        value={localFormData.last_name}
        onChange={(e) => updateLocalField("last_name", e.target.value)}
        onBlur={() => handleBlur("last_name")}
        isRequired
      />
      <Input
        label="Email"
        type="email"
        placeholder="Enter email address"
        value={localFormData.email}
        onChange={(e) => updateLocalField("email", e.target.value)}
        onBlur={() => handleBlur("email")}
        isRequired
      />
      <Input
        label="Phone Number"
        placeholder="Enter phone number"
        value={localFormData.phone_number}
        onChange={(e) => updateLocalField("phone_number", e.target.value)}
        onBlur={() => handleBlur("phone_number")}
        isRequired
      />

      <DatePicker
        label="Date of Birth"
        value={parseDateString(localFormData.date_of_birth)}
        onChange={(date) => handleDateChange("date_of_birth", date)}
        showMonthAndYearPickers
        maxValue={parseDate("2010-01-01")}
      />

      <Select
        label="Gender"
        placeholder="Select gender"
        selectedKeys={localFormData.gender ? [localFormData.gender] : []}
        onSelectionChange={(keys) =>
          handleSelectChange("gender", (Array.from(keys)[0] as string) || "")
        }
      >
        {genderOptions.map((option) => (
          <SelectItem key={option.key}>{option.label}</SelectItem>
        ))}
      </Select>

      <Input
        label="Address Line 1"
        placeholder="Enter address"
        value={localFormData.address_line1}
        onChange={(e) => updateLocalField("address_line1", e.target.value)}
        onBlur={() => handleBlur("address_line1")}
        isRequired
      />
      <Input
        label="Address Line 2"
        placeholder="Enter apartment, suite, etc."
        value={localFormData.address_line2}
        onChange={(e) => updateLocalField("address_line2", e.target.value)}
        onBlur={() => handleBlur("address_line2")}
      />

      {/* Country - hardcoded to Nigeria */}
      <Input
        label="Country"
        value="Nigeria"
        isReadOnly
        isRequired
        className="bg-gray-50"
      />

      {/* State selector using existing SelectStates component */}
      <SelectStates />

      {/* City selector - depends on selected state */}
      <SelectCities
        stateId={appState.stateId}
        onCityChange={handleCityChange}
      />

      <Input
        label="Postal Code"
        placeholder="Enter postal code"
        value={localFormData.postal_code}
        onChange={(e) => updateLocalField("postal_code", e.target.value)}
        onBlur={() => handleBlur("postal_code")}
        isRequired
      />

      <Input
        label="Emergency Contact Name"
        placeholder="Enter emergency contact name"
        value={localFormData.emergency_contact_name}
        onChange={(e) =>
          updateLocalField("emergency_contact_name", e.target.value)
        }
        onBlur={() => handleBlur("emergency_contact_name")}
        isRequired
      />
      <Input
        label="Emergency Contact Phone"
        placeholder="Enter emergency contact phone"
        value={localFormData.emergency_contact_phone}
        onChange={(e) =>
          updateLocalField("emergency_contact_phone", e.target.value)
        }
        onBlur={() => handleBlur("emergency_contact_phone")}
        isRequired
      />

      <Input
        label="License Number"
        placeholder="Enter license number"
        value={localFormData.license_number}
        onChange={(e) => updateLocalField("license_number", e.target.value)}
        onBlur={() => handleBlur("license_number")}
      />

      <DatePicker
        label="License Expiry Date"
        value={parseDateString(localFormData.license_expiry_date)}
        onChange={(date) => handleDateChange("license_expiry_date", date)}
        showMonthAndYearPickers
        minValue={parseDate(new Date().toISOString().split("T")[0])} // Must be future date
      />

      <Select
        label="Status"
        placeholder="Select status"
        selectedKeys={localFormData.status ? [localFormData.status] : []}
        onSelectionChange={(keys) =>
          handleSelectChange("status", (Array.from(keys)[0] as string) || "")
        }
        isRequired
      >
        {statusOptions.map((option) => (
          <SelectItem key={option.key}>{option.label}</SelectItem>
        ))}
      </Select>

      {/* Notes - Optional, spans full width */}
      <div className="md:col-span-3">
        <Textarea
          label="Notes"
          placeholder="Enter additional notes"
          value={localFormData.notes}
          onChange={(e) => updateLocalField("notes", e.target.value)}
          onBlur={() => handleBlur("notes")}
        />
      </div>
    </div>
  );
}
