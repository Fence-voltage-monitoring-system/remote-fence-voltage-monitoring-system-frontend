import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { UserProfile } from './components/user-profile/user-profile';
import { UserCreateDrawer } from './components/user-create-drawer/user-create-drawer';
import { UserTable } from './components/user-table/user-table';
import { UserToolbar } from './components/user-toolbar/user-toolbar';
import { SystemUser, UserFilters } from './user-management.models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [UserToolbar, UserTable, UserProfile, UserCreateDrawer],
  templateUrl: './user-management.html',
})
export class UserManagement implements OnInit {
  private readonly userService = inject(UserService);
  readonly users: SystemUser[] = [
    { id: 1, initials: 'SA', name: 'Suresh Ambegoda', email: 'sambegoda@dwc.gov.lk', role: 'SUPER_ADMIN', province: 'All', district: 'All', status: 'ACTIVE', lastLogin: '2025-07-14 08:32', created: '2023-01-15', recentActivity: ['Logged in', 'Viewed Alerts', 'Acknowledged ALT-2844', 'Updated device config'] },
    { id: 2, initials: 'KP', name: 'Kasun Perera', email: 'kperera@dwc.gov.lk', role: 'REGIONAL_ADMIN', province: 'Uva', district: '—', status: 'ACTIVE', lastLogin: '2025-07-14 07:45', created: '2023-03-22', recentActivity: ['Logged in', 'Reviewed fence status'] },
    { id: 3, initials: 'ND', name: 'Nimal Dissanayake', email: 'ndissanayake@dwc.gov.lk', role: 'FIELD_ADMIN', province: 'North Central', district: 'Anuradhapura', status: 'ACTIVE', lastLogin: '2025-07-13 16:20', created: '2023-05-10', recentActivity: ['Acknowledged voltage alert'] },
    { id: 4, initials: 'RS', name: 'Ruwan Silva', email: 'rsilva@dwc.gov.lk', role: 'MAINTENANCE', province: 'Southern', district: 'Hambantota', status: 'ACTIVE', lastLogin: '2025-07-14 06:15', created: '2024-01-08', recentActivity: ['Updated maintenance log'] },
    { id: 5, initials: 'PF', name: 'Priya Fernando', email: 'pfernando@dwc.gov.lk', role: 'REGIONAL_ADMIN', province: 'Eastern', district: '—', status: 'ACTIVE', lastLogin: '2025-07-12 14:30', created: '2023-08-19', recentActivity: ['Viewed regional report'] },
    { id: 6, initials: 'CJ', name: 'Chamara Jayawardena', email: 'cjayawardena@dwc.gov.lk', role: 'FIELD_ADMIN', province: 'North Central', district: 'Polonnaruwa', status: 'INACTIVE', lastLogin: '2025-06-20 11:05', created: '2023-11-02', recentActivity: ['Account marked inactive'] },
    { id: 7, initials: 'MR', name: 'Malini Rajapaksa', email: 'mrajapaksa@dwc.gov.lk', role: 'MAINTENANCE', province: 'Uva', district: 'Monaragala', status: 'ACTIVE', lastLogin: '2025-07-14 05:50', created: '2024-03-15', recentActivity: ['Completed inspection'] },
    { id: 8, initials: 'AW', name: 'Anura Wickremasinghe', email: 'awickrema@dwc.gov.lk', role: 'FIELD_ADMIN', province: 'Southern', district: 'Hambantota', status: 'INACTIVE', lastLogin: '2025-05-10 09:22', created: '2023-07-07', recentActivity: ['Account marked inactive'] },
    { id: 9, initials: 'SD', name: 'Sachini De Silva', email: 'sdesilva@dwc.gov.lk', role: 'REGIONAL_ADMIN', province: 'Western', district: '—', status: 'ACTIVE', lastLogin: '2025-07-14 09:10', created: '2024-02-11', recentActivity: ['Reviewed regional dashboard', 'Exported monthly report'] },
    { id: 10, initials: 'HT', name: 'Harsha Tennakoon', email: 'htennakoon@dwc.gov.lk', role: 'FIELD_ADMIN', province: 'Central', district: 'Kandy', status: 'ACTIVE', lastLogin: '2025-07-13 18:42', created: '2024-04-19', recentActivity: ['Inspected fence status', 'Acknowledged alert'] },
    { id: 11, initials: 'IM', name: 'Ishara Madushani', email: 'imadushani@dwc.gov.lk', role: 'MAINTENANCE', province: 'Eastern', district: 'Batticaloa', status: 'ACTIVE', lastLogin: '2025-07-14 06:48', created: '2024-06-03', recentActivity: ['Completed voltage inspection'] },
    { id: 12, initials: 'GR', name: 'Gayan Rathnayake', email: 'grathnayake@dwc.gov.lk', role: 'FIELD_ADMIN', province: 'Sabaragamuwa', district: 'Ratnapura', status: 'ACTIVE', lastLogin: '2025-07-13 15:17', created: '2023-12-09', recentActivity: ['Updated field report'] },
    { id: 13, initials: 'WK', name: 'Wasana Kumari', email: 'wkumari@dwc.gov.lk', role: 'MAINTENANCE', province: 'North Western', district: 'Kurunegala', status: 'INACTIVE', lastLogin: '2025-06-18 10:25', created: '2024-07-21', recentActivity: ['Account marked inactive'] },
    { id: 14, initials: 'DP', name: 'Dilan Peris', email: 'dperis@dwc.gov.lk', role: 'REGIONAL_ADMIN', province: 'Northern', district: '—', status: 'ACTIVE', lastLogin: '2025-07-14 08:05', created: '2023-09-28', recentActivity: ['Reviewed northern region alerts'] },
    { id: 15, initials: 'NS', name: 'Nadeesha Senanayake', email: 'nsenanayake@dwc.gov.lk', role: 'FIELD_ADMIN', province: 'Western', district: 'Gampaha', status: 'ACTIVE', lastLogin: '2025-07-12 13:56', created: '2024-01-26', recentActivity: ['Assigned maintenance task'] },
    { id: 16, initials: 'RK', name: 'Ravindu Karunaratne', email: 'rkarunaratne@dwc.gov.lk', role: 'MAINTENANCE', province: 'Uva', district: 'Badulla', status: 'ACTIVE', lastLogin: '2025-07-14 05:35', created: '2024-08-14', recentActivity: ['Repaired fence controller', 'Closed maintenance task'] },
    { id: 17, initials: 'TA', name: 'Tharushi Abeysekara', email: 'tabeysekara@dwc.gov.lk', role: 'FIELD_ADMIN', province: 'Eastern', district: 'Trincomalee', status: 'INACTIVE', lastLogin: '2025-05-29 11:44', created: '2024-03-07', recentActivity: ['Account marked inactive'] },
    { id: 18, initials: 'BM', name: 'Buddhika Mendis', email: 'bmendis@dwc.gov.lk', role: 'MAINTENANCE', province: 'Southern', district: 'Matara', status: 'ACTIVE', lastLogin: '2025-07-13 07:28', created: '2024-05-30', recentActivity: ['Recorded fence voltage reading'] },
    { id: 19, initials: 'AK', name: 'Amila Kumara', email: 'akumara@dwc.gov.lk', role: 'FIELD_ADMIN', province: 'Central', district: 'Matale', status: 'ACTIVE', lastLogin: '2025-07-14 07:12', created: '2024-06-18', recentActivity: ['Reviewed field inspection'] },
    { id: 20, initials: 'CS', name: 'Chathurika Silva', email: 'csilva@dwc.gov.lk', role: 'MAINTENANCE', province: 'Western', district: 'Kalutara', status: 'ACTIVE', lastLogin: '2025-07-13 16:08', created: '2024-09-04', recentActivity: ['Updated fence controller'] },
    { id: 21, initials: 'JM', name: 'Janaka Munasinghe', email: 'jmunasinghe@dwc.gov.lk', role: 'REGIONAL_ADMIN', province: 'Central', district: '—', status: 'ACTIVE', lastLogin: '2025-07-14 08:44', created: '2023-10-17', recentActivity: ['Reviewed regional performance'] },
    { id: 22, initials: 'PN', name: 'Piumi Nawarathna', email: 'pnawarathna@dwc.gov.lk', role: 'FIELD_ADMIN', province: 'North Western', district: 'Puttalam', status: 'INACTIVE', lastLogin: '2025-06-02 12:36', created: '2024-02-22', recentActivity: ['Account marked inactive'] },
    { id: 23, initials: 'LU', name: 'Lahiru Udayanga', email: 'ludayanga@dwc.gov.lk', role: 'MAINTENANCE', province: 'North Central', district: 'Anuradhapura', status: 'ACTIVE', lastLogin: '2025-07-14 05:58', created: '2024-10-09', recentActivity: ['Completed battery replacement'] },
    { id: 24, initials: 'KB', name: 'Kaushalya Bandara', email: 'kbandara@dwc.gov.lk', role: 'FIELD_ADMIN', province: 'Uva', district: 'Badulla', status: 'ACTIVE', lastLogin: '2025-07-13 14:27', created: '2024-01-12', recentActivity: ['Created inspection schedule'] },
    { id: 25, initials: 'DM', name: 'Dinithi Maheshika', email: 'dmaheshika@dwc.gov.lk', role: 'MAINTENANCE', province: 'Sabaragamuwa', district: 'Kegalle', status: 'ACTIVE', lastLogin: '2025-07-12 09:41', created: '2024-11-01', recentActivity: ['Reported damaged fence section'] },
    { id: 26, initials: 'SR', name: 'Sajith Ranasinghe', email: 'sranasinghe@dwc.gov.lk', role: 'REGIONAL_ADMIN', province: 'Sabaragamuwa', district: '—', status: 'ACTIVE', lastLogin: '2025-07-14 08:18', created: '2023-11-25', recentActivity: ['Approved regional maintenance plan'] },
    { id: 27, initials: 'MT', name: 'Madhavi Thilakaratne', email: 'mthilakaratne@dwc.gov.lk', role: 'FIELD_ADMIN', province: 'Northern', district: 'Vavuniya', status: 'ACTIVE', lastLogin: '2025-07-11 15:03', created: '2024-05-16', recentActivity: ['Reviewed voltage anomalies'] },
    { id: 28, initials: 'YA', name: 'Yasiru Abeywardena', email: 'yabeywardena@dwc.gov.lk', role: 'MAINTENANCE', province: 'Eastern', district: 'Ampara', status: 'INACTIVE', lastLogin: '2025-05-22 10:14', created: '2024-08-27', recentActivity: ['Account marked inactive'] },
  ];

