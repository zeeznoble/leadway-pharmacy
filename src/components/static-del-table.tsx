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

  original: any;
}

export default function StaticDeliveryTable({
  deliveries,
}: DeliveryTableProps) {
  if (deliveries && deliveries.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">No deliveries found</div>
    );
  }

  const rows = deliveries.map((delivery) => {
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
        transformedDelivery.DiagnosisLines[0].DiagnosisName || "N/A", // New
      diagnosis_id: transformedDelivery.DiagnosisLines[0].DiagnosisId || "N/A", // New
      procedurename:
        transformedDelivery.ProcedureLines[0].ProcedureName || "N/A", // New
      procedureid: transformedDelivery.ProcedureLines[0].ProcedureId || "N/A", // New
      original: transformedDelivery,
    };
  });

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
      default:
        return getKeyValue(item, columnKey);
    }
  };

  return (
    <Table aria-label="Deliveries Table">
      <TableHeader columns={DELIVERY_COLUMNS}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
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
  );
}
