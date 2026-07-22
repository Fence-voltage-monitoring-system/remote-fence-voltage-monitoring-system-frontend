import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ROLE_LABELS, SystemUser } from '../../user-management.models';

@Component({ selector: 'app-user-profile', standalone: true, templateUrl: './user-profile.html', styleUrl: './user-profile.css' })
export class UserProfile {
  readonly roleLabels = ROLE_LABELS;
  @Input({ required: true }) user!: SystemUser;
  @Output() closeProfile = new EventEmitter<void>();
  @Output() editUser = new EventEmitter<SystemUser>();
  @Output() resetPassword = new EventEmitter<SystemUser>();
  @Output() toggleStatus = new EventEmitter<SystemUser>();
}
