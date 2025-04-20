import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type BaseForm = {
  email: string;
  password: string;
};

export type User = {
  Id: string;
  UserName: string;
  PasswordHash: string;
  SecurityStamp: string;
  Discriminator: string;
  Email: string;
  Emailconfirmed: boolean;
  Phonenumber: string;
  Phonenumberconfirmed: boolean;
  Twofactorenabled: boolean;
  LockoutEndDateUtc: string | null;
  LockoutEnabled: boolean;
  AccessFailedCount: number;
  insco_id: number;
  provider_id: string | null;
  surname: string;
  firstname: string;
  ModifiedDateTime: string;
  User_id: number;
  DisciplineID: string | null;
  ProfilePicture: string | null;
  ProfilePictureType: string | null;
  DateOfBirth: string | null;
  Gender: string | null;
  Street: string | null;
  CityID: string | null;
  StateID: string | null;
  CountryID: string | null;
  TitleID: string | null;
  TitleName: string | null;
  ConcurrencyStamp: string | null;
  NormalizedUserName: string;
  NormalizedEmail: string;
  LOCKOUTEND: string | null;
  EnterService: boolean | null;
  ConsultServiceEntered: boolean | null;
  RegisterInvoice: boolean | null;
  ViewInvoices: boolean | null;
  Viewaccountstatement: boolean | null;
  Manageprescribers: boolean | null;
  ManageAdministrativestaff: boolean | null;
  ManageAccount: boolean | null;
  PracticeNumber: string | null;
  fixed: string | null;
  function: string | null;
  rightofconnection: string | null;
}

export interface LoginResponse {
  status: number;
  result: User[] | null;
  ErrorMessage: string;
}
