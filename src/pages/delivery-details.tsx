import { useParams, useNavigate } from "react-router-dom";

import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";

import { useChunkValue } from "stunk/react";

import { deliveryStore } from "@/lib/store/delivery-store";
import { formatDate } from "@/lib/helpers";

export default function DeliveryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deliveries } = useChunkValue(deliveryStore);

  const delivery = deliveries.find((d) => d.EntryNo?.toString() === id);

  if (!delivery) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardBody className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Delivery Not Found</h2>
            <p className="text-gray-500 mb-6">
              The requested delivery record could not be found.
            </p>
            <Button onPress={() => navigate("/create-delivery")}>
              Back to Deliveries
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Delivery Details</h1>
        <Button variant="flat" onPress={() => navigate("/create-delivery")}>
          Back to Deliveries
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex justify-between items-center">
            Delivery Information
            <Badge color={delivery.IsDelivered ? "success" : "warning"}>
              {delivery.IsDelivered ? "Delivered" : "Pending"}
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-gray-500 mb-1">
                  Delivery ID
                </h3>
                <p>{delivery.DeliveryId || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 mb-1">
                  Created By
                </h3>
                <p>{delivery.Username || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 mb-1">
                  Start Date
                </h3>
                <p>{formatDate(delivery.DelStartDate)}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 mb-1">
                  Next Delivery Date
                </h3>
                <p>{formatDate(delivery.NextDeliveryDate)}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 mb-1">
                  Frequency
                </h3>
                <p>{delivery.DeliveryFrequency || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 mb-1">
                  Duration
                </h3>
                <p>{delivery.FrequencyDuration || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 mb-1">
                  End Date
                </h3>
                <p>{formatDate(delivery.EndDate)}</p>
              </div>
            </div>

            {delivery.AdditionalInformation && (
              <div className="mt-6">
                <h3 className="font-semibold text-sm text-gray-500 mb-2">
                  Additional Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p>{delivery.AdditionalInformation}</p>
                </div>
              </div>
            )}
          </CardBody>
          {!delivery.IsDelivered && (
            <CardFooter className="flex justify-end">
              <Button color="primary">Mark as Delivered</Button>
            </CardFooter>
          )}
        </Card>

        {/* Enrollee Card */}
        <Card>
          <CardHeader>Enrollee Information</CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-500 mb-1">
                  Name
                </h3>
                <p className="font-medium">{delivery.EnrolleeName || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 mb-1">ID</h3>
                <p>{delivery.EnrolleeId || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 mb-1">
                  Age
                </h3>
                <p>{delivery.EnrolleeAge || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 mb-1">
                  Scheme
                </h3>
                <p>{delivery.SchemeName || "N/A"}</p>
              </div>
              {delivery.SchemeId && (
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-1">
                    Scheme ID
                  </h3>
                  <p>{delivery.SchemeId}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Diagnosis and Procedures Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Diagnosis Card */}
        <Card>
          <CardHeader>Diagnosis</CardHeader>
          <CardBody>
            {delivery.DiagnosisLines && delivery.DiagnosisLines.length > 0 ? (
              <ul className="space-y-3">
                {delivery.DiagnosisLines.map((diagnosis, index) => (
                  <li
                    key={diagnosis.DiagnosisId || index}
                    className="bg-gray-50 p-3 rounded-md"
                  >
                    <div className="font-medium">{diagnosis.DiagnosisName}</div>
                    <div className="text-sm text-gray-500">
                      {diagnosis.DiagnosisId}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">
                No diagnosis information available
              </p>
            )}
          </CardBody>
        </Card>

        {/* Procedures Card */}
        <Card>
          <CardHeader>Procedures</CardHeader>
          <CardBody>
            {delivery.ProcedureLines && delivery.ProcedureLines.length > 0 ? (
              <ul className="space-y-3">
                {delivery.ProcedureLines.map((procedure, index) => (
                  <li
                    key={procedure.ProcedureId || index}
                    className="bg-gray-50 p-3 rounded-md flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">
                        {procedure.ProcedureName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {procedure.ProcedureId}
                      </div>
                    </div>
                    <Badge variant="flat" className="ml-2">
                      Qty: {procedure.ProcedureQuantity || 1}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">
                No procedure information available
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
