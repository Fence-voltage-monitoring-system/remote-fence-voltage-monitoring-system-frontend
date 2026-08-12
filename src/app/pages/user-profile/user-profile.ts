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
  profile: CurrentUserProfile = {
    id: 3, staffId: 'DWC-1042', initials: 'ND', fullName: 'Nimal Dissanayake', username: 'ndissanayake', email: 'ndissanayake@dwc.gov.lk', contactNumber: '+94 77 345 6789', department: 'Wildlife Conservation', role: 'FIELD_ADMIN', status: 'ACTIVE', mustChangePassword: false,
    provinces: [{ id: 5, name: 'North Central' }], districts: [{ id: 12, name: 'Anuradhapura' }, { id: 13, name: 'Polonnaruwa' }], fences: [], createdAt: '10 May 2023', lastLoginAt: '23 Jul 2026, 08:30', passwordChangedAt: '12 Jul 2026',
    recentActivity: [{ id: 1, action: 'Logged in successfully', occurredAt: '23 Jul 2026, 08:30', category: 'SECURITY' }, { id: 2, action: 'Acknowledged alert ALT-2844', occurredAt: '22 Jul 2026, 16:20', category: 'ALERT' }, { id: 3, action: 'Updated fence inspection report', occurredAt: '22 Jul 2026, 14:05', category: 'FENCE' }, { id: 4, action: 'Updated contact information', occurredAt: '18 Jul 2026, 09:42', category: 'ACCOUNT' }],
  };
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
      next: (profile) => { this.profile = profile; this.notice = ''; },
      error: () => { this.profileLoadFailed = true; this.notice = 'Profile API unavailable. Displaying preview data.'; },
    });
  }

  showNotice(message: string): void { this.notice = message; }
  applyProfileUpdate(profile: CurrentUserProfile): void {
    this.profile = profile;
    this.isEditProfileOpen = false;
    this.notice = 'Your profile was updated successfully.';
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
