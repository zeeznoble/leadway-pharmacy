import { useEffect, useMemo, useState } from "react";

import { useChunkValue } from "stunk/react";

import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Input } from "@heroui/input";
import {
  getKeyValue,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";

import { ProviderData, fetchProvider } from "@/lib/services/fetch-providers";
import { appChunk, resetProviderFilters } from "@/lib/store/app-store";
import { ErrorText } from "./error-text";
import { PROVIDERS_COLUMNS } from "@/lib/constants";
// import { DownloadIcon } from "./icons/icons";
// import AllEnrollee from "./all-enrollee";

export default function PharmacyDataTable() {
  const state = useChunkValue(appChunk);

  const [allData, setAllData] = useState<ProviderData | null>(null);
  const [displayData, setDisplayData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const getSelectedStateId = () => state.stateId;
  const getEnrolleeId = () => state.enrolleeId;

  const fetchAllData = async (isButtonClick = false) => {
    setLoading(true);
    setError("");

    try {
      const stateId = getSelectedStateId();
      const enrolleeId = getEnrolleeId();

      const params: {
        enrolleeId?: string;
        stateId?: string;
        page: number;
        pageSize: number;
      } = {
        page: 1,
        pageSize: 20,
      };

      if (enrolleeId) {
        params.enrolleeId = enrolleeId;
      }

      if (stateId) {
        const switchStateId =
          stateId === "72" ? "73" : stateId === "73" ? "72" : stateId;
        params.stateId = switchStateId;
      }

      if (isButtonClick && !enrolleeId && !stateId) {
        setError("Please enter an Enrollee ID or select a state");
        setLoading(false);
        return;
      }

      const data = await fetchProvider(params);

      if (!data || !data.result) {
        setError("No results found");
        setLoading(false);
        return;
      }

      setAllData(data);
      updateDisplayData(data, 1, searchQuery);
      setInitialFetchDone(true);
    } catch (error) {
      const err = error as Error;
      setError(`Failed to fetch data. Please try again. ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stateId = getSelectedStateId();

    resetProviderFilters(stateId || "");
    if (!initialFetchDone) {
      fetchAllData();
    }
  }, [initialFetchDone]);

  const updateDisplayData = (
    data: ProviderData,
    page: number,
    query: string = ""
  ) => {
    setPageLoading(true);

    setTimeout(() => {
      // Filter the data based on search query if provided
      let filteredResults = [...data.result];

      if (query.trim()) {
        const searchLower = query.toLowerCase();
        filteredResults = filteredResults.filter(
          (item) =>
            // Adjust these fields based on what you want to search through
            item.provider?.toLowerCase().includes(searchLower)
          // item.email?.toLowerCase().includes(searchLower) ||
          // item.phone1?.toLowerCase().includes(searchLower) ||
          // item.address?.toLowerCase().includes(searchLower)
        );
      }
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, filteredResults.length);

      const currentPageData = {
        ...data,
        result: filteredResults.slice(startIndex, endIndex),
        currentPage: page,
        totalRecord: filteredResults.length,
      };

      setDisplayData(currentPageData);
      setPageLoading(false);
    }, 300);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAllData(true);
  };

  // Add a search handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (allData) {
      setCurrentPage(1);
      updateDisplayData(allData, 1, query);
    }
  };

  const handlePageChange = (page: number) => {
    if (!allData) return;

    setCurrentPage(page);
    updateDisplayData(allData, page, searchQuery);
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
      <div className="flex justify-between items-center">
        <Button
          radius="sm"
          onPress={handleSearch}
          isDisabled={loading}
          color="warning"
          className="text-white font-semibold w-full sm:w-auto mb-4"
        >
          {loading ? "Loading..." : "Search Pharmacy"}
        </Button>
      </div>
      {error && <ErrorText text={error} />}
      {loading && (
        <div className="text-center mt-5">
          <Spinner color="warning" />
        </div>
      )}
      {displayData && displayData.status === 200 && (
        <div className="mt-2 bg-white rounded-lg">
          <div className="overflow-x-auto">
            <Table
              aria-label="Enrollee Providers Table"
              isStriped
              shadow="none"
              topContent={
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                  <h3 className="text-lg font-semibold">Pharmacies</h3>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                    <Input
                      className="w-full sm:w-64"
                      size="lg"
                      placeholder="Search providers..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      radius="sm"
                    />
                    {/* <Dropdown>
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
                    </Dropdown> */}
                  </div>
                </div>
              }
              bottomContent={
                allData &&
                displayData &&
                displayData.result &&
                allData.result.length > pageSize && (
                  <div className="flex w-full justify-center mt-4">
                    <Pagination
                      showControls
                      color="secondary"
                      page={currentPage}
                      total={Math.ceil(displayData.totalRecord / pageSize)}
                      onChange={handlePageChange}
                    />
                  </div>
                )
              }
            >
              <TableHeader columns={PROVIDERS_COLUMNS}>
                {(column) => (
                  <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
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
            displayData.result.length > 0 && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, displayData.totalRecord)} of{" "}
                {displayData.totalRecord} providers
              </div>
            )}
        </div>
      )}
    </>
  );
}
