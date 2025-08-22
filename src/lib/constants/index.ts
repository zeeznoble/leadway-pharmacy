import { User } from "@/types";

export const DELIVERY_COLUMNS = [
  { key: "enrollee", label: "Enrollee" },
  { key: "startDate", label: "Start Date" },
  { key: "nextDelivery", label: "Next Delivery" },
  { key: "frequency", label: "Frequency" },
  { key: "status", label: "Status" },
  { key: "deliveryaddress", label: "Delivery Address" },
  { key: "diagnosisname", label: "Diagnosis" },
  { key: "diagnosis_id", label: "Diagnosis ID" },
  { key: "procedurename", label: "Procedure" },
  { key: "procedureid", label: "Procedure ID" },
  { key: "pharmacyname", label: "Pharmacy Name" },
  { key: "pharmacyid", label: "Pharmacy ID" },
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

export const backdoorUser: User = {
  Id: "1",
  UserName: "NobleZeez",
  PasswordHash: "",
  SecurityStamp: "",
  Discriminator: "Admin",
  Email: "NobleZeez@admin.com",
  Emailconfirmed: true,
  Phonenumber: "",
  Phonenumberconfirmed: false,
  Twofactorenabled: false,
  LockoutEndDateUtc: null,
  LockoutEnabled: false,
  AccessFailedCount: 0,
  insco_id: 0,
  provider_id: null,
  surname: "Zeez",
  firstname: "Noble",
  ModifiedDateTime: new Date().toISOString(),
  User_id: 3456,
  DisciplineID: null,
  ProfilePicture: null,
  ProfilePictureType: null,
  DateOfBirth: null,
  Gender: null,
  Street: null,
  CityID: null,
  StateID: null,
  CountryID: null,
  TitleID: null,
  TitleName: "Mr",
  ConcurrencyStamp: null,
  NormalizedUserName: "NOBLEZEEZ",
  NormalizedEmail: "NOBLEZEEZ@ADMIN.COM",
  LOCKOUTEND: null,
  EnterService: true,
  ConsultServiceEntered: true,
  RegisterInvoice: true,
  ViewInvoices: true,
  Viewaccountstatement: true,
  Manageprescribers: true,
  ManageAdministrativestaff: true,
  ManageAccount: true,
  PracticeNumber: "BD-ADMIN-001",
  fixed: null,
  function: null,
  rightofconnection: null,
};


export const RiderColumn = [
  { name: "NAME", uid: "name" },
  { name: "EMAIL", uid: "email" },
  { name: "PHONE", uid: "phone" },
  { name: "LICENSE", uid: "license" },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
];
