import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ActivityList } from './components/activity-list/activity-list';
import { ChangePasswordDrawer } from './components/change-password-drawer/change-password-drawer';
import { AssignmentSummary } from './components/assignment-summary/assignment-summary';
import { PersonalInformation } from './components/personal-information/personal-information';
import { ProfileEditDrawer } from './components/profile-edit-drawer/profile-edit-drawer';
import { ProfileSummary } from './components/profile-summary/profile-summary';
import { SecuritySettings } from './components/security-settings/security-settings';
import { NotificationPreferences } from './components/notification-preferences/notification-preferences';
import { CurrentUserProfile, UserNotificationPreferences } from './user-profile.models';

@Component({ selector: 'app-current-user-profile', standalone: true, imports: [ProfileSummary, PersonalInformation, AssignmentSummary, SecuritySettings, NotificationPreferences, ActivityList, ProfileEditDrawer, ChangePasswordDrawer], templateUrl: './user-profile.html', styleUrl: './user-profile.css', encapsulation: ViewEncapsulation.None })
export class UserProfilePage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  get initialProfile(): CurrentUserProfile {
    const user = this.authService.currentUser();
    const fullName = user?.fullName || 'System Administrator';
    const email = user?.email || 'admin@nerdc.lk';
    const contactNumber = user?.contactNumber || '';
    const role = (user?.role as any) || 'SUPER_ADMIN';
    const parts = fullName.trim().split(' ');
    const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : fullName.substring(0, 2).toUpperCase();

    return {
      id: 1, staffId: 'NERDC-ADMIN-01', initials, fullName, username: email.split('@')[0], email, contactNumber, department: 'Department of Wildlife Conservation / NERDC', role, status: 'ACTIVE', mustChangePassword: false,
      provinces: [], districts: [], fences: [], createdAt: '01 Jan 2026', lastLoginAt: 'Just now', passwordChangedAt: 'Not set',
      recentActivity: [{ id: 1, action: 'Logged in successfully', occurredAt: 'Just now', category: 'SECURITY' }],
    };
  }

  profile: CurrentUserProfile = this.initialProfile;
  notice = '';
  isEditProfileOpen = false;
  isChangePasswordOpen = false;
  isLoadingProfile = false;
  profileLoadFailed = false;
  isSigningOutOtherSessions = false;
  isSavingNotificationPreferences=false;
  notificationPreferences:UserNotificationPreferences={soundEnabled:true,desktopNotificationsEnabled:false,markAsReadOnOpen:true,quietHoursEnabled:false,quietHoursStart:'22:00',quietHoursEnd:'06:00',groupSimilarNotifications:true,groupingWindowMinutes:30,digestEnabled:false,digestIntervalMinutes:60};

  ngOnInit(): void { this.loadProfile();this.loadNotificationPreferences(); }

  loadNotificationPreferences():void{this.userService.getNotificationPreferences().subscribe({next:value=>this.notificationPreferences=value,error:()=>{}});}

  async saveNotificationPreferences(value:UserNotificationPreferences):Promise<void>{
    const next={...value};
    if(next.desktopNotificationsEnabled&&typeof Notification!=='undefined'&&Notification.permission!=='granted'){
      const permission=await Notification.requestPermission();
      if(permission!=='granted'){next.desktopNotificationsEnabled=false;this.notice='Browser permission was not granted. Desktop notifications remain disabled.';}
    }
    this.isSavingNotificationPreferences=true;
    this.userService.updateNotificationPreferences(next).pipe(finalize(()=>this.isSavingNotificationPreferences=false)).subscribe({next:saved=>{this.notificationPreferences=saved;this.notice='Notification preferences saved.';},error:()=>{this.notificationPreferences=next;this.notice='Profile API unavailable. Notification preferences are saved in local preview only.';}});
  }

  loadProfile(): void {
    this.isLoadingProfile = true;
    this.profileLoadFailed = false;
    this.userService.getCurrentProfile().pipe(finalize(() => { this.isLoadingProfile = false; })).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.notice = '';
        const current = this.authService.currentUser();
        if (current && profile.contactNumber) {
          const updated = { ...current, fullName: profile.fullName, contactNumber: profile.contactNumber };
          this.authService.currentUser.set(updated);
          sessionStorage.setItem('auth_user_session', JSON.stringify(updated));
        }
      },
      error: () => { this.profileLoadFailed = true; this.notice = 'Profile API unavailable. Displaying preview data.'; },
    });
  }

  showNotice(message: string): void { this.notice = message; }
  applyProfileUpdate(profile: CurrentUserProfile): void {
    this.profile = profile;
    this.isEditProfileOpen = false;
    this.notice = 'Your profile was updated successfully.';
    const current = this.authService.currentUser();
    if (current) {
      const updated = { ...current, fullName: profile.fullName, contactNumber: profile.contactNumber };
      this.authService.currentUser.set(updated);
      sessionStorage.setItem('auth_user_session', JSON.stringify(updated));
    }
  }

  completePasswordChange(message: string): void {
    this.isChangePasswordOpen = false;
    const changedAt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
    this.profile = {
      ...this.profile,
      passwordChangedAt: changedAt,
      mustChangePassword: false,
      recentActivity: [{ id: Date.now(), action: 'Password changed', occurredAt: changedAt, category: 'SECURITY' }, ...this.profile.recentActivity],
    };
    this.notice = message;
  }

  signOutOtherSessions(): void {
    if (!window.confirm('Sign out all other devices currently using your account?')) return;
    this.isSigningOutOtherSessions = true;
    this.authService.signOutOtherSessions().pipe(finalize(() => { this.isSigningOutOtherSessions = false; })).subscribe({
      next: (response) => {
        this.notice = response.message || `${response.revokedSessions} other sessions were signed out.`;
        this.profile = { ...this.profile, recentActivity: [{ id: Date.now(), action: 'Signed out other sessions', occurredAt: 'Just now', category: 'SECURITY' }, ...this.profile.recentActivity] };
      },
      error: () => { this.notice = 'Unable to sign out other sessions. Please try again.'; },
    });
  }
}
