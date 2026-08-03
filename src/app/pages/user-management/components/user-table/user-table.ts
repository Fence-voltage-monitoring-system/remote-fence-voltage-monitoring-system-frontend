import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ROLE_LABELS, SystemUser, UserRole } from '../../user-management.models';

@Component({ selector: 'app-user-table', standalone: true, templateUrl: './user-table.html' })
export class UserTable {
  @Input() users: SystemUser[] = [];
  @Input() selectedUserId: number | null = null;
  @Input() currentPage = 1;
  @Input() pageSize = 20;
  @Input() totalUsers = 0;
  @Output() userSelected = new EventEmitter<SystemUser>();
  @Output() pageChange = new EventEmitter<number>();
  readonly roleLabels = ROLE_LABELS;

  get totalPages(): number { return Math.max(1, Math.ceil(this.totalUsers / this.pageSize)); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, index) => index + 1); }
  get firstItem(): number { return this.totalUsers === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
  get lastItem(): number { return Math.min(this.currentPage * this.pageSize, this.totalUsers); }

  roleClass(role: UserRole): string {
    return ({
      SUPER_ADMIN: 'border-[#a84128] bg-[#63271d]/45 text-[#ff563c]',
      REGIONAL_ADMIN: 'border-[#8d7000] bg-[#5b4b08]/55 text-[#ffc400]',
      FIELD_ADMIN: 'border-[#2c8146] bg-[#205a31]/55 text-[#45dc72]',
      MAINTENANCE: 'border-[#59615a] bg-[#485149]/55 text-[#89918b]',
    } satisfies Record<UserRole, string>)[role];
  }
}
