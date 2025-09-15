import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Spinner } from "@heroui/spinner";
import { EnrolleeBenefitData } from "@/lib/services/fetch-enrolee";

interface BenefitTableProps {
  benefitsData: EnrolleeBenefitData[];
  loading: boolean;
  error: string;
}

export default function BenefitTable({
  benefitsData,
  loading,
  error,
}: BenefitTableProps) {
  if (loading) {
    return (
      <div className="text-center py-10">
        <Spinner color="primary" />
        <p className="mt-2">Loading benefits data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (benefitsData.length === 0) {
    return (
      <div className="text-center py-10">
        <p>No benefits data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table aria-label="Enrollee Benefits Table" isStriped>
        <TableHeader>
          <TableColumn>BENEFIT</TableColumn>
          <TableColumn>LIMIT</TableColumn>
          <TableColumn>USED</TableColumn>
          <TableColumn>AMT CLAIMED</TableColumn>
          <TableColumn>AUTHORISED</TableColumn>
          <TableColumn>BALANCE</TableColumn>
          <TableColumn>VISITS LIMIT</TableColumn>
          <TableColumn>VISITS USED</TableColumn>
          <TableColumn>VISITS BALANCE</TableColumn>
          <TableColumn>COINSURANCE %</TableColumn>
          <TableColumn>COPAYMENT</TableColumn>
        </TableHeader>
        <TableBody>
          {benefitsData.map((benefit) => (
            <TableRow key={benefit.RowId}>
              <TableCell>{benefit.Benefit}</TableCell>
              <TableCell>{benefit.Limit}</TableCell>
              <TableCell>{benefit.Used}</TableCell>
              <TableCell>{benefit.AmtClaimed}</TableCell>
              <TableCell>{benefit.Authorised}</TableCell>
              <TableCell>{benefit.Balance}</TableCell>
              <TableCell>{benefit.VisitsLimit}</TableCell>
              <TableCell>{benefit.VisitsUsed}</TableCell>
              <TableCell>{benefit.VisitsBalance}</TableCell>
              <TableCell>{benefit.CoinsurancePercentage}%</TableCell>
              <TableCell>{benefit.CopaymentAmount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
