import { useEffect, useState } from "react";

import { Input } from "@hero-ui/input";
import { Select, SelectItem } from "@hero-ui/select";

export default function EnroleeSearch() {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [enroleeId, setEnroleeId] = useState("");

  useEffect(() => {
    async function fetchStates() {
      try {
        const response = await fetch("https://api.example.com/states"); // Replace with actual API
        const data = await response.json();
        setStates(data.states);
      } catch (error) {
        console.error("Failed to fetch states", error);
      }
    }
    fetchStates();
  }, []);

  return (
    <div className="flex flex-col gap-4 justify-center items-center h-screen">
      <div className="container mx-auto max-w-[400px] text-center">
        <img src="/leadway-logo.png" alt="Leadway" className="w-40 mx-auto" />
        <h2 className="text-3xl font-semibold">Find Your Enrolment Details</h2>
        <p className="text-gray-600 text-sm mt-2">
          Enter your Enrolee ID below and select your state to retrieve your
          records.
        </p>

        <div className="mt-6 space-y-4">
          <Input
            label="Enrolee ID"
            placeholder="Enter your Enrolee ID"
            value={enroleeId}
            onChange={(e) => setEnroleeId(e.target.value)}
          />

          <Select
            label="Select State"
            value={selectedState}
            onChange={setSelectedState}
          >
            {states.map((state) => (
              <SelectItem key={state.id} value={state.name}>
                {state.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
