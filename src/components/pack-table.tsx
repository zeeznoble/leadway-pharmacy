import { useState, useMemo, useCallback } from "react";
import { useChunkValue } from "stunk/react";
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
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import { Pagination } from "@heroui/pagination";

import { Key } from "@react-types/shared";
import { useLocation } from "react-router-dom";

import { DELIVERY_PACK_COLUMNS } from "@/lib/constants";
import { formatDate, transformApiResponse } from "@/lib/helpers";
import { authStore, appChunk } from "@/lib/store/app-store";

import { Delivery } from "@/types";

interface PackTableProps {
  deliveries: Delivery[];
  isLoading: boolean;
  error: string | null;
  onSearch: (
    searchTerm: string,
    searchType?: "enrollee" | "pharmacy" | "address"
  ) => void;
  onPackDelivery: (selectedDeliveries: any[]) => void;
}

interface RowItem {
  key: string;
  enrollee: {
    name: string;
    id: string;
    scheme: string;
  };
  // startDate: string;
  deliveryaddress: string;
  nextDelivery: string;
  frequency: string;
  status: string;
  diagnosisname: string;
  cost: string;
  diagnosis_id: string;
  procedurename: string;
  procedureid: string;
  pharmacyname: string;
  pharmacyid: number;
  actions: {
    isDelivered: boolean;
  };
  original: any;
}

