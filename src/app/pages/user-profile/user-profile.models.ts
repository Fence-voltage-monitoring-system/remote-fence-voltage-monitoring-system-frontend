import { UserRole, UserStatus } from '../user-management/user-management.models';
export interface ProfileLocation { id: number; name: string; }
export interface ProfileFence extends ProfileLocation { code: string; }
export interface ProfileActivity { id: number; action: string; occurredAt: string; category: 'SECURITY' | 'ALERT' | 'FENCE' | 'ACCOUNT'; }
export interface CurrentUserProfile {
  id: number; staffId: string; initials: string; fullName: string; username: string; email: string; contactNumber: string; department: string;
  role: UserRole; status: UserStatus; mustChangePassword: boolean; provinces: ProfileLocation[]; districts: ProfileLocation[]; fences: ProfileFence[];
  createdAt: string; lastLoginAt: string; passwordChangedAt: string; recentActivity: ProfileActivity[];
}

export interface UpdateCurrentUserProfileRequest {
  fullName: string;
  contactNumber: string;
}
export interface UserNotificationPreferences {
  soundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  markAsReadOnOpen: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  groupSimilarNotifications: boolean;
  groupingWindowMinutes: number;
  digestEnabled: boolean;
  digestIntervalMinutes: number;
}
