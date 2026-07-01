import { TenantType } from '../../../generated';


export interface IRegisterStudentPayload {
  name: string;
  email: string;
  password: string;
}

export interface IRegisterOwnerPayload {
  name: string;
  email: string;
  password: string;
}

export interface IRegisterTenantPayload {
  name: string;
  email: string;
  password: string;
  tenantType: TenantType;
}

export interface ILoginUserPayload {
  email: string;
  password: string;
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}