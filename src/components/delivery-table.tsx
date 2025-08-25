import { useState, useMemo, useEffect } from "react";
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
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Key } from "@react-types/shared";
import toast from "react-hot-toast";

import { DeleteIcon, EditIcon } from "./icons/icons";

import { DELIVERY_COLUMNS } from "@/lib/constants";
import { deliveryActions } from "@/lib/store/delivery-store";
import {
  deleteDelivery,
  approveDeliveries,
  createClaimRequests,
} from "@/lib/services/delivery-service";
import { formatDate, transformApiResponse } from "@/lib/helpers";
import { Delivery } from "@/types";

interface DeliveryTableProps {
  deliveries: Delivery[];
  isLoading?: boolean;
  onSearch?: (
    searchTerm: string,
    searchType?: "enrollee" | "pharmacy" | "address"
  ) => void;
  currentSearchTerm?: string;
  currentSearchType?: "enrollee" | "pharmacy" | "address";
}

interface RowItem {
  key: string;
  enrollee: {
    name: string;
    scheme: string;
  };
  startDate: string;
  deliveryaddress: string;
  nextDelivery: string;
  frequency: string;
  status: string;
  diagnosisname: string;
  procedurename: string;
  pharmacyname: string;
  recipientcode?: string;
  actions: {
    isDelivered: boolean;
  };
  original: any;
  cost: string;
}

