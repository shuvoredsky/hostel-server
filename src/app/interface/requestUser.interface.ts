import { Role } from '../../generated';

export interface IRequestUser {
  userId: string;
  email: string;
  role: Role;
}