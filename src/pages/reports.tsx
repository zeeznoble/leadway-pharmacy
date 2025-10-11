import { useState } from "react";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import toast from "react-hot-toast";

import {
  getTotalDispatchByStatus,
  getTop50Medication,
  getPeriodRegistry,
  getChronicVsAcute,
  getForecastingTool,
  ReportFilters,
} from "@/lib/services/report-service";
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
} from "@/lib/helpers/reports-helpers";
import {
  DownloadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
} from "@/components/icons/icons";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";

const genderOptions = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState("dispatch");
  const [filters, setFilters] = useState<ReportFilters>({});
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (key: keyof ReportFilters, value: any) => {
    if (value) {
      const dateStr = `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
      setFilters((prev) => ({ ...prev, [key]: dateStr }));
    } else {
      setFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      });
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let response;

      switch (activeReport) {
        case "dispatch":
          response = await getTotalDispatchByStatus(filters);
          break;
        case "medication":
          response = await getTop50Medication(filters);
          break;
        case "registry":
          response = await getPeriodRegistry(filters);
          break;
        case "chronic":
          response = await getChronicVsAcute(filters);
          break;
        case "forecast":
          response = await getForecastingTool(filters);
          break;
        default:
          throw new Error("Invalid report type");
      }

      if (response.result && Array.isArray(response.result)) {
        setReportData(response.result);
        toast.success("Report generated successfully!");
      } else {
        toast.error("No data found for the selected filters");
        setReportData([]);
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: "excel" | "csv" | "pdf") => {
    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const reportNames = {
        dispatch: "Total_Dispatch_By_Status",
        medication: "Top_50_Medications",
        registry: "Period_Registry",
        chronic: "Chronic_vs_Acute",
        forecast: "Forecasting_Tool",
      };

      const filename = reportNames[activeReport as keyof typeof reportNames];

      switch (type) {
        case "excel":
          exportToExcel(reportData, filename);
          toast.success("Exported to Excel successfully!");
          break;
        case "csv":
          exportToCSV(reportData, filename);
          toast.success("Exported to CSV successfully!");
          break;
        case "pdf":
          exportToPDF(reportData, filename, filename.replace(/_/g, " "));
          toast.success("Exported to PDF successfully!");
          break;
      }
    } catch (error) {
      toast.error(`Export failed: ${error}`);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setReportData([]);
  };

  const getColumns = () => {
    if (reportData.length === 0) return [];
    return Object.keys(reportData[0]);
  };

  return (
    <section>
      <Card shadow="none">
        <CardBody className="p-0">
          <Tabs
            selectedKey={activeReport}
            onSelectionChange={(key) => {
              setActiveReport(key as string);
              setReportData([]);
            }}
            aria-label="Report types"
            className="mb-6"
          >
            <Tab key="dispatch" title="Dispatch by Status" />
            <Tab key="medication" title="Top 50 Medications" />
            <Tab key="registry" title="Period Registry" />
            <Tab key="chronic" title="Chronic vs Acute" />
            <Tab key="forecast" title="Forecasting Tool" />
          </Tabs>

          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {activeReport !== "forecast" && (
              <>
                <Input
                  label="Location"
                  placeholder="Enter location"
                  value={filters.location || ""}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                />
                <Input
                  label="Plan Type"
                  placeholder="Enter plan type"
                  value={filters.planType || ""}
                  onChange={(e) =>
                    handleFilterChange("planType", e.target.value)
                  }
                />
                <DatePicker
                  label="From Date"
                  value={filters.fromDate ? parseDate(filters.fromDate) : null}
                  onChange={(date) => handleDateChange("fromDate", date)}
                />
                <DatePicker
                  label="To Date"
                  value={filters.toDate ? parseDate(filters.toDate) : null}
                  onChange={(date) => handleDateChange("toDate", date)}
                />
                <Input
                  label="Company"
                  placeholder="Enter company"
                  value={filters.company || ""}
                  onChange={(e) =>
                    handleFilterChange("company", e.target.value)
                  }
                />
                <Select
                  label="Gender"
                  placeholder="Select gender"
                  selectedKeys={filters.gender ? [filters.gender] : []}
                  onChange={(e) => handleFilterChange("gender", e.target.value)}
                >
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>
                <Input
                  label="Diagnosis"
                  placeholder="Enter diagnosis"
                  value={filters.diagnosis || ""}
                  onChange={(e) =>
                    handleFilterChange("diagnosis", e.target.value)
                  }
                />
                <Input
                  label="Age From"
                  type="number"
                  placeholder="Min age"
                  value={filters.ageFrom || ""}
                  onChange={(e) =>
                    handleFilterChange("ageFrom", e.target.value)
                  }
                />
                <Input
                  label="Age To"
                  type="number"
                  placeholder="Max age"
                  value={filters.ageTo || ""}
                  onChange={(e) => handleFilterChange("ageTo", e.target.value)}
                />
                <Input
                  label="Rider ID"
                  placeholder="Enter rider ID"
                  value={filters.riderId || ""}
                  onChange={(e) =>
                    handleFilterChange("riderId", e.target.value)
                  }
                />
              </>
            )}

            {activeReport === "forecast" && (
              <>
                <Input
                  label="Number of Months"
                  type="number"
                  placeholder="Enter months"
                  value={filters.noofmonths || ""}
                  onChange={(e) =>
                    handleFilterChange("noofmonths", e.target.value)
                  }
                />
                <Input
                  label="Location"
                  placeholder="Enter location"
                  value={filters.location || ""}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                />
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <Button
              color="warning"
              className="text-white"
              isLoading={loading}
              onPress={fetchReport}
            >
              Generate Report
            </Button>
            <Button color="default" variant="bordered" onPress={clearFilters}>
              Clear Filters
            </Button>
          </div>

          {/* Export Buttons */}
          {reportData.length > 0 && (
            <div className="flex gap-3 mb-6 flex-wrap">
              <Button
                color="success"
                variant="flat"
                startContent={<FileSpreadsheetIcon className="w-4 h-4" />}
                onPress={() => handleExport("excel")}
              >
                Export to Excel
              </Button>
              <Button
                color="secondary"
                variant="flat"
                startContent={<FileTextIcon className="w-4 h-4" />}
                onPress={() => handleExport("csv")}
              >
                Export to CSV
              </Button>
              <Button
                color="danger"
                variant="flat"
                startContent={<DownloadIcon className="w-4 h-4" />}
                onPress={() => handleExport("pdf")}
              >
                Export to PDF
              </Button>
            </div>
          )}

          {/* Results Table with HeroUI */}
          {reportData.length > 0 && (
            <div className="overflow-x-auto">
              <Table aria-label="Report results table" isStriped>
                <TableHeader>
                  {getColumns().map((column) => (
                    <TableColumn key={column}>{column}</TableColumn>
                  ))}
                </TableHeader>
                <TableBody>
                  {reportData.map((row, idx) => (
                    <TableRow key={idx}>
                      {getColumns().map((column) => (
                        <TableCell key={column}>
                          {row[column] ?? "N/A"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && reportData.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <p>No data available. Please generate a report.</p>
            </div>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