export default function DeliveryTable({
  deliveries,
  isLoading = false,
  onSearch,
  currentSearchTerm = "",
  currentSearchType = "enrollee",
}: DeliveryTableProps) {
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    delivery: any | null;
  }>({ isOpen: false, delivery: null });

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [isApproving, setIsApproving] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Search functionality - initialize with current values from parent
  const [searchTerm, setSearchTerm] = useState(currentSearchTerm);
  const [searchType, setSearchType] = useState<
    "enrollee" | "pharmacy" | "address"
  >(currentSearchType);

  // Update local state when parent props change
  useEffect(() => {
    setSearchTerm(currentSearchTerm);
    setSearchType(currentSearchType);
  }, [currentSearchTerm, currentSearchType]);

  const isProviderPendingsPage = location.pathname === "/provider-pendings";
  const isSentForDeliveryPage = location.pathname === "/sent-for-delivery";

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

  const handleSelectionChange = (keys: Selection) => {
    console.log("Selection changed:", keys);

    if (keys === "all") {
      const currentPageKeys = new Set(
        paginatedRows.map((row) => row.key as string)
      );
      const currentSelected = selectedKeys as Set<string>;

      const allCurrentPageSelected = Array.from(currentPageKeys).every((key) =>
        currentSelected.has(key)
      );

      if (allCurrentPageSelected) {
        const newSelection = new Set(
          Array.from(currentSelected).filter((key) => !currentPageKeys.has(key))
        );
        console.log("Deselecting all, new selection:", newSelection);
        setSelectedKeys(newSelection);
      } else {
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

  // Calculate selected count
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

  const handleClaimLines = async () => {
    const selectedCount = getSelectedCount(selectedKeys);

    if (selectedCount === 0) {
      toast.error("Please select deliveries to create claims");
      return;
    }

    setIsClaiming(true);
    try {
      // Get selected delivery items from all rows (not just current page)
      const currentSelection = selectedKeys as Set<string>;

      // Find all selected deliveries across all pages
      const allSelectedDeliveries = rows.filter((row) =>
        currentSelection.has(row.key)
      );

      console.log("Creating claims for deliveries:", allSelectedDeliveries);

      // Call the create claims API
      const result = await createClaimRequests(allSelectedDeliveries);

      if (result.status === 200 || result.status === 201) {
        // Show detailed success message
        if (result.Claims && result.Claims.length > 0) {
          const successfulClaims = result.Claims.filter(
            (claim: any) => claim.Status === "Success"
          );
          const failedClaims = result.Claims.filter(
            (claim: any) => claim.Status !== "Success"
          );

          if (successfulClaims.length > 0) {
            // Show success toast with claim numbers
            const claimNumbers = successfulClaims
              .map((claim: any) => claim.ClaimNo)
              .join(", ");
            toast.success(
              `Successfully created ${successfulClaims.length} claim(s)\nClaim Numbers: ${claimNumbers}`,
              {
                duration: 6000,
                style: {
                  maxWidth: "500px",
                },
              }
            );
          }

          if (failedClaims.length > 0) {
            // Show warning for failed claims
            const failureMessages = failedClaims
              .map((claim: any) => `${claim.ClaimNo}: ${claim.Message}`)
              .join("\n");
            toast.error(
              `${failedClaims.length} claim(s) failed:\n${failureMessages}`,
              {
                duration: 8000,
                style: {
                  maxWidth: "500px",
                },
              }
            );
          }
        } else {
          // Fallback success message
          toast.success(
            result.ReturnMessage ||
              `Successfully created claims for ${selectedCount} delivery(s)`,
            { duration: 4000 }
          );
        }

        setSelectedKeys(new Set([])); // Clear selection
      } else {
        throw new Error(result.ReturnMessage || "Failed to create claims");
      }
    } catch (error) {
      console.error("Create claims error:", error);
      toast.error(`Failed to create claims: ${(error as Error).message}`, {
        duration: 6000,
        style: {
          maxWidth: "500px",
        },
      });
    } finally {
      setIsClaiming(false);
    }
  };

  // Search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchTypeChange = (value: string) => {
    setSearchType(value as "enrollee" | "pharmacy" | "address");
    setSearchTerm("");
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setSelectedKeys(new Set([]));
    if (onSearch) {
      onSearch(searchTerm, searchType);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    setSelectedKeys(new Set([]));
    setSearchType("enrollee");
    if (onSearch) {
      onSearch("", "enrollee");
    }
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
          deliveryaddress: transformedDelivery.deliveryaddress || "",
          frequency: transformedDelivery.DeliveryFrequency,
          recipentcode: transformedDelivery.recipientcode,
          status: transformedDelivery.Status || "Pending",
          diagnosisname: transformedDelivery.DiagnosisLines[0]?.DiagnosisName,
          procedurename: transformedDelivery.ProcedureLines[0]?.ProcedureName,
          actions: {
            isDelivered: transformedDelivery.IsDelivered ?? false,
          },
          pharmacyname: transformedDelivery.PharmacyName || "",
          cost: transformedDelivery.cost || "",
          original: transformedDelivery,
        };
      }),
    [deliveries]
  );

  // Filter rows based on search (local filtering when needed)
  const filteredRows = useMemo(() => {
    // If onSearch is provided and it's an enrollee search, don't filter locally
    if (onSearch && searchType === "enrollee") {
      return rows;
    }

    // For pharmacy and address searches, or when no onSearch prop, filter locally
    if (!searchTerm.trim()) return rows;

    const searchTermLower = searchTerm.toLowerCase();

    return rows.filter((row) => {
      switch (searchType) {
        case "pharmacy":
          return row.pharmacyname.toLowerCase().includes(searchTermLower);
        case "address":
          return row.deliveryaddress.toLowerCase().includes(searchTermLower);
        case "enrollee":
          return (
            row.enrollee.name.toLowerCase().includes(searchTermLower) ||
            row.key.toLowerCase().includes(searchTermLower)
          );
        default:
          return true;
      }
    });
  }, [rows, searchType, searchTerm, onSearch]);

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
          </div>
        );
      case "deliveryaddress":
        return <span className="text-sm">{item.deliveryaddress || "N/A"}</span>;
      case "status":
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

        return <Badge color={getStatusColor(item.status)}>{item.status}</Badge>;
      case "isDelivered":
        return (
          <Badge color={item.actions.isDelivered ? "success" : "warning"}>
            {item.actions.isDelivered ? "Yes" : "No"}
          </Badge>
        );
      case "actions":
        return (
          <div className="flex gap-2">
            <Button
              isIconOnly
              aria-label={`Edit delivery for ${item.enrollee.name}`}
              color="default"
              isDisabled={item.actions.isDelivered || isEditing[item.key]}
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
      case "procedurename":
        return <span>{item.procedurename}</span>;
      case "pharmacyname":
        return <span className="text-gray-500">{item.pharmacyname}</span>;
      case "cost":
        return <span className="text-gray-500">{item.cost}</span>;
      default:
        return getKeyValue(item, columnKey);
    }
  };

  const selectedCount = getSelectedCount(selectedKeys);

  const getSearchPlaceholder = (searchType: string): string => {
    switch (searchType) {
      case "enrollee":
        return "Search by Enrollee ID or Name";
      case "pharmacy":
        return "Search by Pharmacy Name";
      case "address":
        return "Search by Region";
      default:
        return "Search...";
    }
  };

  const showNoResults =
    !isLoading && filteredRows.length === 0 && searchTerm.trim() !== "";

  // Modified condition: only show initial message when there are no deliveries AND no search term AND not loading
  // But we want to always show the search UI unless it's the very initial empty state
  const showInitialMessage =
    !isLoading && deliveries.length === 0 && !searchTerm && !currentSearchTerm;

  // Always show search UI unless it's the very initial empty state
  const shouldShowSearchUI = !showInitialMessage;

  if (showInitialMessage) {
    return (
      <div className="text-center p-8 text-gray-500">
        No deliveries found. Create a new delivery to get started.
      </div>
    );
  }

  return (
    <>
      {/* Search Section - Always show unless it's the initial empty state */}
      {shouldShowSearchUI && (
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex w-full sm:w-auto items-center flex-1 gap-2">
              <Select
                aria-label="search-type"
                className="w-48"
                placeholder="Search by"
                selectedKeys={[searchType]}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  handleSearchTypeChange(key);
                }}
                radius="sm"
              >
                <SelectItem key="enrollee">Enrollee ID</SelectItem>
                <SelectItem key="pharmacy">Pharmacy</SelectItem>
                <SelectItem key="address">Region</SelectItem>
              </Select>
              <Input
                className="flex-1"
                placeholder={getSearchPlaceholder(searchType)}
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyUp={handleKeyPress}
                radius="sm"
              />

              <Button
                color="primary"
                radius="sm"
                onPress={handleSearch}
                isDisabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" color="white" /> : "Search"}
              </Button>
              {(searchTerm || currentSearchTerm) && (
                <Button
                  color="default"
                  radius="sm"
                  onPress={handleClearSearch}
                  isDisabled={isLoading}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {(searchTerm || currentSearchTerm) && (
                <span>
                  Searching for "{searchTerm || currentSearchTerm}" in{" "}
                  {searchType === "enrollee"
                    ? "Enrollee ID/Name"
                    : searchType === "pharmacy"
                      ? "Pharmacy Name"
                      : "Delivery Address"}
                  {filteredRows.length > 0 &&
                    ` - Found ${filteredRows.length} result(s)`}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {showNoResults && (
        <div className="text-center p-8 text-gray-500">
          <p>No deliveries found matching your search criteria.</p>
          <p className="text-sm mt-2">
            Try adjusting your search term or search by a different field.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-8">
          <Spinner color="primary" />
          <p className="mt-2 text-gray-600">Loading deliveries...</p>
        </div>
      ) : filteredRows.length > 0 ? (
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
          selectionMode={
            isProviderPendingsPage || isSentForDeliveryPage
              ? "multiple"
              : undefined
          }
          selectedKeys={
            isProviderPendingsPage || isSentForDeliveryPage
              ? selectedKeys
              : undefined
          }
          onSelectionChange={
            isProviderPendingsPage || isSentForDeliveryPage
              ? handleSelectionChange
              : undefined
          }
          color="primary"
          topContent={
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  {location.pathname === "/create-delivery" ? (
                    <>
                      <h3 className="text-lg font-semibold">Deliveries</h3>
                      <p className="text-sm text-gray-600">
                        Manage and track delivery status
                      </p>
                      <p className="text-xs text-gray-500">
                        Total: {filteredRows.length} deliveries
                        {(searchTerm || currentSearchTerm) && (
                          <span> (filtered from {rows.length})</span>
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Total: {filteredRows.length} deliveries
                      {(searchTerm || currentSearchTerm) && (
                        <span> (filtered from {rows.length})</span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {(isProviderPendingsPage || isSentForDeliveryPage) &&
                selectedCount > 0 && (
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
                            : Array.from(selectedKeys as Set<string>).join(
                                ", "
                              )}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isProviderPendingsPage && (
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
                      )}
                      {isSentForDeliveryPage && (
                        <Button
                          color="secondary"
                          radius="sm"
                          size="md"
                          isLoading={isClaiming}
                          isDisabled={isClaiming}
                          onPress={handleClaimLines}
                        >
                          {isClaiming ? "Creating Claims..." : "Claim Lines"}
                        </Button>
                      )}
                    </div>
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
      ) : null}

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
