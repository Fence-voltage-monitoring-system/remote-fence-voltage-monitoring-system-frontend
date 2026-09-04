export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  user: {
    id: string;
    fullName?: string;
    name?: string;
    email: string;
    role: string;
    contactNumber?: string;
    provinces?: string[];
    districts?: string[];
    fences?: string[];
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
