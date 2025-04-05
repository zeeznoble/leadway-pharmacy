import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { fetchInfoAndRoute } from "@/lib/helpers";

export default function Index() {
  const navigate = useNavigate();

  const [enrolleeId, setEnrolleeId] = useState("");
  const [isValidId, setIsValidId] = useState(false);
  const [isLoadingPro, setIsLoadingPro] = useState(false);
  const [isLoadingBen, setIsLoadingBen] = useState(false);
  const [fetchError, setFetchError] = useState("");

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

  const handleProviderFetch = async (path: string) => {
    if (!isValidId) return;

    setIsLoadingPro(true);
    setFetchError("");

    fetchInfoAndRoute({
      enrolleeId,
      navigate: (path) => navigate(path),
      path,
      setFetchError,
      setLoading: setIsLoadingPro,
    });
  };

  const handleBenefitsFetch = async (path: string) => {
    if (!isValidId) return;

    setIsLoadingBen(true);
    setFetchError("");

    fetchInfoAndRoute({
      enrolleeId,
      navigate: (path) => navigate(path),
      path,
      setFetchError,
      setLoading: setIsLoadingBen,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <img
          src="/leadway-logo.png"
          alt="Leadway"
          className="w-48 mx-auto mb-6"
        />
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Health Insurance Portal
        </h2>

        <div className="mb-4">
          <Input
            label="Enrollee ID"
            placeholder="Enter your Enrollee ID (e.g. 2400135/0)"
            value={enrolleeId}
            radius="sm"
            size="lg"
            onChange={(e) => setEnrolleeId(e.target.value)}
            isInvalid={(enrolleeId.trim() !== "" && !isValidId) || !!fetchError}
            errorMessage={
              fetchError ||
              (enrolleeId.trim() !== "" && !isValidId
                ? "ID must be a number followed by /0 (e.g. 2400135/0)"
                : "")
            }
            isDisabled={isLoadingPro}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center">
          <Button
            color="primary"
            className="font-semibold"
            size="lg"
            radius="sm"
            fullWidth
            isDisabled={!isValidId || isLoadingPro}
            isLoading={isLoadingPro}
            onPress={() => handleProviderFetch("/providers")}
          >
            {isLoadingPro ? "Validating..." : "Check Providers"}
          </Button>
          <Button
            color="warning"
            className="font-semibold text-white"
            size="lg"
            fullWidth
            radius="sm"
            isDisabled={!isValidId || isLoadingBen}
            isLoading={isLoadingBen}
            onPress={() => handleBenefitsFetch("/benefits")}
          >
            {isLoadingBen ? "Validating..." : "Check Benefits"}
          </Button>
        </div>
      </div>
    </div>
  );
}
