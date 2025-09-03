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
import { CalendarDate } from "@internationalized/date";

import { DeleteIcon, EditIcon } from "./icons/icons";
import PackDateModal from "./pack-date-modal";

import { DELIVERY_COLUMNS } from "@/lib/constants";
import { deliveryActions } from "@/lib/store/delivery-store";
import { deleteDelivery } from "@/lib/services/delivery-service";
import {
  formatDate,
  transformApiResponse,
  generateDeliveryNotePDFNew,
} from "@/lib/helpers";
import type { Delivery } from "@/types";
import { packDeliveriesThirdParty } from "@/lib/services/approval-service";
import { fetchEnrolleeById } from "@/lib/services/fetch-enrolee";
import PharmacySelectionModal from "./pharmacy-selection-modal";
import { sendMedicationRefillEmails } from "@/lib/services/medication-email";

interface DeliveryTableProps {
  deliveries: Delivery[];
  isLoading?: boolean;
  onSearch?: (
    searchTerm: string,
    searchType?: "enrollee" | "pharmacy" | "address"
  ) => void;
  currentSearchTerm?: string;
  currentSearchType?: "enrollee" | "pharmacy" | "address";
  user?: any;
  onViewAllMedications?: () => void;
  selectedEnrolleeId?: string;
}

interface RowItem {
  key: string;
  enrollee: {
    name: string;
    id: string;
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
  username?: string;
  comment?: string;
  original: any;
  cost: string;
}

// Match the DeliveryAdjustment interface from PackDateModal
interface DeliveryAdjustment {
  enrolleeId: string;
  enrolleeName: string;
  memberExpiryDate: string;
  adjustedDate: CalendarDate; // This should match PackDateModal's interface
  adjustedMonths: number;
  isAdjusted: boolean;
}

export default function ProviderPendingsDeliveryTable({
  deliveries,
  isLoading = false,
  onSearch,
  currentSearchTerm = "",
  currentSearchType = "enrollee",
  user,
  onViewAllMedications,
  selectedEnrolleeId,
}: DeliveryTableProps) {
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    delivery: any | null;
  }>({ isOpen: false, delivery: null });

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [isPacking, setIsPacking] = useState(false);
  const [isLoadingEnrolleeData, setIsLoadingEnrolleeData] = useState(false);

