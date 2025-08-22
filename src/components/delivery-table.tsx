import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
  Selection,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Key } from "@react-types/shared";
import toast from "react-hot-toast";

import { DeleteIcon, EditIcon } from "./icons/icons";

import { DELIVERY_COLUMNS } from "@/lib/constants";
import { deliveryActions } from "@/lib/store/delivery-store";
import {
  deleteDelivery,
  approveDeliveries,
} from "@/lib/services/delivery-service";
import { formatDate, transformApiResponse } from "@/lib/helpers";
import { Delivery } from "@/types";

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

  // Selection state for provider pendings page - using Selection type like PackTable
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [isApproving, setIsApproving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");

  // Check if we're on the provider pendings page
  const isProviderPendingsPage = location.pathname === "/provider-pendings";

  const handleDeleteClick = (delivery: any) => {
    setDeleteConfirmation({ isOpen: true, delivery });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation.delivery) {
      try {
        await deleteDelivery(deleteConfirmation.delivery, setIsDeleting);
        toast.success("Delivery deleted successfully");
      } catch (error) {
        toast.error(`Failed to delete delivery: ${(error as Error).message}`);
      } finally {
        setDeleteConfirmation({ isOpen: false, delivery: null });
      }
    }
  };

  const handleEdit = async (delivery: any) => {
    try {
      setIsEditing((prev) => ({ ...prev, [delivery.key]: true }));
      deliveryActions.openModal();
      deliveryActions.setFormData(delivery.original);
    } catch (error) {
      toast.error(
        `Failed to load delivery for editing: ${(error as Error).message}`
      );
    } finally {
      setIsEditing((prev) => ({ ...prev, [delivery.key]: false }));
    }
  };

  // Handle selection change - copied from PackTable pattern
  const handleSelectionChange = (keys: Selection) => {
    console.log("Selection changed:", keys);

    if (keys === "all") {
      // Select all visible rows on current page only
      const currentPageKeys = new Set(
        paginatedRows.map((row) => row.key as string)
      );
      const currentSelected = selectedKeys as Set<string>;

      console.log("Current page keys:", currentPageKeys);
      console.log("Current selected:", currentSelected);

      // Check if all current page items are already selected
      const allCurrentPageSelected = Array.from(currentPageKeys).every((key) =>
        currentSelected.has(key)
      );

      if (allCurrentPageSelected) {
        // Deselect all current page items
        const newSelection = new Set(
          Array.from(currentSelected).filter((key) => !currentPageKeys.has(key))
        );
        console.log("Deselecting all, new selection:", newSelection);
        setSelectedKeys(newSelection);
      } else {
        // Add all current page items to selection
        const newSelection = new Set([
          ...Array.from(currentSelected),
          ...Array.from(currentPageKeys),
        ]);
        console.log("Selecting all, new selection:", newSelection);
        setSelectedKeys(newSelection);
      }
    } else {
      console.log("Regular selection:", keys);
      setSelectedKeys(keys);
    }
  };

  // Calculate selected count - copied from PackTable
  const getSelectedCount = (selection: Selection): number => {
    if (selection === "all") {
      return paginatedRows.length;
    }
    const currentSelection = selection as Set<string>;
    return currentSelection.size;
  };

  const handleApprove = async () => {
    const selectedCount = getSelectedCount(selectedKeys);

    if (selectedCount === 0) {
      toast.error("Please select deliveries to approve");
      return;
    }

    setIsApproving(true);
    try {
      // Get selected delivery items
      const currentSelection = selectedKeys as Set<string>;
      const selectedDeliveries = paginatedRows.filter((row) =>
        currentSelection.has(row.key)
      );

      console.log("Approving deliveries:", selectedDeliveries);

      // Call the approve API (refresh is handled inside the service)
      const result = await approveDeliveries(selectedDeliveries);

      if (result.status === 200 || result.status === 201) {
        toast.success(
          result.ReturnMessage ||
            `Successfully approved ${selectedCount} delivery(s)`
        );
        setSelectedKeys(new Set([])); // Clear selection
      } else {
        throw new Error(result.ReturnMessage || "Failed to approve deliveries");
      }
    } catch (error) {
      console.error("Approve deliveries error:", error);
      toast.error(`Failed to approve deliveries: ${(error as Error).message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const rows = useMemo(
    () =>
      deliveries.map((delivery) => {
        const transformedDelivery = transformApiResponse(delivery);

        return {
          key: `${transformedDelivery.EntryNo}`,
          enrollee: {
            name: transformedDelivery.EnrolleeName,
            scheme: transformedDelivery.SchemeName,
          },
          startDate: formatDate(transformedDelivery.DelStartDate),
          nextDelivery: formatDate(transformedDelivery.NextDeliveryDate),
          deliveryaddress: transformedDelivery.deliveryaddress,
          frequency: transformedDelivery.DeliveryFrequency,
          status: transformedDelivery.IsDelivered ?? false,
          diagnosisname: transformedDelivery.DiagnosisLines[0]?.DiagnosisName,
          diagnosis_id: transformedDelivery.DiagnosisLines[0]?.DiagnosisId,
          procedurename: transformedDelivery.ProcedureLines[0]?.ProcedureName,
          procedureid: transformedDelivery.ProcedureLines[0]?.ProcedureId,
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

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;

    const searchLower = searchQuery.toLowerCase();

    return rows.filter(
      (row) =>
        row.enrollee.name.toLowerCase().includes(searchLower) ||
        row.enrollee.scheme.toLowerCase().includes(searchLower) ||
        row.diagnosisname.toLowerCase().includes(searchLower) ||
        row.procedurename.toLowerCase().includes(searchLower) ||
        row.pharmacyname.toLowerCase().includes(searchLower)
    );
  }, [rows, searchQuery]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredRows.length / pageSize);

  // Get items for current page
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredRows.length);

    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, currentPage, pageSize]);

  const columnsWithActions = useMemo(
    () => [
      ...DELIVERY_COLUMNS,
      { key: "cost", label: "Cost" },
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
            {/* <div className="text-sm text-gray-500">{item.enrollee.scheme}</div> */}
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
              color="default"
              isDisabled={item.status || isEditing[item.key]}
              isLoading={isEditing[item.key]}
              size="sm"
              variant="flat"
              onPress={() => handleEdit(item)}
            >
              {isEditing[item.key] ? null : <EditIcon size={14} />}
            </Button>
            <Button
              isIconOnly
              aria-label={`Delete delivery for ${item.enrollee.name}`}
              color="danger"
              isDisabled={isDeleting[item.key]}
              size="sm"
              variant="flat"
              onPress={() => handleDeleteClick(item)}
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

  const selectedCount = getSelectedCount(selectedKeys);

  if (deliveries.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No deliveries found. Create a new delivery to get started.
      </div>
    );
  }

  return (
    <>
      <Table
        aria-label="Deliveries Table"
        bottomContent={
          totalPages > 1 ? (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                page={currentPage}
                total={totalPages}
                onChange={handlePageChange}
              />
            </div>
          ) : null
        }
        className="min-w-full"
        selectionMode={isProviderPendingsPage ? "multiple" : undefined}
        selectedKeys={isProviderPendingsPage ? selectedKeys : undefined}
        onSelectionChange={
          isProviderPendingsPage ? handleSelectionChange : undefined
        }
        color="primary"
        topContent={
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                {location.pathname === "/create-delivery" && (
                  <>
                    <h3 className="text-lg font-semibold">Deliveries</h3>
                    <p className="text-sm text-gray-600">
                      Manage and track delivery status
                    </p>
                    <p className="text-xs text-gray-500">
                      Total: {filteredRows.length} deliveries
                      {searchQuery && (
                        <span> (filtered from {rows.length})</span>
                      )}
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                <Input
                  aria-label="Search deliveries"
                  className="w-full sm:w-96"
                  placeholder="Search by enrollee, diagnosis, procedure..."
                  radius="sm"
                  size="lg"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Approve Button - Only show on provider pendings page */}
            {isProviderPendingsPage && selectedCount > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedCount} delivery(s) selected
                  </span>
                  {process.env.NODE_ENV === "development" && (
                    <span className="text-xs text-gray-600">
                      Keys:{" "}
                      {selectedKeys === "all"
                        ? "all"
                        : Array.from(selectedKeys as Set<string>).join(", ")}
                    </span>
                  )}
                </div>
                <Button
                  color="primary"
                  radius="sm"
                  size="md"
                  isLoading={isApproving}
                  isDisabled={isApproving}
                  onPress={handleApprove}
                >
                  {isApproving ? "Approving..." : "Approve Selected"}
                </Button>
              </div>
            )}
          </div>
        }
      >
        <TableHeader columns={columnsWithActions}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={paginatedRows}>
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
                isLoading={
                  deleteConfirmation.delivery &&
                  isDeleting[deleteConfirmation.delivery.key]
                }
                onPress={handleDeleteConfirm}
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
