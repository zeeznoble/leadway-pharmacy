import { useNavigate } from "react-router-dom";

import { Button } from "@heroui/button";

import EnrolleeDetails from "@/components/enrollee-details";
import BenefitDataTable from "@/components/benefits/benefit-list";

export default function BenefitsPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4 p-6 font-inter">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <img src="/leadway-logo.png" alt="Leadway" className="w-48 mx-auto" />
          <h2 className="text-3xl font-semibold mt-10">
            See Enrollment Benefits
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            Enter your Enrollee ID below and select your state to retrieve your
            records.
          </p>
        </div>

        <EnrolleeDetails />

        <BenefitDataTable />
        <div className="flex justify-center mt-4">
          <Button onPress={() => navigate("/")}>Go back</Button>
        </div>
      </div>
    </div>
  );
}