  filters: UserFilters = { search: '', role: '', province: '', status: '' };
  selectedUser: SystemUser | null = this.users[0];
  isCreateDrawerOpen = false;
  notice = '';
  readonly pageSize = 20;
  currentPage = 1;

  ngOnInit(): void {
    this.userService.getUsers(this.filters).subscribe({
      next: (users) => {
        this.users.splice(0, this.users.length, ...users);
        this.selectedUser = users[0] ?? null;
      },
      error: () => { this.notice = 'The user API is unavailable. Displaying local preview data.'; },
    });
  }

  get provinces(): string[] { return [...new Set(this.users.map((user) => user.province).filter((province) => province !== 'All'))]; }
  get existingEmails(): string[] { return this.users.map((user) => user.email); }
  get filteredUsers(): SystemUser[] {
    const search = this.filters.search.trim().toLowerCase();
    return this.users.filter((user) =>
      (!search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search)) &&
      (!this.filters.role || user.role === this.filters.role) &&
      (!this.filters.province || user.province === this.filters.province) &&
      (!this.filters.status || user.status === this.filters.status));
  }
  get paginatedUsers(): SystemUser[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  showNotice(message: string): void { this.notice = message; }
  updateFilters(filters: UserFilters): void { this.filters = filters; this.currentPage = 1; }
  selectUser(user: SystemUser): void { this.selectedUser = user; this.notice = ''; }
  toggleUserStatus(user: SystemUser): void {
    const status = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.userService.updateStatus(user.id, status).subscribe({
      next: (updatedUser) => { Object.assign(user, updatedUser); this.showNotice(`${user.name}'s account is now ${user.status.toLowerCase()}.`); },
      error: () => { this.showNotice(`Unable to update ${user.name}'s account status.`); },
    });
  }

  resetUserPassword(user: SystemUser): void {
    this.userService.resetPassword(user.id).subscribe({
      next: (response) => { this.showNotice(response.message || `Password reset for ${user.name}.`); },
      error: () => { this.showNotice(`Unable to reset ${user.name}'s password.`); },
    });
  }

  createUser(user: SystemUser): void {
    this.users.push(user);
    this.selectedUser = user;
    this.isCreateDrawerOpen = false;
    this.showNotice(`${user.name} was created successfully.`);
  }
}
