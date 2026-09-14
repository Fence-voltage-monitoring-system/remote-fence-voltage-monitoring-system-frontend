export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  accessToken?: string;
  tokenType?: string;
  refreshToken?: string;
  user: {
    id: string;
    fullName?: string;
    name?: string;
    email: string;
    role: string;
    contactNumber?: string;
    provinces?: string[];
    provinceNames?: string[];
    provinceIds?: number[];
    districts?: string[];
    districtNames?: string[];
    districtIds?: number[];
    fences?: string[];
    province?: string;
    district?: string;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
