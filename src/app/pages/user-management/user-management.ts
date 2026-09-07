import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { UserProfile } from './components/user-profile/user-profile';
import { UserCreateDrawer } from './components/user-create-drawer/user-create-drawer';
import { UserTable } from './components/user-table/user-table';
import { UserToolbar } from './components/user-toolbar/user-toolbar';
import { CurrentUserProfile } from '../user-profile/user-profile.models';
import { SystemUser, UserFilters } from './user-management.models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [UserToolbar, UserTable, UserProfile, UserCreateDrawer],
  templateUrl: './user-management.html',
})
export class UserManagement implements OnInit {
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  users: SystemUser[] = [];

  currentUserProfile: CurrentUserProfile | null = null;
  filters: UserFilters = { search: '', role: '', province: '', status: '' };
  selectedUser: SystemUser | null = null;
  isCreateDrawerOpen = false;
  isEditDrawerOpen = false;
  editingUser: SystemUser | null = null;
  notice = '';
  readonly pageSize = 20;
  currentPage = 1;

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsers();
  }

  private loadCurrentUser(): void {
    this.userService.getCurrentProfile().subscribe({
      next: (profile) => {
        this.currentUserProfile = profile;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  canManageUser(targetUser: SystemUser | null): boolean {
    if (!targetUser) return false;
    if (!this.currentUserProfile) return true;

    const actorRole = this.currentUserProfile.role;

    if (actorRole === 'SUPER_ADMIN') {
      return true;
    }

    if (actorRole === 'REGIONAL_ADMIN') {
      if (targetUser.role === 'SUPER_ADMIN') return false;

      const actorProvinceIds = (this.currentUserProfile.provinces || []).map((p) => p.id);
      const targetProvinceIds = targetUser.provinceIds || [];

      if (targetProvinceIds.length > 0 && actorProvinceIds.length > 0) {
        return targetProvinceIds.some((id: number | string) => actorProvinceIds.includes(id as any));
      }

      const actorProvinceNames = (this.currentUserProfile.provinces || []).map((p) => p.name.toLowerCase());
      if (targetUser.province && actorProvinceNames.length > 0) {
        return actorProvinceNames.some((name) => targetUser.province.toLowerCase().includes(name));
      }

      return false;
    }

    if (actorRole === 'FIELD_ADMIN') {
      if (targetUser.role !== 'MAINTENANCE') return false;

      const actorDistrictIds = (this.currentUserProfile.districts || []).map((d) => d.id);
      const targetDistrictIds = targetUser.districtIds || [];

      if (targetDistrictIds.length > 0 && actorDistrictIds.length > 0) {
        return targetDistrictIds.some((id: number | string) => actorDistrictIds.includes(id as any));
      }

      const actorProvinceIds = (this.currentUserProfile.provinces || []).map((p) => p.id);
      const targetProvinceIds = targetUser.provinceIds || [];
      if (targetProvinceIds.length > 0 && actorProvinceIds.length > 0) {
        return targetProvinceIds.some((id: number | string) => actorProvinceIds.includes(id as any));
      }

      return true;
    }

    return false;
  }

  loadUsers(): void {
    this.userService.getUsers(this.filters).subscribe({
      next: (users) => {
        this.users = [...users];
        if (!this.selectedUser || !users.some(u => u.id === this.selectedUser?.id)) {
          this.selectedUser = users[0] ?? null;
        }
        this.notice = '';
        this.cdr.markForCheck();
      },
      error: () => {
        this.notice = 'Unable to connect to User API.';
        this.cdr.markForCheck();
      },
    });
  }

  get provinces(): string[] { return [...new Set(this.users.map((user) => user.province).filter((province) => province !== 'All'))]; }
  get existingEmails(): string[] { return this.users.map((user) => user.email); }
  get filteredUsers(): SystemUser[] {
    const search = (this.filters?.search || '').trim().toLowerCase();
    const roleFilter = (this.filters?.role || '').trim();
    const provinceFilter = (this.filters?.province || '').trim();
    const statusFilter = (this.filters?.status || '').trim();

    return this.users.filter((user) => {
      const matchesSearch = !search ||
        (user.name && user.name.toLowerCase().includes(search)) ||
        (user.email && user.email.toLowerCase().includes(search));

      const matchesRole = !roleFilter ||
        roleFilter === 'All' ||
        roleFilter === 'All Roles' ||
        user.role === roleFilter;

      const matchesProvince = !provinceFilter ||
        provinceFilter === 'All' ||
        provinceFilter === 'All Provinces' ||
        user.province === provinceFilter;

      const matchesStatus = !statusFilter ||
        statusFilter === 'All' ||
        statusFilter === 'All Status' ||
        user.status === statusFilter;

      return matchesSearch && matchesRole && matchesProvince && matchesStatus;
    });
  }

  get paginatedUsers(): SystemUser[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  showNotice(message: string): void { this.notice = message; this.cdr.markForCheck(); }
  updateFilters(filters: UserFilters): void { this.filters = { ...filters }; this.currentPage = 1; this.cdr.markForCheck(); }
  selectUser(user: SystemUser): void { this.selectedUser = user; this.notice = ''; }
  toggleUserStatus(user: SystemUser): void {
    if (!this.canManageUser(user)) {
      this.showNotice('You do not have permission to manage this user account.');
      return;
    }
    const status = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.userService.updateStatus(user.id, status).subscribe({
      next: (updatedUser) => { Object.assign(user, updatedUser); this.showNotice(`${user.name}'s account is now ${user.status.toLowerCase()}.`); },
      error: () => { this.showNotice(`Unable to update ${user.name}'s account status.`); },
    });
  }

  resetUserPassword(user: SystemUser): void {
    if (!this.canManageUser(user)) {
      this.showNotice('You do not have permission to manage this user account.');
      return;
    }
    if (!confirm(`Reset password for ${user.name}?`)) return;
    this.userService.resetPassword(user.id).subscribe({
      next: (response) => { this.showNotice(response.message || `Password reset for ${user.name}.`); },
      error: () => {
        // If API is unavailable, provide a helpful fallback message.
        this.showNotice(`Unable to contact server. If this is a preview, password reset can be performed on the server. (Fallback simulated)`);
      },
    });
  }

  deleteUserAccount(user: SystemUser): void {
    if (this.currentUserProfile?.role !== 'SUPER_ADMIN') {
      this.showNotice('Only Super Admin can permanently delete user accounts.');
      return;
    }
    if (!confirm(`Are you sure you want to PERMANENTLY delete user "${user.name}"? This action cannot be undone.`)) {
      return;
    }
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== user.id);
        if (this.selectedUser?.id === user.id) {
          this.selectedUser = this.users[0] ?? null;
        }
        this.showNotice(`User "${user.name}" has been permanently deleted.`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || `Unable to delete user ${user.name}.`;
        this.showNotice(errorMsg);
      },
    });
  }

  createUser(user: SystemUser): void {
    this.isCreateDrawerOpen = false;
    this.showNotice(`${user.name} was created successfully.`);
    this.loadUsers();
  }

  openEditUser(user: SystemUser): void {
    if (!this.canManageUser(user)) {
      this.showNotice('You do not have permission to manage this user account.');
      return;
    }
    this.editingUser = user;
    this.isEditDrawerOpen = true;
    this.notice = '';
  }

  onUserUpdated(user: SystemUser): void {
    const idx = this.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) Object.assign(this.users[idx], user);
    this.selectedUser = user;
    this.isEditDrawerOpen = false;
    this.editingUser = null;
    this.showNotice(`${user.name} was updated.`);
  }
}
