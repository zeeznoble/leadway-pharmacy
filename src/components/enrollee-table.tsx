import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
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

import { useChunkValue } from "stunk/react";

import { ErrorText } from "./error-text";

import {
  EnrolleeResponse,
  fetchEnrolleeById,
} from "@/lib/services/fetch-enrolee";
import { appChunk } from "@/lib/store/app-store";
import { ENROLLEE_COLUMNS } from "@/lib/constants";

export default function EnrolleeDataTable() {
  const { enrolleeId } = useChunkValue(appChunk);
  const [allData, setAllData] = useState<EnrolleeResponse | null>(null);
  const [displayData, setDisplayData] = useState<EnrolleeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const fetchAllData = async (isButtonClick = false) => {
    if (!enrolleeId && isButtonClick) {
      setError("Please enter an Enrollee ID");
      return;
    }

    if (!enrolleeId) return;

    setLoading(true);
    setError("");

    try {
      const data = await fetchEnrolleeById(enrolleeId);

      if (!data || !data.result || data.result.length === 0) {
        setError("No enrollee found");
        setLoading(false);
        return;
      }

      console.log(data);

      setAllData(data);
      updateDisplayData(data, 1, searchQuery);
      setInitialFetchDone(true);
    } catch (error) {
      const err = error as Error;
      const errorMessage = `Failed to fetch enrollee data. Please try again. ${err.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialFetchDone && enrolleeId) {
      fetchAllData();
    }
  }, [enrolleeId, initialFetchDone]);

  const updateDisplayData = (
    data: EnrolleeResponse,
    page: number,
    query: string = ""
  ) => {
    setPageLoading(true);

    setTimeout(() => {
      let filteredResults = [...data.result];

      if (query.trim()) {
        const searchLower = query.toLowerCase();
        filteredResults = filteredResults.filter(
          (item) =>
            item.Member_FirstName?.toLowerCase().includes(searchLower) ||
            item.Member_Surname?.toLowerCase().includes(searchLower)
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (allData) {
      setCurrentPage(1);
      updateDisplayData(allData, 1, query);
    }
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
      <div className="flex justify-between items-center mb-4">
        <Button
          radius="sm"
          onPress={handleSearch}
          isDisabled={loading}
          color="warning"
          className="text-white font-semibold w-full sm:w-auto"
        >
          {loading ? "Loading..." : "Search Enrollee"}
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
              aria-label="Enrollee Data Table"
              isStriped
              shadow="none"
              topContent={
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold">Enrollees</h3>
                    <p className="text-sm text-gray-600">
                      Click on any row to create deliveries
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                    <Input
                      className="w-full sm:w-64"
                      size="lg"
                      placeholder="Search by first name or surname..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      radius="sm"
                      aria-label="Search enrollees"
                    />
                  </div>
                </div>
              }
            >
              <TableHeader columns={ENROLLEE_COLUMNS}>
                {(column) => (
                  <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
              </TableHeader>
              <TableBody
                items={tableItems}
                loadingContent={<Spinner color="warning" />}
                loadingState={isStillLoading ? "loading" : "idle"}
                emptyContent={"No Enrollee Results Found"}
              >
                {(item) => (
                  <TableRow
                    key={`${item.Member_MemberUniqueID}`}
                    className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  >
                    {(columnKey) => (
                      <TableCell>
                        <Link
                          to="/create-deliveries"
                          className="block w-full h-full text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                        >
                          {getKeyValue(item, columnKey)}
                        </Link>
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
}
