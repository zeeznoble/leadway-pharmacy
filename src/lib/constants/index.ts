export const DELIVERY_COLUMNS = [
  { key: "enrollee", label: "Enrollee" },
  { key: "startDate", label: "Start Date" },
  { key: "nextDelivery", label: "Next Delivery" },
  { key: "frequency", label: "Frequency" },
  { key: "status", label: "Status" },
  { key: "diagnosisname", label: "Diagnosis" }, // New
  { key: "diagnosis_id", label: "Diagnosis ID" }, // New
  { key: "procedurename", label: "Procedure" }, // New
  { key: "procedureid", label: "Procedure ID" }, // New
  { key: "pharmacyname", label: "Pharmacy Name" }, // New
  { key: "pharmacyid", label: "Pharmacy ID" }, // New
  { key: "cost", label: "Cost" }, // New
];

export const BENEFITS_COLUMNS = [
  { key: "Benefit", label: "BENEFIT" },
  { key: "Limit", label: "LIMIT" },
  { key: "Used", label: "USED" },
  { key: "Balance", label: "BALANCE" },
];


export const PROVIDERS_COLUMNS = [
  { key: "serial", label: "S/N" },
  { key: "provider", label: "PROVIDER" },
  // { key: "email", label: "EMAIL" },
  { key: "ProviderAddress", label: "ADDRESS" },
];

export const ENROLLEE_COLUMNS = [
  { key: "serial", label: "S/N" },
  { key: "Member_FirstName", label: "First Name" },
  { key: "Member_Surname", label: "Surname" },
  { key: "Member_othernames", label: "Other Names" },
  { key: "Member_Phone_One", label: "Member Phone" },
  { key: "Member_EmailAddress_One", label: "Member EmailAddress" },
  { key: "Member_Age", label: "Age" },
  { key: "Member_maritalstatusDescr", label: "Marital Status" },
  { key: "Member_Gender", label: "Gender" },
  { key: "Member_MemberStatus_Description", label: "Status" },
  { key: "Plan_Category", label: "Plan Category" },
];
