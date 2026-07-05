import { TenantType, Gender, Profession } from '../../../generated';


export interface IRegisterStudentPayload {
  name: string;
  email: string;
  password: string;
  gender?: Gender;
}

export interface IRegisterOwnerPayload {
  name: string;
  email: string;
  password: string;
  whatsappNumber: string;
}

export interface IRegisterTenantPayload {
  name: string;
  email: string;
  password: string;
  tenantType: TenantType;
  profession?: Profession;
  gender?: Gender;
}

export interface ILoginUserPayload {
  email: string;
  password: string;
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
