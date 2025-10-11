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
import { Button } from "@heroui/button";
import { Key } from "@react-types/shared";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

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
  status: string;
  diagnosisname: string;
  memberstatus?: string;
  diagnosis_id: string;
  procedurename: string;
  procedureid: string;
  procedureqty: number;
  pharmacyid: number;
  pharmacyname: string;
  deliveryaddress: string;
  original: any;
}

export default function StaticDeliveryTable({
  deliveries,
}: DeliveryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [isDownloading, setIsDownloading] = useState(false);

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
          status: transformedDelivery.Status || "Pending",
          diagnosisname: transformedDelivery.DiagnosisLines[0]?.DiagnosisName,
          diagnosis_id: transformedDelivery.DiagnosisLines[0]?.DiagnosisId,
          procedurename: transformedDelivery.ProcedureLines[0]?.ProcedureName,
          procedureid: transformedDelivery.ProcedureLines[0]?.ProcedureId,
          memberstatus: transformedDelivery.memberstatus,
          procedureqty:
            transformedDelivery.ProcedureLines[0]?.ProcedureQuantity,
          pharmacyid: transformedDelivery.Pharmacyid || 0,
          pharmacyname: transformedDelivery.PharmacyName || "",
          original: transformedDelivery,
        };
      }),
    [deliveries]
  );

  const totalPages = Math.ceil(rows.length / pageSize);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, rows.length);

    return rows.slice(startIndex, endIndex);
  }, [rows, currentPage, pageSize]);

  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true);

      // Prepare data for Excel export
      const excelData = rows.map((row) => ({
        "Enrollee Name": row.enrollee.name,
        Scheme: row.enrollee.scheme,
        "Start Date": row.startDate,
        "Next Delivery": row.nextDelivery,
        Frequency: row.frequency,
        "Delivery Address": row.deliveryaddress || "",
        Status: row.status,
        Diagnosis: row.diagnosisname || "",
        "Diagnosis ID": row.diagnosis_id || "",
        Procedure: row.procedurename || "",
        "Procedure ID": row.procedureid || "",
        "Procedure Quantity": row.procedureqty || "",
        Pharmacy: row.pharmacyname || "",
        "Pharmacy ID": row.pharmacyid || "",
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      const columnWidths = Object.keys(excelData[0] || {}).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...excelData.map(
            (row) => String(row[key as keyof typeof row] || "").length
          )
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Deliveries");

      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `deliveries_${currentDate}.xlsx`;

      // Write and download file
      XLSX.writeFile(workbook, filename);
      toast.success("Excel file downloaded successfully!");
    } catch (error) {
      toast.error(`Error downloading Excel file: ${error}`);
    } finally {
      setIsDownloading(false);
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
      case "status":
        return <Badge>{item.status}</Badge>;
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

  if (deliveries && deliveries.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">No deliveries found</div>
    );
  }

  return (
    <Table
      aria-label="Static Deliveries Table"
      isStriped
      bottomContent={
        totalPages > 1 && (
          <div className="flex w-full justify-between items-center">
            <p className="text-xs text-gray-500">
              Total: {rows.length} deliveries
            </p>
            <Pagination
              isCompact
              showControls
              page={currentPage}
              total={totalPages}
              onChange={handlePageChange}
            />
            <div className="text-small text-default-400">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )
      }
      className="min-w-full"
      topContent={
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Deliveries</h3>
            <p className="text-sm text-gray-600">
              View delivery records and status
            </p>
          </div>
          <Button
            color="primary"
            isLoading={isDownloading}
            onPress={handleDownloadExcel}
            variant="solid"
          >
            {isDownloading ? "Downloading..." : "Download Excel"}
          </Button>
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
