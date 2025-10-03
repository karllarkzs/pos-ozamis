import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  userName: string;
  email: string;
  role: number;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  photoUrl: string | null;
  hasPhoto: boolean;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
}

export type RoleName = "Cashier" | "Admin" | "Lab";

export const getRoleName = (roleNumber: number): RoleName => {
  switch (roleNumber) {
    case 1:
      return "Cashier";
    case 2:
      return "Admin";
    case 3:
      return "Lab";
    default:
      return "Cashier";
  }
};

export const getRoleNumber = (roleName: RoleName): number => {
  switch (roleName) {
    case "Cashier":
      return 1;
    case "Admin":
      return 2;
    case "Lab":
      return 3;
    default:
      return 1;
  }
};

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  tokenExpiresAt: string | null;
  lastActivity: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accessToken: null,
  tokenExpiresAt: null,
  lastActivity: null,
};

export interface LoginPayload {
  user: User;
  accessToken: string;
  expiresAt: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    loginSuccess: (state, action: PayloadAction<LoginPayload>) => {
      const { user, accessToken, expiresAt } = action.payload;

      state.user = user;
      state.accessToken = accessToken;
      state.tokenExpiresAt = expiresAt;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.lastActivity = new Date().toISOString();

      localStorage.setItem("auth-token", accessToken);
    },

    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.tokenExpiresAt = null;

      localStorage.removeItem("auth-token");
    },

    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.tokenExpiresAt = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.lastActivity = null;

      localStorage.removeItem("auth-token");
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.lastActivity = new Date().toISOString();
    },

    updateProfile: (state, action: PayloadAction<UpdateProfilePayload>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    updateActivity: (state) => {
      state.lastActivity = new Date().toISOString();
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  updateProfile,
  updateActivity,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;

export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) =>
  state.auth.isLoading;
export const selectError = (state: { auth: AuthState }) => state.auth.error;
export const selectUserRole = (state: { auth: AuthState }) =>
  state.auth.user?.role;
export const selectUserRoleName = (state: { auth: AuthState }) =>
  state.auth.user ? getRoleName(state.auth.user.role) : null;
export const selectAccessToken = (state: { auth: AuthState }) =>
  state.auth.accessToken;
export const selectTokenExpiresAt = (state: { auth: AuthState }) =>
  state.auth.tokenExpiresAt;

export const hasRole = (userRole: number, requiredRole: number): boolean => {
  if (userRole === 2) return true;

  return userRole === requiredRole;
};

export const isAdmin = (userRole?: number): boolean => {
  return userRole === 2;
};

export const canAccessAdmin = (userRole?: number): boolean => {
  return userRole === 2;
};

export const canAccessPOS = (userRole?: number): boolean => {
  return userRole === 1 || userRole === 2;
};

export const canAccessLab = (userRole?: number): boolean => {
  return userRole === 3 || userRole === 2;
};

export const isTokenExpired = (tokenExpiresAt: string | null): boolean => {
  if (!tokenExpiresAt) return true;
  return new Date() > new Date(tokenExpiresAt);
};
