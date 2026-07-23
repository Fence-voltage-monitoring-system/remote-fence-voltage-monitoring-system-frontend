import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrentUserProfile } from '../../user-profile.models';
@Component({ selector: 'app-security-settings', standalone: true, templateUrl: './security-settings.html' })
export class SecuritySettings { @Input({ required: true }) profile!: CurrentUserProfile; @Output() changePassword = new EventEmitter<void>(); @Output() signOutOthers = new EventEmitter<void>(); }
