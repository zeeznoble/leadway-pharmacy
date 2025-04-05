import { useMemo, useState, useEffect } from "react";
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

import { appChunk } from "@/lib/store/app-store";
import {
  BenefitsResponse,
  fetchBenefitsById,
} from "@/lib/services/fetch-benefit";
import {
  BenefitsColumns,
  exportToExcelBen,
  exportToPDFBen,
} from "@/lib/helpers";

export default function BenefitDataTable() {
  const state = useChunkValue(appChunk);

  const [allData, setAllData] = useState<BenefitsResponse | null>(null);
  const [displayData, setDisplayData] = useState<BenefitsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [error, setError] = useState("");

  const fetchBenefitsData = async () => {
    if (!state || !state.enrolleeId) {
      setError("Enrollee ID not found");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await fetchBenefitsById(
        String(state.enrolleeData?.Member_MemberUniqueID)
      );

      console.log("Enrollee ID: ", state.enrolleeData?.Member_MemberUniqueID);
      console.log("Benefits Data: ", data);

      if (!data || !data.result) {
        setError("No benefits data available");
        return;
      }
      setAllData(data);
      updateDisplayData(data, 1);
    } catch (error) {
      console.error("Error fetching benefits data", error);
      setError("Failed to fetch benefits data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayData = (data: BenefitsResponse, page: number) => {
    setPageLoading(true);

    setTimeout(() => {
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, data.result.length);

      const currentPageData: BenefitsResponse = {
        ...data,
        result: data.result.slice(startIndex, endIndex),
      };

      setDisplayData(currentPageData);
      setPageLoading(false);
    }, 300);
  };

  const handlePageChange = (page: number) => {
    if (!allData) return;

    setCurrentPage(page);
    updateDisplayData(allData, page);
  };

  useEffect(() => {
    if (state && state.enrolleeId) {
      fetchBenefitsData();
    }
  }, [state?.enrolleeId]);

  const isStillLoading = loading || pageLoading;

  const tableItems = useMemo(() => {
    if (isStillLoading) return [];
    return displayData?.result || [];
  }, [displayData?.result, isStillLoading]);

  return (
    <>
      {error && <p className="text-red-500 mt-2 text-center">{error}</p>}

      {isStillLoading && (
        <div className="flex justify-center mt-4">
          <p>Fetching...</p>
        </div>
      )}

      {displayData && displayData.status === 200 && (
        <div className="bg-white rounded-lg max-w-[90rem] mx-auto">
          <div className="overflow-x-auto">
            <Table
              aria-label="Enrollee Benefits Table"
              isStriped
              shadow="none"
              topContent={
                <div className="flex gap-2 items-center justify-end">
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
                        onPress={() => exportToExcelBen(allData, setError)}
                      >
                        Export to Excel
                      </DropdownItem>
                      <DropdownItem
                        key="pdf"
                        onPress={() => exportToPDFBen(allData, setError)}
                      >
                        Export to PDF
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
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
                {BenefitsColumns.map((column) => (
                  <TableColumn key={column.key}>{column.label}</TableColumn>
                ))}
              </TableHeader>
              <TableBody
                items={tableItems}
                loadingContent={<Spinner color="warning" />}
                loadingState={isStillLoading ? "loading" : "idle"}
                emptyContent={"No Benefits Data Found"}
              >
                {(item) => (
                  <TableRow key={item.RowId}>
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
                {Math.min(currentPage * pageSize, allData.result.length)} of{" "}
                {allData.result.length} benefits
              </div>
            )}
        </div>
      )}
    </>
  );
}
