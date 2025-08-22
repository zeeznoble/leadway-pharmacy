import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Badge } from "@heroui/badge";
import { Input } from "@heroui/input";
import { Key } from "@react-types/shared";

import { DELIVERY_COLUMNS } from "@/lib/constants";
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
  pharmacyid: number;
  pharmacyname: string;
  original: any;
}

export default function StaticDeliveryTable({
  deliveries,
}: DeliveryTableProps) {
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Adjust as needed
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
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
          frequency: transformedDelivery.DeliveryFrequency,
          deliveryaddress: transformedDelivery.deliveryaddress,
          status: transformedDelivery.IsDelivered ?? false,
          diagnosisname: transformedDelivery.DiagnosisLines[0]?.DiagnosisName,
          diagnosis_id: transformedDelivery.DiagnosisLines[0]?.DiagnosisId,
          procedurename: transformedDelivery.ProcedureLines[0]?.ProcedureName,
          procedureid: transformedDelivery.ProcedureLines[0]?.ProcedureId,
          pharmacyid: transformedDelivery.Pharmacyid || 0,
          pharmacyname: transformedDelivery.PharmacyName || "",
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

  if (deliveries && deliveries.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">No deliveries found</div>
    );
  }

  return (
    <Table
      aria-label="Static Deliveries Table"
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
      topContent={
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Deliveries</h3>
            <p className="text-sm text-gray-600">
              View delivery records and status
            </p>
            <p className="text-xs text-gray-500">
              Total: {filteredRows.length} deliveries
              {searchQuery && <span> (filtered from {rows.length})</span>}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
            <Input
              aria-label="Search deliveries"
              className="w-full sm:w-64"
              placeholder="Search by enrollee, diagnosis, procedure..."
              radius="sm"
              size="lg"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      }
    >
      <TableHeader columns={DELIVERY_COLUMNS}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
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
  );
}
