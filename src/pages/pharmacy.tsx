import { useEffect, useState } from "react";

import { Input } from "@heroui/input";

import SelectStates from "@/components/select-state";
import ProvidersDataTable from "@/components/providers-table";
import { useChunk, useChunkValue } from "stunk/react";
import { appChunk } from "@/lib/store/app-store";

export default function PharmacyPage() {
  const [, setState] = useChunk(appChunk);
  const [enrolleeId, setEnrolleeId] = useState("");
  const [isValidId, setIsValidId] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [isLoading, _] = useState(false);

  useEffect(() => {
    const validateEnrolleeId = () => {
      if (!enrolleeId.trim()) {
        setIsValidId(false);
        return;
      }
      const pattern = /^\d+\/0$/;
      const isValid = pattern.test(enrolleeId.trim());
      setIsValidId(isValid);

      if (isValid) {
        setFetchError("");
      }
    };

    validateEnrolleeId();
  }, [enrolleeId]);

  return (
    <section className="px-3">
      <div className="bg-white py-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Enrollee ID"
            placeholder="Enter your Enrollee ID (e.g. 2400135/0)"
            value={enrolleeId}
            radius="sm"
            size="lg"
            onChange={(e) => setEnrolleeId(e.target.value)}
            onBlur={() => setState((state) => ({ ...state, enrolleeId }))}
            isInvalid={(enrolleeId.trim() !== "" && !isValidId) || !!fetchError}
            errorMessage={
              fetchError ||
              (enrolleeId.trim() !== "" && !isValidId
                ? "ID must be a number followed by /0 (e.g. 2400135/0)"
                : "")
            }
            isDisabled={isLoading}
          />
          <SelectStates />
        </div>
      </div>
      <ProvidersDataTable />
    </section>
  );
}
