export type UserRole = "SuperAdmin" | "Admin" | "Cashier" | "Lab" | "MedTech";

export interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface User {
  id: string;
  userName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  photoUrl?: string | null;
  hasPhoto: boolean;
  profile: UserProfile;
}

export interface CreateUserRequest {
  userName: string;
  email: string;
  password: string;
  role: number;
  firstName: string;
  lastName: string;
}

export interface UpdateUserRequest {
  userName?: string;
  email?: string;
  role?: number;
  isActive?: boolean;
  firstName?: string;
  lastName?: string;
}


