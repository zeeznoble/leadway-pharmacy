import { useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { riderActions, viewRiderActions } from "@/lib/store/rider-store";
import { Rider } from "@/types";
import { RiderColumn } from "@/lib/constants";

interface RiderTableProps {
  riders: Rider[];
}

const statusColorMap = {
  Active: "success" as const,
  Inactive: "default" as const,
  Suspended: "danger" as const,
  Pending: "warning" as const,
};

export default function RiderTable({ riders }: RiderTableProps) {
  const renderCell = useCallback((rider: Rider, columnKey: React.Key) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">
              {rider.first_name || "N/A"} {rider.last_name || "N/A"}
            </p>
            <p className="text-bold text-sm capitalize text-default-400">
              {rider.city || "N/A"}, {rider.state_province || "N/A"}
            </p>
          </div>
        );
      case "email":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm">{rider.email || "N/A"}</p>
          </div>
        );
      case "phone":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm">{rider.phone_number || "N/A"}</p>
          </div>
        );
      case "license":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm">{rider.license_number || "N/A"}</p>
            <p className="text-bold text-sm capitalize text-default-400">
              Expires:{" "}
              {rider.license_expiry_date
                ? new Date(rider.license_expiry_date).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[rider.status] || "default"}
            size="sm"
            variant="flat"
          >
            {rider.status}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Button
              size="sm"
              color="default"
              variant="flat"
              onPress={() => viewRiderActions.openViewModal(rider.rider_id!)}
            >
              View
            </Button>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={() => riderActions.openEditModal(rider)}
            >
              Edit
            </Button>
          </div>
        );
      default:
        return null;
    }
  }, []);

  if (!Array.isArray(riders)) {
    return (
      <div className="text-center py-10 text-red-500">
        Invalid data format received from server
      </div>
    );
  }

  if (riders.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">No riders found</div>
    );
  }

  console.log(riders);

  return (
    <Table aria-label="Riders table">
      <TableHeader columns={RiderColumn}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={riders}>
        {(item) => (
          <TableRow key={item.rider_id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
