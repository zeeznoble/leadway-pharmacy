import { useMemo, useState } from "react";

import { useChunkValue } from "stunk/react";

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

import { DownloadIcon } from "../icons";

import { ProviderData, fetchEnrollee } from "@/lib/services/fetch-providers";
import { appChunk } from "@/lib/store/app-store";
import { ProvidersColumns, exportToExcel, exportToPDF } from "@/lib/helpers";
// import AllEnrollee from "./all-enrollee";

export default function ProviderDataTable() {
  const state = useChunkValue(appChunk);

  const [allData, setAllData] = useState<ProviderData | null>(null);
  const [displayData, setDisplayData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [error, setError] = useState("");

  const getSelectedStateId = () => state.stateId;
  const getSelectedDisciplineId = () => state.disciplineId;

  const fetchAllData = async () => {
    const stateId = getSelectedStateId();
    const disciplineId = getSelectedDisciplineId();
    const enrolleeId = state.enrolleeId;

    if (!enrolleeId) {
      setError("Please enter an Enrollee ID");
      return;
    }
    if (!stateId) {
      setError("Please select a state");
      return;
    }
    if (!disciplineId) {
      setError("Please select a discipline");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const switchStateId =
        stateId === "72" ? "73" : stateId === "73" ? "72" : stateId;
      const data = await fetchEnrollee({
        enrolleeId,
        stateId: switchStateId,
        typeId: disciplineId,
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

  const updateDisplayData = (data: ProviderData, page: number) => {
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

  const isStillLoading = loading || pageLoading;

  const serialOffset = (currentPage - 1) * pageSize;

  const tableItems = useMemo(() => {
    if (isStillLoading) return [];

    return (displayData?.result || []).map((item, index) => ({
      ...item,
      serial: serialOffset + index + 1,
    }));
  }, [displayData?.result, isStillLoading, currentPage, pageSize]);

  return (
    <>
      <div className="max-w-[85rem] flex justify-between items-center mx-3 sm:mx-auto">
        <Button
          radius="sm"
          onPress={handleSearch}
          isDisabled={loading}
          color="warning"
          className="text-white font-semibold w-full sm:w-auto"
        >
          {loading ? "Searching..." : "View my Provider List"}
        </Button>
        {/* <AllEnrollee /> */}
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
                        <DropdownItem
                          key="excel"
                          onPress={() => exportToExcel(allData, setError)}
                        >
                          Export to Excel
                        </DropdownItem>
                        <DropdownItem
                          key="pdf"
                          onPress={() => exportToPDF(allData, setError)}
                        >
                          Export to PDF
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
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
                {ProvidersColumns.map((column) => (
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
