import { useChunkValue } from "stunk/react";

import { useNavigate } from "react-router-dom";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import SelectStates from "@/components/providers/select-states";
import SelectDiscipline from "@/components/providers/select-discipline";
import ProvidersDataTable from "@/components/providers/provider-list";
import EnrolleeDetails from "@/components/enrollee-details";

import { appChunk } from "@/lib/store/app-store";

export default function ProvidersPage() {
  const state = useChunkValue(appChunk);

  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 p-6 font-inter">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <img src="/leadway-logo.png" alt="Leadway" className="w-48 mx-auto" />
          <h2 className="text-3xl font-semibold mt-10">
            See Enrollment Hospital Access
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            Enter your Enrollee ID below and select your state to retrieve your
            records.
          </p>
        </div>

        <EnrolleeDetails />

        <div className="bg-white p-6 rounded-lg max-w-[88rem] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Enrollee ID"
              placeholder="Enter your Enrollee ID"
              value={state.enrolleeId}
              radius="sm"
              size="lg"
              isDisabled
            />
            <SelectStates />
            <SelectDiscipline />
          </div>
        </div>
        <ProvidersDataTable />
        <div className="flex justify-center mt-4">
          <Button onPress={() => navigate("/")}>Go back</Button>
        </div>
      </div>
    </div>
  );
}
