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
import {
  BenefitsResponse,
  fetchBenefitsById,
} from "@/lib/services/fetch-benefit";
import {
  BenefitsColumns,
  exportToExcelBen,
  exportToPDFBen,
} from "@/lib/helpers";

// Static benefits we want to display
const staticBenefits = [
  {
    Benefit: "Annual screening service",
    Limit: "Covered",
    Used: 0,
    Balance: "",
  },
  { Benefit: "Immunizations 0-5", Limit: "0", Used: 0, Balance: "" },
  { Benefit: "Immunizations 6-17", Limit: "0", Used: 0, Balance: "" },
  { Benefit: "Physiotherapy", Limit: "Available", Used: 0, Balance: "" },
  { Benefit: "Medications", Limit: "0", Used: 0, Balance: "" },
  { Benefit: "Family planning", Limit: "Covered", Used: 0, Balance: "" },
  {
    Benefit: "External medical device",
    Limit: "General Ward",
    Used: 0,
    Balance: "",
  },
  { Benefit: "Gym", Limit: "Available", Used: 0, Balance: "" },
  { Benefit: "Spa", Limit: "Available", Used: 0, Balance: "" },
  { Benefit: "Fertility", Limit: "Available", Used: 0, Balance: "" },
];

const mapApiToStaticBenefits = (apiData: BenefitsResponse | null) => {
  if (!apiData || !apiData.result) return staticBenefits;

  const apiBenefits = apiData.result;
  return staticBenefits.map((staticBenefit) => {
    let matchedBenefit = null;

    switch (staticBenefit.Benefit) {
      case "Annual screening service":
        matchedBenefit = null;
        break;
      case "Immunizations 0-5":
        matchedBenefit = apiBenefits.find(
          (b) => b.Benefit === "NPI Immunization 0 - 5 years"
        );
        break;
      case "Immunizations 6-17":
        matchedBenefit = apiBenefits.find(
          (b) => b.Benefit === "Additional Immunization 6 years to 17 years"
        );
        break;
      case "Physiotherapy":
        matchedBenefit = apiBenefits.find((b) => b.Benefit === "Physical");
        break;
      case "Medication":
        matchedBenefit = apiBenefits.find((b) => b.Benefit === "Physical");
        break;
      case "Family planning":
        matchedBenefit = apiBenefits.find(
          (b) => b.Benefit === "Family Planning"
        );
        break;
      case "External medical device":
        matchedBenefit = apiBenefits.find(
          (b) => b.Benefit === "Devices and Appliances"
        );
        break;
      case "Gym":
        matchedBenefit = apiBenefits.find((b) => b.Benefit === "Wellness Gym");
        break;
      case "Spa":
        matchedBenefit = apiBenefits.find((b) => b.Benefit === "Spa");
        break;
      case "Fertility":
        matchedBenefit = apiBenefits.find(
          (b) =>
            b.Benefit === "Fertility Services (Consultation & Investigation)"
        );
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

export default function BenefitDataTable() {
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
      const data = await fetchBenefitsById(
        String(state.enrolleeData?.Member_MemberUniqueID)
      );

      if (!data || !data.result) {
        setError("No benefits data available");
        setTableData(staticBenefits);
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

  // const isStillLoading = loading || pageLoading;

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
