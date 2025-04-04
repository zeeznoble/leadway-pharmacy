import { EnrolleeData, fetchEnrollee } from "@/lib/services/fetch-enrolee";
import { IdsChunk } from "@/lib/store/enrollee-store";
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
import { useState } from "react";
import { useChunkValue } from "stunk/react";

export default function EnrolleeDataTable() {
  const Ids = useChunkValue(IdsChunk);

  const [enrolleeData, setEnrolleeData] = useState<EnrolleeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [error, setError] = useState("");

  const getSelectedStateId = () => Ids.stateId;
  const getSelectedDisciplineId = () => Ids.disciplineId;

  const fetchEnrolleeData = async (page: number) => {
    const stateId = getSelectedStateId();
    const typeId = getSelectedDisciplineId();
    const enrolleeId = Ids.enrolleeId;
    if (!enrolleeId) {
      setError("Please enter an Enrollee ID");
      return;
    }
    if (!stateId) {
      setError("Please select a state");
      return;
    }
    // if (!typeId) {
    //   setError("Please select a discipline");
    //   return;
    // }

    setError("");
    setLoading(true);
    try {
      const data = await fetchEnrollee({
        enrolleeId,
        stateId,
        typeId,
        page,
        pageSize,
      });
      setEnrolleeData(data);
      if (!data || !data.result) {
        setError("Cannot find Enrolee");
      }
    } catch (error) {
      console.error("Error fetching enrollee data", error);
      setError("Failed to fetch enrollee data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchEnrolleeData(1);

  const pages = enrolleeData?.totalPages || 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchEnrolleeData(page);
  };

  const columns = [
    { key: "provider", label: "PROVIDER" },
    { key: "email", label: "EMAIL" },
    { key: "phone1", label: "PHONE" },
    { key: "region", label: "REGION" },
    { key: "medicaldirector", label: "MEDICAL DIRECTOR" },
    { key: "ProviderAddress", label: "ADDRESS" },
  ];
  return (
    <>
      <div className="max-w-[85rem] mx-auto">
        <Button
          radius="sm"
          onPress={handleSearch}
          isDisabled={loading}
          color="warning"
          size="lg"
          className="text-white font-semibold"
        >
          {loading ? "Searching..." : "View my Provider List"}
        </Button>
      </div>
      {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
      {enrolleeData && enrolleeData.status === 200 && (
        <div className="mt-2 bg-white p-6 rounded-lg max-w-[90rem] mx-auto">
          <div className="overflow-x-auto">
            <Table
              aria-label="Enrollee Providers Table"
              isStriped
              shadow="none"
              topContent={
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Enrollee Providers</h3>
                  <Button
                    color="default"
                    size="sm"
                    onPress={() => handlePageChange(pages)}
                    isDisabled={loading}
                    radius="sm"
                  >
                    Refresh
                  </Button>
                </div>
              }
              bottomContent={
                pages > 0 && (
                  <div className="flex w-full justify-center">
                    <Pagination
                      className="text-white"
                      page={currentPage}
                      total={pages}
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
                items={enrolleeData?.result || []}
                loadingContent={<Spinner color="warning" />}
                loadingState={loading ? "loading" : "idle"}
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

          {enrolleeData.result && enrolleeData.result.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, enrolleeData.totalRecord)} of{" "}
              {enrolleeData.totalRecord} providers
            </div>
          )}
        </div>
      )}
    </>
  );
}
