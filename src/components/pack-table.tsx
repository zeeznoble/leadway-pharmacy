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

import { Key } from "@react-types/shared";
import { useLocation } from "react-router-dom";

import { DELIVERY_COLUMNS } from "@/lib/constants";
import { formatDate, transformApiResponse } from "@/lib/helpers";
import { authStore } from "@/lib/store/app-store";

import { Delivery } from "@/types";

interface PackTableProps {
  deliveries: Delivery[];
  isLoading: boolean;
  error: string | null;
  onSearch: (enrolleeId: string) => void;
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

  const [searchEnrolleeId, setSearchEnrolleeId] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const { user } = useChunkValue(authStore);

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
    setSearchEnrolleeId(e.target.value);
  };

  const handleSearch = () => {
    onSearch(searchEnrolleeId);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSelectionChange = (keys: Selection) => {
    setSelectedKeys(keys);
  };

  // Filter out delivered items from selection
  const filteredRows = useMemo(() => {
    return rows.filter((row) => !row.status);
  }, [rows]);

  // Calculate the number of selected items safely handling both Set and "all" cases
  const getSelectedCount = (selection: Selection): number => {
    if (selection === "all") {
      return filteredRows.length; // All non-delivered items
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
      // Handle the case when all items are selected
      if (router.pathname === "/pack") {
        selectedDeliveries = filteredRows.map((row) => ({
          DeliveryEntryNo: row.original.EntryNo,
          PackedBy: user?.UserName || "",
          Notes: `Package for ${row.enrollee.name}`,
        }));
      }

      if (router.pathname === "/to-be-delivered") {
        selectedDeliveries = filteredRows.map((row) => ({
          DeliveryEntryNo: row.original.EntryNo,
          Marked_as_delivered_by: user?.UserName || "",
          Notes: `Package for ${row.enrollee.name}`,
        }));
      }
    } else {
      // Handle the case when specific items are selected via Set
      selectedDeliveries = Array.from(selectedKeys as Set<Key>)
        .map((key) => {
          const selectedRow = rows.find((row) => row.key === key);
          if (selectedRow) {
            if (router.pathname === "/pack") {
              return {
                DeliveryEntryNo: selectedRow.original.EntryNo,
                PackedBy: user?.UserName || "",
                Notes: `Package for ${selectedRow.enrollee.name}`,
              };
            }
            if (router.pathname === "/to-be-delivered") {
              return {
                DeliveryEntryNo: selectedRow.original.EntryNo,
                Marked_as_delivered_by: user?.UserName || "",
                Notes: `Package for ${selectedRow.enrollee.name}`,
              };
            }
          }
          return null;
        })
        .filter(Boolean);
    }

    onPackDelivery(selectedDeliveries);
    // Reset selection after packing
    setSelectedKeys(new Set([]));
  }, [selectedKeys, rows, filteredRows, onPackDelivery]);

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

  // Disable selection for already delivered items
  const disabledKeys = useMemo(() => {
    return new Set(rows.filter((row) => row.status).map((row) => row.key));
  }, [rows]);

  // Get selected count safely
  const selectedCount = getSelectedCount(selectedKeys);

  if (deliveries.length === 0 && !isLoading && !error) {
    return (
      <div className="text-center p-8 text-gray-500">
        No deliveries found. Search by Enrollee ID to get started.
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex w-full sm:w-auto items-center flex-1 gap-2">
          <Input
            className="w-full"
            size="lg"
            placeholder="Search by Enrollee ID..."
            value={searchEnrolleeId}
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
        </div>
        <Button
          color="success"
          radius="sm"
          isDisabled={selectedCount === 0 || isLoading}
          onPress={handlePackDelivery}
        >
          Pack Selected ({selectedCount})
        </Button>
      </div>

      {error && (
        <div className="text-center p-4 mb-4 text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-8">
          <Spinner color="primary" />
          <p className="mt-2 text-gray-600">Loading deliveries...</p>
        </div>
      ) : (
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
      )}

      {!isLoading && rows.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          <p>Total deliveries: {rows.length}</p>
          <p>Pending deliveries: {filteredRows.length}</p>
          <p>Selected for packing: {selectedCount}</p>
        </div>
      )}
    </>
  );
}
