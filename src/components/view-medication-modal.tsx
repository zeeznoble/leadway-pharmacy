import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Spinner } from "@heroui/spinner";
import toast from "react-hot-toast";

// Import the API service directly, not through the store
import { API_URL, formatDate, transformApiResponse } from "@/lib/helpers";
import type { Delivery } from "@/types";

interface ViewAllMedicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrolleeId: string;
  enrolleeName: string;
  user?: any; // Add user prop to get UserName
}

interface MedicationRow {
  key: string;
  nextDeliveryDate: string;
  status: string;
  procedureName: string;
  diagnosisName: string;
  frequency: string;
  original: any;
}

const columns = [
  { key: "nextDeliveryDate", label: "Next Delivery Date" },
  { key: "status", label: "Delivery Status" },
  { key: "procedureName", label: "Procedure Name" },
  { key: "diagnosisName", label: "Diagnosis Name" },
  { key: "frequency", label: "Frequency" },
];

export default function ViewAllMedicationsModal({
  isOpen,
  onClose,
  enrolleeId,
  enrolleeName,
  user,
}: ViewAllMedicationsModalProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create an independent fetch function that doesn't use the store
  const fetchAllMedicationsIndependent = async () => {
    if (!enrolleeId || !user?.UserName) {
      setError("Missing enrollee ID or user information");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = `${API_URL}/PharmacyDelivery/GetTracking?username=${encodeURIComponent(user.UserName)}&enrolleeId=${encodeURIComponent(enrolleeId)}&ACTIONTYPE=&FromDate=&Todate=&DeliveryStatus=`;

      console.log("Fetching all medications from:", apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Independent medications API response:", data);

      if (data?.result && Array.isArray(data.result)) {
        setDeliveries(data.result);
        if (data.result.length === 0) {
          setError("No medications found for this enrollee");
        }
      } else {
        setError("No medications found for this enrollee");
        setDeliveries([]);
      }
    } catch (err) {
      console.error("Error fetching all medications:", err);
      setError("Failed to load medications");
      toast.error("Failed to load all medications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && enrolleeId && user?.UserName) {
      fetchAllMedicationsIndependent();
    }
  }, [isOpen, enrolleeId, user?.UserName]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDeliveries([]);
      setError(null);
    }
  }, [isOpen]);

  const medicationRows: MedicationRow[] = deliveries.map((delivery, index) => {
    const transformedDelivery = transformApiResponse(delivery);
    const uniqueKey = `${transformedDelivery.EntryNo || index}-${Date.now()}-${Math.random()}`;

    return {
      key: uniqueKey,
      nextDeliveryDate: formatDate(transformedDelivery.NextDeliveryDate),
      status: transformedDelivery.Status || "Pending",
      procedureName:
        transformedDelivery.ProcedureLines[0]?.ProcedureName || "N/A",
      diagnosisName:
        transformedDelivery.DiagnosisLines[0]?.DiagnosisName || "N/A",
      frequency: transformedDelivery.DeliveryFrequency || "N/A",
      original: transformedDelivery,
    };
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "success";
      case "packed":
        return "primary";
      case "pending":
      case "approved":
        return "warning";
      case "cancelled":
      case "failed":
        return "danger";
      default:
        return "default";
    }
  };

  const renderCell = (
    item: MedicationRow,
    columnKey: React.Key
  ): React.ReactNode => {
    switch (columnKey) {
      case "nextDeliveryDate":
        return <span className="text-sm">{item.nextDeliveryDate}</span>;
      case "status":
        return <Badge color={getStatusColor(item.status)}>{item.status}</Badge>;
      case "procedureName":
        return <span className="text-sm">{item.procedureName}</span>;
      case "diagnosisName":
        return <span className="text-sm">{item.diagnosisName}</span>;
      case "frequency":
        return <span className="text-sm">{item.frequency}</span>;
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      size="4xl"
      backdrop="blur"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2>All Medications</h2>
          <p className="text-sm text-gray-600 font-normal">
            Enrollee: {enrolleeName} (ID: {enrolleeId})
          </p>
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Spinner color="primary" size="lg" />
              <p className="mt-4 text-gray-600">Loading all medications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button
                color="primary"
                radius="sm"
                onPress={fetchAllMedicationsIndependent}
              >
                Retry
              </Button>
            </div>
          ) : medicationRows.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Total medications: {medicationRows.length}
              </div>
              <Table isStriped isCompact aria-label="All Medications Table">
                <TableHeader columns={columns}>
                  {(column) => (
                    <TableColumn key={column.key}>{column.label}</TableColumn>
                  )}
                </TableHeader>
                <TableBody items={medicationRows}>
                  {(item) => (
                    <TableRow key={item.key}>
                      {(columnKey) => (
                        <TableCell>{renderCell(item, columnKey)}</TableCell>
                      )}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No medications found for this enrollee.</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="default" radius="sm" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
