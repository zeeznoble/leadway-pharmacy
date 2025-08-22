import { useState, useEffect } from "react";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";
import { useChunk, useAsyncChunk } from "stunk/react";

import { riderFormData, riderStore } from "@/lib/store/rider-store";
import { appChunk } from "@/lib/store/app-store";
import { statesChunk } from "@/lib/store/states-store";
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
  const [_, setAppState] = useChunk(appChunk);
  const [localFormData, setLocalFormData] = useState(globalFormData);
  const { editingRider } = useChunk(riderStore)[0];

  // Local state for managing state/city selection during edit
  const [localStateId, setLocalStateId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);

  // Force load states when component mounts
  const {
    data: statesData,
    loading: statesLoading,
    reload: reloadStates,
  } = useAsyncChunk(statesChunk);

  // Initialize states loading when component mounts
  useEffect(() => {
    // Force reload states to ensure they're available
    if (!statesData && !statesLoading) {
      reloadStates();
    }
  }, [statesData, statesLoading, reloadStates]);

  // Handle editing rider initialization
  useEffect(() => {
    if (editingRider && statesData && !isInitialized && !statesLoading) {
      const states = Array.isArray(statesData) ? statesData : [];

      // Add null/undefined check for state_province
      if (editingRider.state_province) {
        const foundState = states.find(
          (state) =>
            state.Text.toLowerCase().trim() ===
            editingRider.state_province.toLowerCase().trim()
        );

        if (foundState) {
          setLocalStateId(foundState.Value);
          // Set app state for city loading with a slight delay to ensure proper sequencing
          setTimeout(() => {
            setAppState((prev) => ({
              ...prev,
              stateId: foundState.Value,
              cityId: "",
            }));
          }, 100);
        } else {
          console.warn("State not found:", editingRider.state_province);
        }
      }
      setIsInitialized(true);
    }
  }, [editingRider, statesData, statesLoading, isInitialized, setAppState]);

  // Set form ready state
  useEffect(() => {
    if (statesData && !statesLoading) {
      setIsFormReady(true);
    }
  }, [statesData, statesLoading]);

  // Sync local state when global state changes
  useEffect(() => {
    setLocalFormData(globalFormData);
  }, [globalFormData]);

  // Form validation
  const isFormValid = (data = localFormData) => {
    const requiredFields = [
      "first_name",
      "last_name",
      "email",
      "phone_number",
      "address_line1",
      "city",
      "state_province",
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
    if (onFormChange && isFormReady) {
      onFormChange(isFormValid(localFormData), localFormData);
    }
  }, [localFormData, onFormChange, isFormReady]);

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

  // Handle state change from SelectStates component
  const handleStateChange = (stateId: string, stateName: string) => {
    setLocalStateId(stateId);
    updateLocalField("state_province", stateName);
    updateGlobalField("state_province", stateName);

    // Auto-select city for Lagos Island and Lagos Mainland
    let autoSelectedCity = "";
    if (stateId === "72") {
      autoSelectedCity = "Lagos Island";
    } else if (stateId === "73") {
      autoSelectedCity = "Lagos Mainland";
    }

    if (autoSelectedCity) {
      // Set the auto-selected city
      updateLocalField("city", autoSelectedCity);
      updateGlobalField("city", autoSelectedCity);
      console.log("Auto-selected city:", autoSelectedCity);
    } else {
      // Clear city when state changes (for other states)
      updateLocalField("city", "");
      updateGlobalField("city", "");
    }

    // Update app state for city component with proper timing
    setTimeout(() => {
      setAppState((prev) => ({
        ...prev,
        stateId: stateId,
        cityId: "",
      }));
      console.log("App state updated for cities:", stateId);
    }, 50);
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
  }, [localFormData.country]);

  // Reset initialization when modal closes (editingRider becomes null)
  useEffect(() => {
    if (!editingRider) {
      setIsInitialized(false);
      setLocalStateId("");
      setIsFormReady(false);
      // Small delay to ensure clean state
      setTimeout(() => {
        setIsFormReady(true);
      }, 100);
    }
  }, [editingRider]);

  // Show loading state while states are loading
  if (statesLoading || !isFormReady) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3 text-center py-8">
          <p>Loading form data...</p>
        </div>
      </div>
    );
  }

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
        label="Country"
        value="Nigeria"
        isReadOnly
        isRequired
        className="bg-gray-50"
      />

      <div>
        <SelectStates
          value={localStateId}
          onChange={handleStateChange}
          isRequired
        />
        {statesLoading && (
          <p className="text-xs text-gray-500 mt-1">Loading states...</p>
        )}
      </div>

      <div>
        <SelectCities
          stateId={localStateId}
          onCityChange={handleCityChange}
          selectedCityName={localFormData.city}
        />
      </div>

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
        value={localFormData.license_number || ""}
        onChange={(e) => updateLocalField("license_number", e.target.value)}
        onBlur={() => handleBlur("license_number")}
      />

      <DatePicker
        label="License Expiry Date"
        value={parseDateString(localFormData.license_expiry_date)}
        onChange={(date) => handleDateChange("license_expiry_date", date)}
        showMonthAndYearPickers
        minValue={parseDate(new Date().toISOString().split("T")[0])}
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

      <div className="md:col-span-3">
        <Textarea
          label="Notes"
          placeholder="Enter additional notes"
          value={localFormData.notes}
          onChange={(e) => updateLocalField("notes", e.target.value)}
          onBlur={() => handleBlur("notes")}
        />
      </div>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="md:col-span-3 text-xs text-gray-400 border-t pt-2">
          <p>
            Debug: State ID: {localStateId}, State Name:{" "}
            {localFormData.state_province}, City: {localFormData.city}
          </p>
          <p>
            States loaded: {statesData ? "Yes" : "No"}, Editing:{" "}
            {editingRider ? "Yes" : "No"}
          </p>
        </div>
      )}
    </div>
  );
}
