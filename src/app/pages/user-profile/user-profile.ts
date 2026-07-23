import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { ActivityList } from './components/activity-list/activity-list';
import { AssignmentSummary } from './components/assignment-summary/assignment-summary';
import { PersonalInformation } from './components/personal-information/personal-information';
import { ProfileEditDrawer } from './components/profile-edit-drawer/profile-edit-drawer';
import { ProfileSummary } from './components/profile-summary/profile-summary';
import { SecuritySettings } from './components/security-settings/security-settings';
import { CurrentUserProfile } from './user-profile.models';

@Component({ selector: 'app-current-user-profile', standalone: true, imports: [ProfileSummary, PersonalInformation, AssignmentSummary, SecuritySettings, ActivityList, ProfileEditDrawer], templateUrl: './user-profile.html' })
export class UserProfilePage implements OnInit {
  private readonly userService = inject(UserService);
  profile: CurrentUserProfile = {
    id: 3, staffId: 'DWC-1042', initials: 'ND', fullName: 'Nimal Dissanayake', username: 'ndissanayake', email: 'ndissanayake@dwc.gov.lk', contactNumber: '+94 77 345 6789', department: 'Wildlife Conservation', role: 'FIELD_ADMIN', status: 'ACTIVE', mustChangePassword: false,
    provinces: [{ id: 5, name: 'North Central' }], districts: [{ id: 12, name: 'Anuradhapura' }, { id: 13, name: 'Polonnaruwa' }], fences: [], createdAt: '10 May 2023', lastLoginAt: '23 Jul 2026, 08:30', passwordChangedAt: '12 Jul 2026',
    recentActivity: [{ id: 1, action: 'Logged in successfully', occurredAt: '23 Jul 2026, 08:30', category: 'SECURITY' }, { id: 2, action: 'Acknowledged alert ALT-2844', occurredAt: '22 Jul 2026, 16:20', category: 'ALERT' }, { id: 3, action: 'Updated fence inspection report', occurredAt: '22 Jul 2026, 14:05', category: 'FENCE' }, { id: 4, action: 'Updated contact information', occurredAt: '18 Jul 2026, 09:42', category: 'ACCOUNT' }],
  };
  notice = '';
  isEditProfileOpen = false;

  ngOnInit(): void { this.userService.getCurrentProfile().subscribe({ next: (profile) => { this.profile = profile; }, error: () => { this.notice = 'Profile API unavailable. Displaying preview data.'; } }); }
  showNotice(message: string): void { this.notice = message; }
  applyProfileUpdate(profile: CurrentUserProfile): void { this.profile = profile; this.isEditProfileOpen = false; this.notice = 'Your profile was updated successfully.'; }
}
