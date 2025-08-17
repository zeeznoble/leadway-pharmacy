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

import { Key } from "@react-types/shared";
import { useLocation } from "react-router-dom";

import { DELIVERY_COLUMNS } from "@/lib/constants";
import { formatDate, transformApiResponse } from "@/lib/helpers";
import { authStore, appChunk } from "@/lib/store/app-store"; // Add appChunk import

import { Delivery } from "@/types";

interface PackTableProps {
  deliveries: Delivery[];
  isLoading: boolean;
  error: string | null;
  onSearch: (searchTerm: string, searchType?: "enrollee" | "pharmacy") => void;
  onPackDelivery: (selectedDeliveries: any[]) => void;
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
  const [searchType, setSearchType] = useState<"enrollee" | "pharmacy">(
    "enrollee"
  );
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const { user } = useChunkValue(authStore);
  const { enrolleeData } = useChunkValue(appChunk); // Add enrollee data

  console.log(selectedKeys);

  const rows = useMemo(
    () =>
      deliveries.map((delivery) => {
        const transformedDelivery = transformApiResponse(delivery);

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
          original: transformedDelivery,
        };
      }),
    [deliveries]
  );

  const columnsWithActions = useMemo(() => [...DELIVERY_COLUMNS], []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchTypeChange = (value: string) => {
    setSearchType(value as "enrollee" | "pharmacy");
  };

  const handleSearch = () => {
    onSearch(searchTerm, searchType);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    onSearch(""); // Load all data
  };

  const handleSelectionChange = (keys: Selection) => {
    setSelectedKeys(keys);
  };

  // Filter rows based on search term and type (client-side filtering for pharmacy search)
  const filteredRows = useMemo(() => {
    let filtered = rows.filter((row) => !row.status);

    // If searching by pharmacy and we have a search term, filter client-side
    if (searchType === "pharmacy" && searchTerm.trim()) {
      filtered = filtered.filter((row) =>
        row.pharmacyname.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [rows, searchType, searchTerm]);

  const getSelectedCount = (selection: Selection): number => {
    if (selection === "all") {
      return filteredRows.length;
    }
    return selection.size;
  };

  const handlePackDelivery = useCallback(() => {
    const selectionCount = getSelectedCount(selectedKeys);

    if (selectionCount === 0) {
      alert("Please select at least one delivery to pack");
      return;
    }

    let selectedDeliveries: any[] = [];

    if (selectedKeys === "all") {
      selectedDeliveries = filteredRows.map((row) => {
        // Create the complete delivery object for PDF generation
        const deliveryData: any = {
          // Base required fields
          DeliveryEntryNo: row.original.EntryNo,
          Notes: "", // Will be updated with months in the modal

          // Include all original delivery data for PDF generation
          ...row.original,

          // Add additional processed data that might be useful
          enrolleename: row.enrollee.name,
          schemename: row.enrollee.scheme,
          deliveryaddress: row.original.deliveryaddress,
          phonenumber: row.original.phonenumber,

          // Add member expiry date from enrolleeData if available
          Member_ExpiryDate: enrolleeData?.Member_ExpiryDate || null,
          memberExpiryDate: enrolleeData?.Member_ExpiryDate || null, // Alternative field name
        };

        // Add role-specific fields
        if (router.pathname === "/pack") {
          deliveryData.PackedBy = user?.UserName || "";
        } else if (router.pathname === "/to-be-delivered") {
          deliveryData.Marked_as_delivered_by = user?.UserName || "";
        }

        return deliveryData;
      });
    } else {
      selectedDeliveries = Array.from(selectedKeys as Set<Key>)
        .map((key) => {
          const selectedRow = rows.find((row) => row.key === key);
          if (selectedRow) {
            // Create the complete delivery object for PDF generation
            const deliveryData: any = {
              // Base required fields
              DeliveryEntryNo: selectedRow.original.EntryNo,
              Notes: "", // Will be updated with months in the modal

              // Include all original delivery data for PDF generation
              ...selectedRow.original,

              // Add additional processed data that might be useful
              enrolleename: selectedRow.enrollee.name,
              schemename: selectedRow.enrollee.scheme,
              deliveryaddress: selectedRow.original.deliveryaddress,
              phonenumber: selectedRow.original.phonenumber,

              // Add member expiry date from enrolleeData if available
              Member_ExpiryDate: enrolleeData?.Member_ExpiryDate || null,
              memberExpiryDate: enrolleeData?.Member_ExpiryDate || null, // Alternative field name
            };

            // Add role-specific fields
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
    }

    console.log("Selected deliveries for packing:", selectedDeliveries);
    console.log("Enrollee data:", enrolleeData);
    onPackDelivery(selectedDeliveries);
    setSelectedKeys(new Set([]));
  }, [
    selectedKeys,
    rows,
    filteredRows,
    onPackDelivery,
    router.pathname,
    user?.UserName,
    enrolleeData, // Add enrolleeData to dependencies
  ]);

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
      default:
        return getKeyValue(item, columnKey);
    }
  };

  const disabledKeys = useMemo(() => {
    return new Set(rows.filter((row) => row.status).map((row) => row.key));
  }, [rows]);

  const selectedCount = getSelectedCount(selectedKeys);

  const showNoResults =
    !isLoading &&
    filteredRows.length === 0 &&
    (searchTerm || deliveries.length > 0);
  const showInitialMessage =
    !isLoading && deliveries.length === 0 && !searchTerm;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        {/* Search Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex w-full sm:w-auto items-center flex-1 gap-2">
            <Select
              aria-label="search-stuffs"
              className="w-40"
              size="lg"
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
            </Select>
            <Input
              className="flex-1"
              size="lg"
              placeholder={`Search by ${searchType === "enrollee" ? "Enrollee ID" : "Pharmacy Name"}...`}
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

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {searchTerm && (
              <span>
                Searching for "{searchTerm}" in{" "}
                {searchType === "enrollee" ? "Enrollee ID" : "Pharmacy Name"}
              </span>
            )}
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
          No deliveries found. Search by Enrollee ID or Pharmacy Name to get
          started.
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
            disabledKeys={disabledKeys}
            color="primary"
          >
            <TableHeader columns={columnsWithActions}>
              {(column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              )}
            </TableHeader>
            <TableBody items={filteredRows}>
              {(item) => (
                <TableRow key={item.key}>
                  {(columnKey) => (
                    <TableCell>{renderCell(item, columnKey)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 text-sm text-gray-500">
            <p>Total deliveries: {rows.length}</p>
            <p>
              Pending deliveries: {rows.filter((row) => !row.status).length}
            </p>
            {searchTerm && <p>Filtered results: {filteredRows.length}</p>}
            <p>Selected for packing: {selectedCount}</p>
          </div>
        </>
      ) : null}
    </>
  );
}
