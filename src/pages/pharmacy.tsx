import { Input } from "@heroui/input";

import SelectStates from "@/components/select-state";
import PharmacyDataTable from "@/components/pharmacy-table";

import { useEnrolleeIdInput } from "@/lib/hooks/use-enrollee-input";

export default function PharmacyPage() {
  const { enrolleeId, handleChange, handleBlur, isInvalid, errorMessage } =
    useEnrolleeIdInput();

  return (
    <section className="py-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Input
          label="Enrollee ID"
          placeholder="Enter your Enrollee ID (e.g. 2400135/0)"
          value={enrolleeId}
          radius="sm"
          size="lg"
          onChange={handleChange}
          onBlur={handleBlur}
          isInvalid={isInvalid}
          errorMessage={errorMessage}
          isDisabled={false}
        />
        <SelectStates />
      </div>
      <PharmacyDataTable />
    </section>
  );
}
