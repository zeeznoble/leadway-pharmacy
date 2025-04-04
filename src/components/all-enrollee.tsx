// import { useAsyncChunk } from "stunk/react";

// // import { Button } from "@heroui/button";
// // import {
// //   Dropdown,
// //   DropdownTrigger,
// //   DropdownMenu,
// //   DropdownItem,
// // } from "@heroui/dropdown";

// // import { DownloadIcon } from "./icons";

// // import { allEnrolleesChunk } from "@/lib/store/all-enrollees";

// // import { exportToExcel, exportToPDF } from "@/lib/helpers";

// export default function AllEnrollee() {
//   const { data, loading } = useAsyncChunk(allEnrolleesChunk);

//   if (loading) return null;

//   console.log("All Enrollee Data: ", data);

//   return (
//     <>
//       {data && data.length > 0 && (
//         // <Dropdown>
//         //   <DropdownTrigger>
//         //     <Button color="success" radius="sm" startContent={<DownloadIcon />}>
//         //       Export All Enrollees
//         //     </Button>
//         //   </DropdownTrigger>
//         //   <DropdownMenu aria-label="Export Options">
//         //     <DropdownItem key="excel" onPress={() => exportToExcel(data)}>
//         //       Export to Excel
//         //     </DropdownItem>
//         //     <DropdownItem key="pdf" onPress={() => exportToPDF(data)}>
//         //       Export to PDF
//         //     </DropdownItem>
//         //   </DropdownMenu>
//         // </Dropdown>
//       )}
//     </>
//   );
// }
