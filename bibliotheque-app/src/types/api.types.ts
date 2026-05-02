export type { DashboardStats, PageResponse } from "./index";

export interface ApiError {
  message: string;
  timestamp?: string;
  path?: string;
}
