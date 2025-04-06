import { useMemo, useState, useEffect } from "react";
import { useChunkValue } from "stunk/react";
import { Button } from "@heroui/button";
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
import { BenefitsResponse } from "@/lib/services/fetch-benefit";
import {
  BenefitsColumns,
  exportToExcelBen,
  exportToPDFBen,
} from "@/lib/helpers";
import { fetchDefaultBenefitsById } from "@/lib/services/fetch-default-ben";

// Static benefits we want to display
const staticBenefits = [
  { Benefit: "Dental", Limit: "0", Used: 0, Balance: "" },
  { Benefit: "Lens Frames", Limit: "0", Used: 0, Balance: "" },
  { Benefit: "Surgery", Limit: "Available", Used: 0, Balance: "" },
  { Benefit: "Major Disease", Limit: "0", Used: 0, Balance: "" },
  { Benefit: "TeleMedicine", Limit: "Covered", Used: 0, Balance: "" },
  { Benefit: "Room Type", Limit: "General Ward", Used: 0, Balance: "" },
  { Benefit: "Vaccines", Limit: "Available", Used: 0, Balance: "" },
  { Benefit: "Annual Health Checks", Limit: "Available", Used: 0, Balance: "" },
];

// Function to map API data to static benefits
const mapApiToStaticBenefits = (apiData: BenefitsResponse | null) => {
  if (!apiData || !apiData.result) return staticBenefits;

  const apiBenefits = apiData.result;
  return staticBenefits.map((staticBenefit) => {
    let matchedBenefit = null;

    switch (staticBenefit.Benefit) {
      case "Dental":
        matchedBenefit = apiBenefits.find((b) => b.Benefit === "Dentistry");
        break;
      case "Lens Frames":
        matchedBenefit = apiBenefits.find(
          (b) => b.Benefit === "Lens and Frames"
        );
        break;
      case "Surgery":
        matchedBenefit = null;
        break;
      case "Major Disease":
        matchedBenefit = apiBenefits.find(
          (b) => b.Benefit === "Major Disease Benefit"
        );
        break;
      case "TeleMedicine":
        matchedBenefit = null;
        break;
      case "Room Type":
        matchedBenefit = null;
        break;
      case "Vaccines":
        matchedBenefit = null;
        break;
      case "Annual Health Checks":
        matchedBenefit = apiBenefits.find((b) => b.Benefit === "Health Check");
        break;
      default:
        matchedBenefit = null;
    }

    return matchedBenefit
      ? {
          ...staticBenefit,
          Limit: matchedBenefit.Limit,
          Used: matchedBenefit.Used,
          Balance: matchedBenefit.Balance,
        }
      : staticBenefit;
  });
};

export default function BenefitDefault() {
  const state = useChunkValue(appChunk);

  const [allData, setAllData] = useState<BenefitsResponse | null>(null);
  const [tableData, setTableData] = useState(staticBenefits);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBenefitsData = async () => {
    if (!state || !state.enrolleeId) {
      setError("Enrollee ID not found");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await fetchDefaultBenefitsById(state.enrolleeId);

      if (!data || !data.result) {
        setError("No benefits data available");
        setTableData(staticBenefits); // Reset to defaults
        return;
      }

      setAllData(data);
      const mappedData = mapApiToStaticBenefits(data);
      setTableData(mappedData);
    } catch (error) {
      console.error("Error fetching benefits data", error);
      setError("Failed to fetch benefits data. Please try again.");
      setTableData(staticBenefits);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (state && state.enrolleeId) {
      fetchBenefitsData();
    }
  }, [state?.enrolleeId]);

  const tableItems = useMemo(() => {
    return loading ? [] : tableData;
  }, [tableData, loading]);

  return (
    <>
      {error && <p className="text-red-500 mt-2 text-center">{error}</p>}

      {loading && (
        <div className="flex justify-center mt-4">
          <p>Fetching...</p>
        </div>
      )}

      {allData && allData.status === 200 && (
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
            >
              <TableHeader>
                {BenefitsColumns.map((column) => (
                  <TableColumn key={column.key}>{column.label}</TableColumn>
                ))}
              </TableHeader>
              <TableBody
                items={tableItems}
                loadingContent={<Spinner color="warning" />}
                loadingState={loading ? "loading" : "idle"}
                emptyContent={"No Benefits Data Found"}
              >
                {(item) => (
                  <TableRow key={item.Benefit}>
                    {(columnKey) => (
                      <TableCell>{getKeyValue(item, columnKey)}</TableCell>
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
