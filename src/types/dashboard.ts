import type { ActivityLog } from "@/types/activity";
import type { Favorite } from "@/types/favorite";
import type { AcademicUpload } from "@/types/upload";

export interface DashboardStats {
  totalUploads: number;
  totalStorageBytes: number;
  totalFavorites: number;
  sharedUploads: number;
}

export interface DashboardData {
  uploads: AcademicUpload[];
  favorites: Favorite[];
  activities: ActivityLog[];
  stats: DashboardStats;
}
