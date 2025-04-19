import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type BaseForm = {
  email: string;
  password: string;
};

export type User = {
  id: string;
  userName: string;
  passwordHash: string;
  securityStamp: string;
  discriminator: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber: string;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEndDateUtc: string | null;
  lockoutEnabled: boolean;
  accessFailedCount: number;
  inscoId: number;
  providerId: string | null;
  surname: string;
  firstname: string;
  modifiedDateTime: string;
  userId: number;
  disciplineId: string | null;
  profilePicture: string | null;
  profilePictureType: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  street: string | null;
  cityId: string | null;
  stateId: string | null;
  countryId: string | null;
  titleId: string | null;
  titleName: string | null;
  concurrencyStamp: string | null;
  normalizedUserName: string;
  normalizedEmail: string;
  lockoutEnd: string | null;
  enterService: string | null;
  consultServiceEntered: string | null;
  registerInvoice: string | null;
  viewInvoices: string | null;
  viewAccountStatement: string | null;
  managePrescribers: string | null;
  manageAdministrativeStaff: string | null;
  manageAccount: string | null;
  practiceNumber: string | null;
  fixed: string | null;
  function: string | null;
  rightOfConnection: string | null;
};

export type LoginResponse = {
  status: number;
  result: User[] | null;
  errorMessage: string;
};