  // Pack-related states
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedPharmacyData, setSelectedPharmacyData] = useState<{
    pharmacyid: number; // Changed from string to number
    pharmacyname: string;
  } | null>(null);
  const [
    selectedDeliveriesWithEnrolleeData,
    setSelectedDeliveriesWithEnrolleeData,
  ] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  const [searchTerm, setSearchTerm] = useState(currentSearchTerm);
  const [searchType, setSearchType] = useState<
    "enrolleeId" | "enrolleeName" | "pharmacy" | "address"
  >(
    currentSearchType === "enrollee"
      ? "enrolleeId"
      : (currentSearchType as "pharmacy" | "address")
  );

  useEffect(() => {
    setSearchTerm(currentSearchTerm);
    if (currentSearchType === "enrollee") {
      setSearchType("enrolleeName");
    } else {
      setSearchType(currentSearchType as "pharmacy" | "address");
    }
  }, [currentSearchTerm, currentSearchType]);

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
        setSelectedKeys(newSelection);
      } else {
        const newSelection = new Set([
          ...Array.from(currentSelected),
          ...Array.from(currentPageKeys),
        ]);
        setSelectedKeys(newSelection);
      }
    } else {
      setSelectedKeys(keys);
    }
  };

  const getSelectedRows = (selection: Selection) => {
    if (selection === "all") {
      return paginatedRows;
    }

    const currentSelection = selection as Set<string>;
    return rows.filter((row) => currentSelection.has(row.key));
  };

  const getSelectedCount = (selection: Selection) => {
    return getSelectedRows(selection).length;
  };

  const getEnrolleeCount = (selection: Selection) => {
    const selectedRows = getSelectedRows(selection);
    const uniqueEnrolleeIds = new Set(
      selectedRows.map((row) => row.enrollee.id)
    );
    return uniqueEnrolleeIds.size;
  };

  // Pack functionality - similar to PackTable
  // Update the fetchSelectedEnrolleesData function in ProviderPendingsDeliveryTable
  const fetchSelectedEnrolleesData = async (selectedDeliveries: any[]) => {
    setIsLoadingEnrolleeData(true);

    try {
      const uniqueEnrolleeIds = [
        ...new Set(
          selectedDeliveries
            .map((delivery) => {
              // Handle different data structures
              return (
                delivery.enrollee?.id ||
                delivery.EnrolleeId ||
                delivery.enrolleeid ||
                delivery.original?.EnrolleeId
              );
            })
            .filter(Boolean)
        ),
      ];

      console.log("Unique enrollee IDs to fetch:", uniqueEnrolleeIds);

      const enrolleeDataPromises = uniqueEnrolleeIds.map(
        async (enrolleeId: string) => {
          try {
            const response = await fetchEnrolleeById(enrolleeId);
            return {
              enrolleeId,
              data: response?.result?.[0] || null,
            };
          } catch (error) {
            console.error(
              `Failed to fetch data for enrollee ${enrolleeId}:`,
              error
            );
            return {
              enrolleeId,
              data: null,
            };
          }
        }
      );

      const enrolleeDataResults = await Promise.all(enrolleeDataPromises);

      const enrolleeDataMap = new Map<string, any>();
      enrolleeDataResults.forEach((result) => {
        enrolleeDataMap.set(result.enrolleeId, result.data);
      });

      // Format the data to match what PackDateModal expects
      const enhancedDeliveries = selectedDeliveries.map((delivery) => {
        const enrolleeId =
          delivery.enrollee?.id ||
          delivery.EnrolleeId ||
          delivery.enrolleeid ||
          delivery.original?.EnrolleeId;

        const enrolleeData = enrolleeDataMap.get(enrolleeId);

        // Structure the data to match what PackDateModal expects
        return {
          // Top-level fields that PackDateModal looks for
          EnrolleeId: enrolleeId,
          EnrolleeName:
            delivery.enrollee?.name ||
            delivery.EnrolleeName ||
            delivery.original?.EnrolleeName,
          NextDeliveryDate:
            delivery.nextDelivery || delivery.original?.NextDeliveryDate,
          Member_ExpiryDate: enrolleeData?.Member_ExpiryDate || null,
          EntryNo: delivery.original?.EntryNo || delivery.key,

          // Keep all original delivery data
          ...delivery,

          // Add enrollee data
          enrolleeData: enrolleeData,

          // Preserve original structure
          original: delivery.original || delivery,
        };
      });

      console.log(
        "Enhanced deliveries formatted for PackDateModal:",
        enhancedDeliveries
      );

      return enhancedDeliveries;
    } catch (error) {
      console.error("Error fetching enrollees data:", error);
      toast.error("Failed to fetch enrollee information");
      return selectedDeliveries;
    } finally {
      setIsLoadingEnrolleeData(false);
    }
  };

  const handlePackDelivery = async () => {
    const selectedCount = getSelectedCount(selectedKeys);

    if (selectedCount === 0) {
      toast.error("Please select deliveries to pack");
      return;
    }

    // Show pharmacy selection modal first
    setShowPharmacyModal(true);
  };

  // Fix the pharmacy confirm handler to match the modal's expected type
  const handlePharmacyConfirm = async (pharmacyData: {
    pharmacyid: number; // Changed from string to number
    pharmacyname: string;
  }) => {
    setSelectedPharmacyData(pharmacyData);
    setShowPharmacyModal(false);

    // Show loading state
    toast.loading("Loading enrollee information...", {
      id: "loading-enrollees",
    });

    try {
      const selectedDeliveries = getSelectedRows(selectedKeys);

      // Fetch enrollee data for selected deliveries
      const enhancedDeliveries =
        await fetchSelectedEnrolleesData(selectedDeliveries);
      setSelectedDeliveriesWithEnrolleeData(enhancedDeliveries);

      // Dismiss loading toast
      toast.dismiss("loading-enrollees");

      // Show date modal
      setShowDateModal(true);
    } catch (error) {
      toast.dismiss("loading-enrollees");
      console.error("Error preparing deliveries for packing:", error);
      toast.error("Failed to prepare deliveries for packing");
    }
  };

  // Fix the confirm pack handler to handle the DeliveryAdjustment type properly
  const handleConfirmPack = async (
    originalMonths: number,
    deliveryAdjustments: DeliveryAdjustment[]
  ) => {
    if (!selectedPharmacyData) {
      toast.error("Pharmacy information is missing");
      return;
    }

    try {
      setIsPacking(true);

      // Create adjustment map
      const adjustmentMap = new Map<string, DeliveryAdjustment>();
      deliveryAdjustments.forEach((adj) => {
        adjustmentMap.set(adj.enrolleeId, adj);
      });

      // Prepare deliveries for API call with pharmacy info
      const deliveriesForAPI = selectedDeliveriesWithEnrolleeData.map(
        (delivery: any) => {
          // Handle different possible locations for enrolleeId
          const enrolleeId =
            delivery.EnrolleeId ||
            delivery.enrolleeid ||
            delivery.original?.EnrolleeId ||
            delivery.enrollee?.id;

          const adjustment = adjustmentMap.get(enrolleeId);

          let finalMonths = originalMonths;
          let finalDate = "";

          if (adjustment) {
            finalMonths = adjustment.adjustedMonths;
            // Convert CalendarDate directly to ISO string to avoid formatDateForAPI issues
            const { year, month, day } = adjustment.adjustedDate;
            finalDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          } else {
            // Calculate date manually if no adjustment found
            const today = new Date();
            const futureDate = new Date(today);
            futureDate.setMonth(futureDate.getMonth() + originalMonths);
            finalDate = futureDate.toISOString().split("T")[0];
          }

          // Create API payload with pharmacy info
          const apiPayload = {
            DeliveryEntryNo: delivery.EntryNo || delivery.original?.EntryNo,
            PackedBy: user?.UserName || "",
            Notes: `${finalMonths}`,
            pharmacyid: selectedPharmacyData.pharmacyid,
            pharmacyname: selectedPharmacyData.pharmacyname,
            nextpackdate: new Date(finalDate).toISOString().split("T")[0],
          };

          console.log("API Payload for delivery:", {
            enrolleeId,
            enrolleeName: delivery.EnrolleeName || delivery.enrollee?.name,
            adjustment: adjustment || "No adjustment",
            apiPayload,
          });

          return apiPayload;
        }
      );

      console.log("Third-party pack API Payload:", deliveriesForAPI);

      // Make API call
      const result = await packDeliveriesThirdParty(deliveriesForAPI);

      if (result && result.Results?.[0]?.status === 200) {
        toast.success(
          result.Results[0].ReturnMessage || "Deliveries packed successfully"
        );

        try {
          // Calculate the effective months for PDF (use the most common adjusted months or original)
          const monthsCount = new Map<number, number>();
          deliveryAdjustments.forEach((adj) => {
            const count = monthsCount.get(adj.adjustedMonths) || 0;
            monthsCount.set(adj.adjustedMonths, count + 1);
          });

          // Find the most common months value
          let mostCommonMonths = originalMonths;
          let maxCount = 0;
          for (const [months, count] of monthsCount.entries()) {
            if (count > maxCount) {
              maxCount = count;
              mostCommonMonths = months;
            }
          }

          // Get the next pack date from the first delivery
          const nextPackDate = new Date(deliveriesForAPI[0]?.nextpackdate)
            .toISOString()
            .split("T")[0];

          // 🎯 SEND EMAILS FIRST - Before PDF generation
          console.log("Starting email sending process...");
          try {
            await sendMedicationRefillEmails(
              selectedDeliveriesWithEnrolleeData,
              mostCommonMonths
            );
          } catch (emailError) {
            console.error("Email sending failed:", emailError);
            toast.error(
              "Failed to send medication confirmation emails, but packing was successful"
            );
          }

          await generateDeliveryNotePDFNew(
            selectedDeliveriesWithEnrolleeData,
            mostCommonMonths,
            nextPackDate,
            deliveryAdjustments
          );

          // Show success message with adjustment info
          const adjustedCount = deliveryAdjustments.filter(
            (adj) => adj.isAdjusted
          ).length;
          const adjustmentInfo =
            adjustedCount > 0
              ? ` (${adjustedCount} delivery${adjustedCount > 1 ? "ies" : ""} adjusted due to member expiry dates)`
              : "";

          toast.success(
            `Delivery note PDF with ${selectedDeliveriesWithEnrolleeData.length} deliveries downloaded successfully!${adjustmentInfo}`
          );
        } catch (pdfError) {
          toast.error(`Failed to generate delivery note PDF: ${pdfError}`);
        }

        // Clear selections and close modals
        setSelectedKeys(new Set([]));
        setShowDateModal(false);
        setSelectedPharmacyData(null);
        setSelectedDeliveriesWithEnrolleeData([]);

        // Optionally refresh the delivery list
        if (onSearch) {
          onSearch("", "enrollee");
        }
      } else {
        throw new Error(
          result?.Results?.[0]?.ReturnMessage || "Failed to pack deliveries"
        );
      }
    } catch (error) {
      console.error("Pack error:", error);
      toast.error(`Failed to pack deliveries: ${(error as Error).message}`);
    } finally {
      setIsPacking(false);
    }
  };

  // Search functionality (same as original)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchTypeChange = (value: string) => {
    setSearchType(
      value as "enrolleeId" | "enrolleeName" | "pharmacy" | "address"
    );
    setSearchTerm("");
  };

  const shouldUseApiSearch = (searchType: string): boolean => {
    return searchType === "enrolleeId";
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setSelectedKeys(new Set([]));

    if (onSearch && shouldUseApiSearch(searchType)) {
      onSearch(searchTerm, "enrollee");
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
    setSearchType("enrolleeName");
    if (onSearch) {
      onSearch("", "enrollee");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Data processing (same as original DeliveryTable)
  const rows = useMemo(
    () =>
      deliveries.map((delivery, index) => {
        const transformedDelivery = transformApiResponse(delivery);
        const uniqueKey = `${transformedDelivery.EntryNo || index}-${Date.now()}-${Math.random()}`;

        console.log("transformedDelivery", transformedDelivery);

        return {
          key: uniqueKey,
          enrollee: {
            name: transformedDelivery.EnrolleeName,
            id: transformedDelivery.EnrolleeId,
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
          memberstatus: transformedDelivery.memberstatus,
          actions: {
            isDelivered: transformedDelivery.IsDelivered ?? false,
          },
          comment: transformedDelivery.Comment,
          username: transformedDelivery.Username,
          pharmacyname: transformedDelivery.PharmacyName || "",
          cost: transformedDelivery.cost || "",
          original: transformedDelivery,
        };
      }),
    [deliveries]
  );

  const filteredRows = useMemo(() => {
    if (onSearch && searchType === "enrolleeId") {
      return rows;
    }

    if (!searchTerm.trim()) return rows;

    const searchTermLower = searchTerm.toLowerCase();

    return rows.filter((row) => {
      switch (searchType) {
        case "enrolleeName":
          return (
            row.enrollee.name.toLowerCase().includes(searchTermLower) ||
            row.key.toLowerCase().includes(searchTermLower)
          );
        case "enrolleeId":
          return row.key.toLowerCase().includes(searchTermLower);
        case "pharmacy":
          return row.pharmacyname.toLowerCase().includes(searchTermLower);
        case "address":
          return row.deliveryaddress.toLowerCase().includes(searchTermLower);
        default:
          return true;
      }
    });
  }, [rows, searchType, searchTerm, onSearch]);

  const isGloballySelected = useMemo(() => {
    if (selectedKeys === "all") return false;

    const currentSelection = selectedKeys as Set<string>;
    const allSelectableKeys = filteredRows
      .filter((row) => !row.actions.isDelivered && row.status !== "Delivered")
      .map((row) => row.key);

    return (
      allSelectableKeys.length > 0 &&
      allSelectableKeys.every((key) => currentSelection.has(key))
    );
  }, [selectedKeys, filteredRows]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredRows.length);

    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, currentPage, pageSize]);

  const columnsWithActions = useMemo(
    () => [
      ...DELIVERY_COLUMNS,
      { key: "cost", label: "Cost" },
      { key: "comment", label: "Comment" },
      { key: "username", label: "Inputted By" },
      {
        key: "actions",
        label: "Actions",
      },
    ],
    []
  );

  const handleGlobalSelectAll = () => {
    const allSelectableKeys = filteredRows
      .filter((row) => !row.actions.isDelivered && row.status !== "Delivered")
      .map((row) => row.key);

    const currentSelected = selectedKeys as Set<string>;
    const allGlobalSelected = allSelectableKeys.every((key) =>
      currentSelected.has(key)
    );

    if (allGlobalSelected) {
      setSelectedKeys(new Set([]));
    } else {
      setSelectedKeys(new Set(allSelectableKeys));
    }
  };

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
  const uniqueEnrolleeCount = getEnrolleeCount(selectedKeys);

  const getSearchPlaceholder = (searchType: string): string => {
    switch (searchType) {
      case "enrolleeId":
        return "Search by Enrollee ID";
      case "enrolleeName":
        return "Search by Enrollee Name";
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

  const showInitialMessage =
    !isLoading && deliveries.length === 0 && !searchTerm && !currentSearchTerm;

  const shouldShowSearchUI = !showInitialMessage;

  const totalSelectableItems = filteredRows.filter(
    (row) => !row.actions.isDelivered && row.status !== "Delivered"
  ).length;

  if (showInitialMessage) {
    return (
      <div className="text-center p-8 text-gray-500">
        No deliveries found. Create a new delivery to get started.
      </div>
    );
  }

  return (
    <>
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
                <SelectItem key="enrolleeName">Enrollee Name</SelectItem>
                <SelectItem key="enrolleeId">Enrollee ID</SelectItem>
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
                  {searchType === "enrolleeId"
                    ? "Enrollee ID"
                    : searchType === "enrolleeName"
                      ? "Enrollee Name"
                      : searchType === "pharmacy"
                        ? "Pharmacy Name"
                        : "Delivery Address"}
                  {filteredRows.length > 0 &&
                    ` - Found ${filteredRows.length} result(s)`}
                  {searchType === "enrolleeId" && onSearch && " (API Search)"}
                  {searchType !== "enrolleeId" && " (Local Filter)"}
                </span>
              )}
            </div>

            {/* <Button
              color="success"
              radius="sm"
              isDisabled={selectedCount === 0 || isLoading || isPacking}
              onPress={handlePackDelivery}
              isLoading={isPacking}
            >
              {isPacking ? "Packing..." : `Pack Selected (${selectedCount})`}
            </Button> */}
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

      {isLoading || isLoadingEnrolleeData ? (
        <div className="text-center p-8">
          <Spinner color="primary" />
          <p className="mt-2 text-gray-600">
            {isLoadingEnrolleeData
              ? "Loading enrollee information..."
              : "Loading deliveries..."}
          </p>
        </div>
      ) : filteredRows.length > 0 ? (
        <Table
          aria-label="Deliveries Table"
          isStriped
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
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
          color="primary"
          topContent={
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-gray-500">
                    Total: {filteredRows.length} deliveries
                    {(searchTerm || currentSearchTerm) && (
                      <span> (filtered from {rows.length})</span>
                    )}
                  </p>
                </div>

                {onViewAllMedications && selectedEnrolleeId && (
                  <Button
                    color="secondary"
                    radius="sm"
                    size="md"
                    onPress={onViewAllMedications}
                    isDisabled={isLoading}
                  >
                    View All Medications
                  </Button>
                )}
              </div>

              {selectedCount > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedCount} delivery(s) selected
                    </span>
                    <span className="text-sm font-medium text-blue-900">
                      Distinct Selected: {uniqueEnrolleeCount}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      color="success"
                      radius="sm"
                      size="md"
                      isLoading={isPacking}
                      isDisabled={isPacking}
                      onPress={handlePackDelivery}
                    >
                      {isPacking ? "Packing..." : "Pack Selected"}
                    </Button>
                  </div>
                </div>
              )}

              {totalPages > 1 && totalSelectableItems > 0 && (
                <Button
                  className="self-end"
                  color={isGloballySelected ? "warning" : "default"}
                  radius="md"
                  size="sm"
                  variant="flat"
                  onPress={handleGlobalSelectAll}
                  isDisabled={isLoading}
                >
                  {isGloballySelected
                    ? `Deselect All (${totalSelectableItems})`
                    : `Select All Pages (${totalSelectableItems})`}
                </Button>
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

      {/* Pharmacy Selection Modal */}
      <PharmacySelectionModal
        isOpen={showPharmacyModal}
        onClose={() => setShowPharmacyModal(false)}
        onConfirm={handlePharmacyConfirm}
        selectedCount={selectedCount}
      />

      {/* Pack Date Modal */}
      <PackDateModal
        isOpen={showDateModal}
        onClose={() => {
          setShowDateModal(false);
          setSelectedPharmacyData(null);
          setSelectedDeliveriesWithEnrolleeData([]);
        }}
        onConfirm={handleConfirmPack}
        selectedDeliveries={selectedDeliveriesWithEnrolleeData}
      />
    </>
  );
}
