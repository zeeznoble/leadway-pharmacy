import { useNavigate } from "react-router-dom";

import { useChunkValue } from "stunk/react";

import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";

import { appChunk } from "@/lib/store/app-store";

export default function EnrolleeDetails() {
  const appState = useChunkValue(appChunk);
  const { enrolleeId, enrolleeData } = appState;
  const navigate = useNavigate();

  if (!enrolleeData) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            No Enrollee Data Found{" "}
          </CardHeader>
          <CardBody className="flex flex-col items-center">
            <p className="text-gray-600 mb-6">
              Please enter an enrollee ID to view details.
            </p>
            <Button color="primary" onPress={() => navigate("/")} size="lg">
              Go Back
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const fullName = [
    enrolleeData.Member_FirstName,
    enrolleeData.Member_othernames,
    enrolleeData.Member_Surname,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card className="w-full max-w-[87rem] mb-6 mx-auto" shadow="none">
      <CardHeader className="border-b pb-3">
        <div className="flex justify-between items-center w-[100%]">
          <h2 className="text-xl font-medium">Enrollee Information</h2>
          <Chip color="success" className="text-white">
            {enrolleeData.Member_MemberStatus_Description}
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm text-gray-500 font-medium mb-1">
              Full Name
            </h3>
            <p className="text-medium font-semibold">{fullName}</p>
          </div>

          <div>
            <h3 className="text-sm text-gray-500 font-medium mb-1">
              Enrollee ID
            </h3>
            <p className="text-medium font-semibold">{enrolleeId}</p>
          </div>

          <div>
            <h3 className="text-sm text-gray-500 font-medium mb-1">Plan</h3>
            <p className="text-medium">{enrolleeData.Plan_Category}</p>
          </div>

          <div>
            <h3 className="text-sm text-gray-500 font-medium mb-1">
              Entry Date
            </h3>
            <p className="text-medium">
              {new Date(enrolleeData.Member_Entry_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
