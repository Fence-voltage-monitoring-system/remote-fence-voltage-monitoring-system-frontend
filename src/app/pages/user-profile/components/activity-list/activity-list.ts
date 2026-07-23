import { Component, Input } from '@angular/core';
import { ProfileActivity } from '../../user-profile.models';
@Component({ selector: 'app-activity-list', standalone: true, templateUrl: './activity-list.html' })
export class ActivityList { @Input() activities: ProfileActivity[] = []; }
