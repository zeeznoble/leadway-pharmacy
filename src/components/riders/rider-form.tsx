import { useState, useEffect } from "react";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";
import { useChunk } from "stunk/react";

import { riderFormData } from "@/lib/store/rider-store";
import { parseDateString } from "@/lib/helpers";

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

export default function RiderForm() {
  const [globalFormData, setGlobalFormData] = useChunk(riderFormData);

  const [localFormData, setLocalFormData] = useState(globalFormData);

  // Sync local state when global state changes (for edit mode)
  useEffect(() => {
    setLocalFormData(globalFormData);
  }, [globalFormData]);

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
      <Input
        label="City"
        placeholder="Enter city"
        value={localFormData.city}
        onChange={(e) => updateLocalField("city", e.target.value)}
        onBlur={() => handleBlur("city")}
        isRequired
      />
      <Input
        label="State/Province"
        placeholder="Enter state or province"
        value={localFormData.state_province}
        onChange={(e) => updateLocalField("state_province", e.target.value)}
        onBlur={() => handleBlur("state_province")}
        isRequired
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
        label="Country"
        placeholder="Enter country"
        value={localFormData.country}
        onChange={(e) => updateLocalField("country", e.target.value)}
        onBlur={() => handleBlur("country")}
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

      {/* Profile Picture URL - Optional */}
      {/* <Input
        label="Profile Picture URL"
        placeholder="Enter profile picture URL"
        value={localFormData.profile_picture_url}
        onChange={(e) =>
          updateLocalField("profile_picture_url", e.target.value)
        }
        onBlur={() => handleBlur("profile_picture_url")}
      /> */}

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
