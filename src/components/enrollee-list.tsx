import { useMemo, useState } from "react";
import { useChunkValue } from "stunk/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import {
  getKeyValue,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";

import { EnrolleeData, fetchEnrollee } from "@/lib/services/fetch-enrolee";
import { IdsChunk } from "@/lib/store/enrollee-store";
import { DownloadIcon } from "./icons";

export default function EnrolleeDataTable() {
  const Ids = useChunkValue(IdsChunk);

  const [allData, setAllData] = useState<EnrolleeData | null>(null);
  const [displayData, setDisplayData] = useState<EnrolleeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [error, setError] = useState("");

  const getSelectedStateId = () => Ids.stateId;

  const fetchAllData = async () => {
    const stateId = getSelectedStateId();
    const enrolleeId = Ids.enrolleeId;

    if (!enrolleeId) {
      setError("Please enter an Enrollee ID");
      return;
    }
    if (!stateId) {
      setError("Please select a state");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await fetchEnrollee({
        enrolleeId,
        stateId,
        page: 1,
        pageSize: 5000,
      });

      if (!data || !data.result) {
        setError("Cannot find Enrollee");
        return;
      }

      setAllData(data);
      updateDisplayData(data, 1);
    } catch (error) {
      console.error("Error fetching enrollee data", error);
      setError("Failed to fetch enrollee data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayData = (data: EnrolleeData, page: number) => {
    setPageLoading(true);

    setTimeout(() => {
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, data.result.length);

      const currentPageData = {
        ...data,
        result: data.result.slice(startIndex, endIndex),
        currentPage: page,
      };

      setDisplayData(currentPageData);
      setPageLoading(false);
    }, 300);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAllData();
  };

  const handlePageChange = (page: number) => {
    if (!allData) return;

    setCurrentPage(page);
    updateDisplayData(allData, page);
  };

  const columns = [
    { key: "serial", label: "S/N" },
    { key: "provider", label: "PROVIDER" },
    { key: "email", label: "EMAIL" },
  ];

  const isStillLoading = loading || pageLoading;

  const serialOffset = (currentPage - 1) * pageSize;

  const tableItems = useMemo(() => {
    if (isStillLoading) return [];

    return (displayData?.result || []).map((item, index) => ({
      ...item,
      serial: serialOffset + index + 1,
    }));
  }, [displayData?.result, isStillLoading, currentPage, pageSize]);

  // const columns = [
  //   { key: "provider", label: "PROVIDER" },
  //   { key: "email", label: "EMAIL" },
  //   { key: "phone1", label: "PHONE" },
  //   { key: "region", label: "REGION" },
  //   { key: "medicaldirector", label: "MEDICAL DIRECTOR" },
  //   { key: "ProviderAddress", label: "ADDRESS" },
  // ];

  // Export functions remain the same
  const exportToExcel = () => {
    if (!allData?.result?.length) {
      setError("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    const excelData = allData.result.map((item) => ({
      Provider: item.provider,
      Email: item.email,
      Phone: item.phone1,
      Region: item.region,
      "Medical Director": item.medicaldirector,
      Address: item.ProviderAddress,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Enrollee Providers");
    XLSX.writeFile(wb, "Enrollee_Providers.xlsx");
  };

  const exportToPDF = () => {
    if (!allData?.result?.length) {
      setError("No data to export");
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Enrollee Providers", 14, 15);

      const pdfData = allData.result.map((item, index) => [
        index + 1,
        item.provider,
        item.email,
        // item.phone1,
        // item.region,
        // item.medicaldirector,
        // item.ProviderAddress,
      ]);

      const tableColumns = columns.map((col) => col.label);

      autoTable(doc, {
        head: [tableColumns],
        theme: "striped",
        body: pdfData,
        startY: 25,
        styles: { fontSize: 5, cellPadding: 2, font: "times" },
        headStyles: {
          fillColor: "#C61531",
          textColor: [255, 255, 255],
          fontSize: 4,
          font: "times",
        },
        columnStyles: {
          5: { cellWidth: "auto" },
        },
        margin: { top: 25 },
      });
      doc.save("Enrollee_Providers.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <>
      <div className="max-w-[85rem] mx-auto">
        <Button
          radius="sm"
          onPress={handleSearch}
          isDisabled={loading}
          color="warning"
          className="text-white font-semibold"
        >
          {loading ? "Searching..." : "View my Provider List"}
        </Button>
      </div>
      {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
      {displayData && displayData.status === 200 && (
        <div className="mt-2 bg-white p-6 rounded-lg max-w-[90rem] mx-auto">
          <div className="overflow-x-auto">
            <Table
              aria-label="Enrollee Providers Table"
              isStriped
              shadow="none"
              topContent={
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Enrollee Providers</h3>
                  <div className="flex gap-2 items-center">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          color="success"
                          radius="sm"
                          isDisabled={!allData?.result?.length}
                          startContent={<DownloadIcon />}
                        >
                          Export
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Export Options">
                        <DropdownItem key="excel" onPress={exportToExcel}>
                          Export to Excel
                        </DropdownItem>
                        <DropdownItem key="pdf" onPress={exportToPDF}>
                          Export to PDF
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                    <Button
                      color="default"
                      onPress={handleSearch}
                      isDisabled={loading}
                      radius="sm"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
              }
              bottomContent={
                allData &&
                allData.result &&
                allData.result.length > pageSize && (
                  <div className="flex w-full justify-center mt-4">
                    <Pagination
                      showControls
                      color="secondary"
                      page={currentPage}
                      total={Math.ceil(allData.result.length / pageSize)}
                      onChange={handlePageChange}
                    />
                  </div>
                )
              }
            >
              <TableHeader>
                {columns.map((column) => (
                  <TableColumn key={column.key}>{column.label}</TableColumn>
                ))}
              </TableHeader>
              <TableBody
                items={tableItems}
                loadingContent={<Spinner color="warning" />}
                loadingState={isStillLoading ? "loading" : "idle"}
                emptyContent={"No Provider Results Found"}
              >
                {(item) => (
                  <TableRow key={`${item.provider}-${item.email}`}>
                    {(columnKey) => (
                      <TableCell>{getKeyValue(item, columnKey)}</TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!pageLoading &&
            displayData.result &&
            displayData.result.length > 0 &&
            allData && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, allData.totalRecord)} of{" "}
                {allData.totalRecord} providers
              </div>
            )}
        </div>
      )}
    </>
  );
}
