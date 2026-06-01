export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type UserRole = 'USER' | 'ADMIN';

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  status: UserStatus;
  role: UserRole;
}

export interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: UserStatus;
  role: UserRole;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
