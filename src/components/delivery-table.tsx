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
import { useState } from "react";
import { Key } from "@react-types/shared";

import { DELIVERY_COLUMNS } from "@/lib/constants";
import { formatDate, transformApiResponse } from "@/lib/helpers";

import { Delivery } from "@/types";
import { deleteDelivery } from "@/lib/services/delivery-service";
import { DeleteIcon } from "./icons/icons";
import { Button } from "@heroui/button";

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
  actions: {
    isDelivered: boolean;
  };
  original: any;
}

export default function DeliveryTable({ deliveries }: DeliveryTableProps) {
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  if (deliveries.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No deliveries found. Create a new delivery to get started.
      </div>
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
      actions: {
        isDelivered: transformedDelivery.IsDelivered ?? false,
      },
      original: transformedDelivery,
    };
  });

  const columnsWithActions = [
    ...DELIVERY_COLUMNS,
    { key: "delete", label: "Actions" },
  ];

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
      case "delete":
        return (
          <Button
            isIconOnly
            aria-label="Delete delivery"
            onPress={() => deleteDelivery(item, setIsDeleting)}
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
        );
      default:
        return getKeyValue(item, columnKey);
    }
  };

  return (
    <Table aria-label="Deliveries Table">
      <TableHeader columns={columnsWithActions}>
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