export default function PackTable({
  deliveries,
  isLoading,
  error,
  onSearch,
  onPackDelivery,
}: PackTableProps) {
  const router = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<
    "enrollee" | "pharmacy" | "address"
  >("enrollee");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  const { user } = useChunkValue(authStore);
  const { enrolleeData } = useChunkValue(appChunk);

  console.log("PackTable Deliveries:", deliveries);

  const rows = useMemo(
    () =>
      deliveries.map((delivery) => {
        const transformedDelivery = transformApiResponse(delivery);

        return {
          key: `${transformedDelivery.EntryNo}`,
          enrollee: {
            name: transformedDelivery.EnrolleeName,
            id: transformedDelivery.EnrolleeId,
            scheme: transformedDelivery.SchemeName,
          },
          deliveryaddress: transformedDelivery.deliveryaddress || "",
          nextDelivery: formatDate(transformedDelivery.NextDeliveryDate),
          frequency: transformedDelivery.DeliveryFrequency,
          status: transformedDelivery.Status ?? "",
          diagnosisname: transformedDelivery.DiagnosisLines[0]?.DiagnosisName,
          diagnosis_id: transformedDelivery.DiagnosisLines[0]?.DiagnosisId,
          procedurename: transformedDelivery.ProcedureLines[0]?.ProcedureName,
          procedureid: transformedDelivery.ProcedureLines[0]?.ProcedureId,
          cost: transformedDelivery.cost || "",
          actions: {
            isDelivered: transformedDelivery.IsDelivered ?? false,
          },
          pharmacyid: transformedDelivery.Pharmacyid || 0,
          pharmacyname: transformedDelivery.PharmacyName || "",
          original: transformedDelivery,
        };
      }),
    [deliveries]
  );

  const columnsWithActions = useMemo(
    () => [...DELIVERY_PACK_COLUMNS, { key: "cost", label: "Cost" }],
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchTypeChange = (value: string) => {
    setSearchType(value as "enrollee" | "pharmacy" | "address");
    // Clear search term when switching search types
    setSearchTerm("");
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setSelectedKeys(new Set([]));
    onSearch(searchTerm, searchType);
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
    onSearch("");
  };

  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") {
      // Select all visible rows on current page only
      // Only filter out delivered items, not all items with status
      const currentPageKeys = new Set(
        paginatedRows
          .filter(
            (row) => !row.actions.isDelivered && row.status !== "Delivered"
          ) // Only exclude delivered items
          .map((row) => row.key as string)
      );
      const currentSelected = selectedKeys as Set<string>;

      // Check if all current page items are already selected
      const allCurrentPageSelected = Array.from(currentPageKeys).every((key) =>
        currentSelected.has(key)
      );

      if (allCurrentPageSelected) {
        // Deselect all current page items
        const newSelection = new Set(
          Array.from(currentSelected).filter((key) => !currentPageKeys.has(key))
        );
        setSelectedKeys(newSelection);
      } else {
        // Add all current page items to selection
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

  // NEW: Handle global select all (across all pages)
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const filteredRows = useMemo(() => {
    let filtered = rows;

    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();

      filtered = filtered.filter((row) => {
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
    }

    return filtered;
  }, [rows, searchType, searchTerm]);

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
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredRows.slice(start, end);
  }, [filteredRows, currentPage, pageSize]);

  const getSelectedRows = (selection: Selection) => {
    if (selection === "all") {
      return filteredRows.filter(
        (row) => !row.actions.isDelivered && row.status !== "Delivered"
      );
    }

    const currentSelection = selection as Set<string>;
    const validKeys = new Set(filteredRows.map((row) => row.key));
    return filteredRows.filter(
      (row) => currentSelection.has(row.key) && validKeys.has(row.key)
    );
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

  const uniqueEnrolleeCount = getEnrolleeCount(selectedKeys);

  const isCurrentPageFullySelected = useMemo(() => {
    if (selectedKeys === "all") return true;

    const currentSelection = selectedKeys as Set<string>;
    const selectableRowsOnPage = paginatedRows.filter(
      (row) => !row.actions.isDelivered && row.status !== "Delivered"
    );

    if (selectableRowsOnPage.length === 0) return false;

    return selectableRowsOnPage.every((row) => currentSelection.has(row.key));
  }, [selectedKeys, paginatedRows]);

  const handlePackDelivery = useCallback(() => {
    const currentSelection = selectedKeys as Set<string>;
    const selectedCount = getSelectedCount(selectedKeys);

    if (selectedCount === 0) {
      return;
    }

    const selectedDeliveries = Array.from(currentSelection)
      .map((key: string) => {
        const selectedRow = filteredRows.find((row) => row.key === key);
        if (selectedRow) {
          const deliveryData: any = {
            DeliveryEntryNo: selectedRow.original.EntryNo,
            Notes: "",

            ...selectedRow.original,

            enrolleename: selectedRow.enrollee.name,
            schemename: selectedRow.enrollee.scheme,
            deliveryaddress: selectedRow.deliveryaddress,
            phonenumber: selectedRow.original.phonenumber,

            Member_ExpiryDate: enrolleeData?.Member_ExpiryDate || null,
            memberExpiryDate: enrolleeData?.Member_ExpiryDate || null,
          };

          if (router.pathname === "/pack") {
            deliveryData.PackedBy = user?.UserName || "";
          } else if (router.pathname === "/to-be-delivered") {
            deliveryData.Marked_as_delivered_by = user?.UserName || "";
          }

          return deliveryData;
        }
        return null;
      })
      .filter(Boolean);

    console.log("Selected deliveries for packing:", selectedDeliveries);
    console.log("Enrollee data:", enrolleeData);
    onPackDelivery(selectedDeliveries);
    setSelectedKeys(new Set([]));
  }, [
    selectedKeys,
    filteredRows,
    onPackDelivery,
    router.pathname,
    user?.UserName,
    enrolleeData,
  ]);

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
        return (
          <Badge
            color={
              item.status === "Packed"
                ? "success"
                : item.status === "Delivered"
                  ? "primary"
                  : "default"
            }
          >
            {item.status}
          </Badge>
        );
      case "diagnosisname":
        return <span>{item.diagnosisname}</span>;
      case "procedurename":
        return <span>{item.procedurename}</span>;
      case "pharmacyname":
        return <span className="text-gray-500">{item.pharmacyname}</span>;
      default:
        return getKeyValue(item, columnKey);
    }
  };

  const selectedCount = getSelectedCount(selectedKeys);

  const showNoResults =
    !isLoading &&
    filteredRows.length === 0 &&
    (searchTerm || deliveries.length > 0);
  const showInitialMessage =
    !isLoading && deliveries.length === 0 && !searchTerm;

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

  // NEW: Get total selectable items count
  const totalSelectableItems = filteredRows.filter(
    (row) => !row.actions.isDelivered && row.status !== "Delivered"
  ).length;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex w-full sm:w-auto items-center flex-1 gap-2">
            <Select
              aria-label="search-packs"
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
            {searchTerm && (
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

        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm text-gray-600">
              {searchTerm && (
                <span>
                  Searching for "{searchTerm}" in{" "}
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

          <Button
            color="success"
            radius="sm"
            isDisabled={selectedCount === 0 || isLoading}
            onPress={handlePackDelivery}
          >
            {router.pathname === "/pack"
              ? "Pack Selected"
              : "Send for Delivery"}
            ({selectedCount})
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-center p-4 mb-4 text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {showInitialMessage && (
        <div className="text-center p-8 text-gray-500">
          No deliveries found. Search by Enrollee ID, Pharmacy Name, or Delivery
          Address to get started.
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
        <>
          <Table
            aria-label="Deliveries Table"
            className="min-w-full"
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={handleSelectionChange}
            // disabledKeys={disabledKeys}
            color="primary"
            topContent={
              <div className="flex justify-between items-center">
                <div className="mt-4 text-sm text-gray-500">
                  <p>Total deliveries: {rows.length}</p>
                  {searchTerm && <p>Filtered results: {filteredRows.length}</p>}
                  <p>Selected for packing: {selectedCount}</p>
                  {selectedCount > 0 && (
                    <p className="text-blue-600">
                      {isGloballySelected
                        ? `All ${totalSelectableItems} items across all pages are selected`
                        : isCurrentPageFullySelected &&
                            paginatedRows.filter(
                              (row) =>
                                !row.actions.isDelivered &&
                                row.status !== "Delivered"
                            ).length > 0
                          ? `All items on page ${currentPage} are selected`
                          : `${selectedCount} items selected across all pages`}
                    </p>
                  )}
                </div>
                <span className="text-sm font-medium text-blue-900">
                  Distinct Selected: {uniqueEnrolleeCount}
                </span>
                {totalPages > 1 && totalSelectableItems > 0 && (
                  <Button
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
            bottomContent={
              totalPages > 1 && (
                <div className="flex w-full justify-center mt-4">
                  <Pagination
                    isCompact
                    showControls
                    color="primary"
                    page={currentPage}
                    total={totalPages}
                    onChange={handlePageChange}
                  />
                </div>
              )
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
        </>
      ) : null}
    </>
  );
}
