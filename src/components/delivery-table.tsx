import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@heroui/table";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { useState, useMemo } from "react";
import { Key } from "@react-types/shared";
import toast from "react-hot-toast";

import { DeleteIcon, EditIcon } from "./icons/icons";
import { DELIVERY_COLUMNS } from "@/lib/constants";

import { deliveryActions } from "@/lib/store/delivery-store";
import { deleteDelivery } from "@/lib/services/delivery-service";

import { formatDate, transformApiResponse } from "@/lib/helpers";

import { Delivery } from "@/types";
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";

interface DeliveryTableProps {
  deliveries: Delivery[];
}

interface RowItem {
  key: string;
  enrollee: {
    name: string;
    scheme: string;
  };
  startDate: string;
  nextDelivery: string;
  frequency: string;
  status: boolean;
  diagnosisname: string;
  diagnosis_id: string;
  procedurename: string;
  procedureid: string;
  pharmacyname: string;
  pharmacyid: number;
  actions: {
    isDelivered: boolean;
  };
  original: any;
  cost: string;
}

export default function DeliveryTable({ deliveries }: DeliveryTableProps) {
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    delivery: any | null;
  }>({ isOpen: false, delivery: null });

  const handleDeleteClick = (delivery: any) => {
    setDeleteConfirmation({ isOpen: true, delivery });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation.delivery) {
      try {
        await deleteDelivery(deleteConfirmation.delivery, setIsDeleting);
        toast.success("Delivery deleted successfully");
      } catch (error) {
        toast.error("Failed to delete delivery");
      } finally {
        setDeleteConfirmation({ isOpen: false, delivery: null });
      }
    }
  };

  const handleEdit = async (delivery: any) => {
    try {
      setIsEditing((prev) => ({ ...prev, [delivery.key]: true }));
      deliveryActions.openModal();
      console.log("Editing delivery.original:", delivery.original); // Debug log
      deliveryActions.setFormData(delivery.original);
    } catch (error) {
      toast.error("Failed to load delivery for editing");
    } finally {
      setIsEditing((prev) => ({ ...prev, [delivery.key]: false }));
    }
  };

  const rows = useMemo(
    () =>
      deliveries.map((delivery) => {
        const transformedDelivery = transformApiResponse(delivery);

        console.log("Delivery", delivery);
        return {
          key: `${transformedDelivery.EntryNo}`,
          enrollee: {
            name: transformedDelivery.EnrolleeName || "N/A",
            scheme: transformedDelivery.SchemeName || "N/A",
          },
          startDate: formatDate(transformedDelivery.DelStartDate),
          nextDelivery: formatDate(transformedDelivery.NextDeliveryDate),
          frequency: transformedDelivery.DeliveryFrequency || "N/A",
          status: transformedDelivery.IsDelivered ?? false,
          diagnosisname:
            transformedDelivery.DiagnosisLines[0]?.DiagnosisName || "N/A",
          diagnosis_id:
            transformedDelivery.DiagnosisLines[0]?.DiagnosisId || "N/A",
          procedurename:
            transformedDelivery.ProcedureLines[0]?.ProcedureName || "N/A",
          procedureid:
            transformedDelivery.ProcedureLines[0]?.ProcedureId || "N/A",
          actions: {
            isDelivered: transformedDelivery.IsDelivered ?? false,
          },
          pharmacyid: transformedDelivery.Pharmacyid || 0,
          pharmacyname: transformedDelivery.PharmacyName || "",
          cost: transformedDelivery.cost || "",

          original: transformedDelivery,
        };
      }),
    [deliveries]
  );

  console.log(rows);

  const columnsWithActions = useMemo(
    () => [
      ...DELIVERY_COLUMNS,
      {
        key: "actions",
        label: "Actions",
      },
    ],
    []
  );

  const renderCell = (item: RowItem, columnKey: Key): React.ReactNode => {
    switch (columnKey) {
      case "enrollee":
        return (
          <div className="flex flex-col">
            <div className="text-md font-medium">{item.enrollee.name}</div>
            <div className="text-sm text-gray-500">{item.enrollee.scheme}</div>
          </div>
        );
      case "status":
        return (
          <Badge color={item.status ? "success" : "warning"}>
            {item.status ? "Delivered" : "Pending"}
          </Badge>
        );
      case "actions":
        return (
          <div className="flex gap-2">
            <Button
              isIconOnly
              aria-label={`Edit delivery for ${item.enrollee.name}`}
              onPress={() => handleEdit(item)}
              isDisabled={item.status || isEditing[item.key]} // Disable if delivered or loading
              isLoading={isEditing[item.key]}
              color="default"
              variant="flat"
              size="sm"
            >
              {isEditing[item.key] ? null : <EditIcon size={14} />}
            </Button>
            <Button
              isIconOnly
              aria-label={`Delete delivery for ${item.enrollee.name}`}
              onPress={() => handleDeleteClick(item)}
              isDisabled={isDeleting[item.key]}
              color="danger"
              variant="flat"
              size="sm"
            >
              {isDeleting[item.key] ? (
                <span className="text-sm">...</span>
              ) : (
                <DeleteIcon size={14} />
              )}
            </Button>
          </div>
        );
      case "diagnosisname":
        return <span>{item.diagnosisname}</span>;
      case "diagnosis_id":
        return <span className="text-gray-500">{item.diagnosis_id}</span>;
      case "procedurename":
        return <span>{item.procedurename}</span>;
      case "procedureid":
        return <span className="text-gray-500">{item.procedureid}</span>;
      case "pharmacyname":
        return <span className="text-gray-500">{item.pharmacyname}</span>;
      case "pharmacyid":
        return <span className="text-gray-500">{item.pharmacyid}</span>;
      case "cost":
        return <span className="text-gray-500">{item.cost}</span>;
      default:
        return getKeyValue(item, columnKey);
    }
  };

  if (deliveries.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No deliveries found. Create a new delivery to get started.
      </div>
    );
  }

  return (
    <>
      <Table aria-label="Deliveries Table" className="min-w-full">
        <TableHeader columns={columnsWithActions}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={rows}>
          {(item) => (
            <TableRow key={item.key}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
      >
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            <p className="text-gray-700">
              Are you sure you want to delete this delivery for{" "}
              <span className="font-semibold">
                {deleteConfirmation.delivery?.enrollee.name || "this enrollee"}?
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-2 justify-end">
              <Button
                color="default"
                variant="light"
                onPress={() =>
                  setDeleteConfirmation({ isOpen: false, delivery: null })
                }
              >
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={handleDeleteConfirm}
                isLoading={
                  deleteConfirmation.delivery &&
                  isDeleting[deleteConfirmation.delivery.key]
                }
              >
                {deleteConfirmation.delivery &&
                isDeleting[deleteConfirmation.delivery.key]
                  ? "Deleting..."
                  : "Delete"}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
