import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { SearchIcon } from "./icons/icons";

interface DistinctDeliveryTableProps {
  pendingApprovalList: any[];
  isLoading: boolean;
  onRowClick: (enrolleeId: string) => void;
  onSearch?: (
    searchTerm: string,
    searchType: "enrollee" | "pharmacy" | "address"
  ) => void;
}

export default function DistinctDeliveryTable({
  pendingApprovalList,
  isLoading,
  onRowClick,
  onSearch,
}: DistinctDeliveryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<
    "enrollee" | "pharmacy" | "address"
  >("enrollee");

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchTerm, searchType);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Transform the API response data into table rows with proper keys
  const tableRows = useMemo(() => {
    return pendingApprovalList.map((item, index) => ({
      key: `${item.enrolleeid}-${index}`,
      enrolleeid: item.enrolleeid || "",
      enrolleename: item.enrolleename || "",
      enrollee_age: item.enrollee_age || 0,
      schemename: item.schemename || "",
      LastEditedDate: item.LastEditedDate || "",
      consolidated_diagnosis: item.consolidated_diagnosis || "",
    }));
  }, [pendingApprovalList]);

  // Filter the transformed data
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return tableRows;

    const searchLower = searchTerm.toLowerCase();

    return tableRows.filter((row) => {
      switch (searchType) {
        case "enrollee":
          return (
            row.enrolleeid.toLowerCase().includes(searchLower) ||
            row.enrolleename.toLowerCase().includes(searchLower)
          );
        case "pharmacy":
          return row.schemename.toLowerCase().includes(searchLower);
        case "address":
          return row.consolidated_diagnosis.toLowerCase().includes(searchLower);
        default:
          return true;
      }
    });
  }, [tableRows, searchTerm, searchType]);

  const columns = [
    { key: "enrolleeid", label: "Enrollee ID" },
    { key: "enrolleename", label: "Enrollee Name" },
    { key: "enrollee_age", label: "Age" },
    { key: "schemename", label: "Scheme" },
    { key: "consolidated_diagnosis", label: "Diagnosis" },
    { key: "LastEditedDate", label: "Last Edited" },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 items-center">
          <Select
            selectedKeys={[searchType]}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as string;
              setSearchType(key as "enrollee" | "pharmacy" | "address");
            }}
            className="w-48"
            radius="sm"
          >
            <SelectItem key="enrollee">Search by Enrollee</SelectItem>
            <SelectItem key="pharmacy">Search by Scheme</SelectItem>
            <SelectItem key="address">Search by Diagnosis</SelectItem>
          </Select>

          <Input
            placeholder={`Search by ${searchType}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={handleKeyPress}
            startContent={<SearchIcon size={16} />}
            className="flex-1"
          />

          <Button onPress={handleSearch} color="primary" radius="sm">
            Search
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <Table aria-label="Pending Approval List">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={filteredRows}
          emptyContent="No pending approvals found"
        >
          {(item) => (
            <TableRow
              key={item.key}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onRowClick(item.enrolleeid)}
            >
              <TableCell>{item.enrolleeid}</TableCell>
              <TableCell>{item.enrolleename}</TableCell>
              <TableCell>{item.enrollee_age}</TableCell>
              <TableCell className="max-w-xs truncate" title={item.schemename}>
                {item.schemename}
              </TableCell>
              <TableCell
                className="max-w-md truncate"
                title={item.consolidated_diagnosis}
              >
                {item.consolidated_diagnosis}
              </TableCell>
              <TableCell>
                {item.LastEditedDate
                  ? new Date(item.LastEditedDate).toLocaleDateString()
                  : "N/A"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {filteredRows.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          No pending approvals found
          {searchTerm && ` for "${searchTerm}"`}
        </div>
      )}
    </div>
  );
}
