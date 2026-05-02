import { apiClient } from "./client";
import type { AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest } from "@/types";
import type { AxiosError } from "axios";

export const authApi = {
  login: (payload: LoginRequest & { totpCode?: string }) => apiClient.post<AuthResponse>("/auth/login", payload),
  register: (payload: RegisterRequest & { confirmerMotDePasse?: string }) => {
    const { confirmerMotDePasse: _ignore, ...clean } = payload;
    return apiClient.post<AuthResponse>("/auth/register", clean);
  },
  refresh: (refreshToken: string) => apiClient.post<AuthResponse>("/auth/refresh", { refreshToken }),
  logout: () => apiClient.post("/auth/logout"),
  verifyEmail: (token: string) => apiClient.get("/auth/verify-email", { params: { token } }),
  resendVerification: (email: string) => apiClient.post("/auth/resend-verification", { email }),
  setup2fa: () => apiClient.post<{ secret: string; otpAuthUrl: string }>("/auth/2fa/setup"),
  activate2fa: (code: string) => apiClient.post("/auth/2fa/activate", { code }),
  disable2fa: (motDePasse: string) => apiClient.post("/auth/2fa/disable", { motDePasse }),
  forgotPassword: (payload: ForgotPasswordRequest) => apiClient.post("/auth/forgot-password", payload),
  resetPassword: (payload: { token: string; nouveauMotDePasse: string }) =>
    apiClient.post("/auth/reset-password", payload),
  changePassword: (payload: { ancienMotDePasse: string; nouveauMotDePasse: string }) =>
    apiClient.post("/auth/change-password", payload),
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  const err = error as AxiosError<{ message?: string }>;
  return err?.response?.data?.message ?? fallback;
}
