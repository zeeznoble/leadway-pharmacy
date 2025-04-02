import { useEffect, useState } from "react";

import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@heroui/table";
import { SharedSelection } from "@heroui/system";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";

import { fetchStates, StateOption } from "@/lib/services/fetch-state";
import { EnrolleeData, fetchEnrollee } from "@/lib/services/fetch-enrolee";

export default function EnrolleeSearch() {
  const [states, setStates] = useState<StateOption[]>([]);
  const [enrolleeId, setEnrolleeId] = useState("");
  const [selectedState, setSelectedState] = useState<Set<string>>(new Set([]));
  const [enrolleeData, setEnrolleeData] = useState<EnrolleeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStates() {
      try {
        setLoading(true);
        const stateData = await fetchStates();
        setStates(stateData || []);
        if (stateData && stateData.length > 0) {
          setSelectedState(new Set([stateData[0].Value]));
        }
      } catch (error) {
        console.error("Failed to load states", error);
        setError("Failed to load states. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    loadStates();
  }, []);

  const getSelectedStateId = () => Array.from(selectedState)[0] || "";

  const fetchEnrolleeData = async (page: number) => {
    const stateId = getSelectedStateId();
    if (!enrolleeId.trim()) {
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchEnrolleeData(page);
  };

  const handleSelectionChange = (keys: SharedSelection) => {
    setSelectedState(keys as Set<string>);
  };

  // Calculate total pages
  const pages = enrolleeData?.totalPages || 0;

  // Define loading state for table
  const loadingState =
    loading || !enrolleeData?.result || enrolleeData.result.length === 0
      ? "loading"
      : "idle";

  // Define columns
  const columns = [
    { key: "provider", label: "PROVIDER" },
    { key: "email", label: "EMAIL" },
    { key: "phone1", label: "PHONE" },
    { key: "region", label: "REGION" },
    { key: "medicaldirector", label: "MEDICAL DIRECTOR" },
    { key: "ProviderAddress", label: "ADDRESS" },
  ];

  return (
    <div className="flex flex-col gap-4 p-6 font-inter">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <img src="/leadway-logo.png" alt="Leadway" className="w-40 mx-auto" />
          <h2 className="text-3xl font-semibold mt-4">
            Find Your Enrollment Details
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            Enter your Enrollee ID below and select your state to retrieve your
            records.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg max-w-[500px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Enrollee ID"
              placeholder="Enter your Enrollee ID"
              value={enrolleeId}
              radius="sm"
              size="lg"
              onChange={(e) => setEnrolleeId(e.target.value)}
            />

            <Select
              label="Select State"
              radius="sm"
              size="lg"
              selectedKeys={selectedState}
              onSelectionChange={handleSelectionChange}
              isDisabled={states.length === 0 || loading}
            >
              {states.map((state) => (
                <SelectItem key={state.Value}>{state.Text}</SelectItem>
              ))}
            </Select>
          </div>

          <Button
            radius="sm"
            onPress={handleSearch}
            isDisabled={loading}
            color="warning"
            size="lg"
            fullWidth
            className="text-white font-semibold mt-7"
          >
            {loading ? "Searching..." : "Search Enrollee"}
          </Button>

          {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
        </div>

        {/* Updated Table Section */}
        {enrolleeData && (
          <div className="mt-2 bg-white p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Provider Results</h3>

            <div className="overflow-x-auto">
              <Table
                aria-label="Enrollee Providers Table"
                shadow="none"
                isStriped
                bottomContent={
                  pages > 0 ? (
                    <div className="flex w-full justify-center">
                      <Pagination
                        className="text-white"
                        page={currentPage}
                        total={pages}
                        onChange={handlePageChange}
                      />
                    </div>
                  ) : null
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
                  loadingState={loadingState}
                  emptyContent={"No results found"}
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
      </div>
    </div>
  );
}
