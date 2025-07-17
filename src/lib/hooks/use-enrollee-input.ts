import { useEffect, useState } from "react";
import { useChunk } from "stunk/react";
import { appChunk } from "@/lib/store/app-store";

export function useEnrolleeIdInput() {
  const [, setState] = useChunk(appChunk);
  const [enrolleeId, setEnrolleeId] = useState("");
  const [isValidId, setIsValidId] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    const validateEnrolleeId = () => {
      if (!enrolleeId.trim()) {
        setIsValidId(false);
        return;
      }
      const pattern = /^\d+\/\d+$/;
      const isValid = pattern.test(enrolleeId.trim());
      setIsValidId(isValid);

      if (isValid) {
        setFetchError("");
      }
    };

    validateEnrolleeId();
  }, [enrolleeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnrolleeId(e.target.value);
  };

  const handleBlur = () => {
    if (isValidId) {
      setState((state) => ({ ...state, enrolleeId }));
    }
  };

  return {
    enrolleeId,
    isValidId,
    fetchError,
    handleChange,
    handleBlur,
    isInvalid: enrolleeId.trim() !== "" && !isValidId || !!fetchError,
    errorMessage:
      fetchError ||
      (enrolleeId.trim() !== "" && !isValidId
        ? "ID must be a number followed by / and another number (e.g. 21000645/1)"
        : ""),
  };
}
