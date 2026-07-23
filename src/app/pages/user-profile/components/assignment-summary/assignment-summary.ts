import { Component, Input } from '@angular/core';
import { CurrentUserProfile } from '../../user-profile.models';
@Component({ selector: 'app-assignment-summary', standalone: true, templateUrl: './assignment-summary.html', styleUrl: './assignment-summary.css' })
export class AssignmentSummary { @Input({ required: true }) profile!: CurrentUserProfile; }
