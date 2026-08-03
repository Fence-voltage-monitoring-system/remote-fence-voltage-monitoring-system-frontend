import { Component, Input } from '@angular/core';
import { ROLE_LABELS } from '../../../user-management/user-management.models';
import { CurrentUserProfile } from '../../user-profile.models';
@Component({ selector: 'app-profile-summary', standalone: true, templateUrl: './profile-summary.html' })
export class ProfileSummary { @Input({ required: true }) profile!: CurrentUserProfile; readonly roleLabels = ROLE_LABELS; }
