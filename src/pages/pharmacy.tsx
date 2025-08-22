import { Input } from "@heroui/input";

import SelectStates from "@/components/select-state";
import PharmacyDataTable from "@/components/pharmacy-table";
import { useEnrolleeSearch } from "@/lib/hooks/use-enrollee-search";

export default function PharmacyPage() {
  const { searchCriteria, handleChange, handleBlur, validation } =
    useEnrolleeSearch();

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Input
          label="Enrollee ID"
          placeholder="Enter Enrollee ID (e.g. 2400135/0)"
          value={searchCriteria.enrolleeId}
          name="enrolleeId"
          radius="sm"
          onChange={handleChange}
          onBlur={handleBlur}
          isInvalid={validation.enrolleeId.isInvalid}
          errorMessage={validation.enrolleeId.errorMessage}
          isDisabled={false}
        />
        <SelectStates />
      </div>
      <PharmacyDataTable />
    </section>
  );
}
