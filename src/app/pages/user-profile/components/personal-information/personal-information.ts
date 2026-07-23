import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrentUserProfile } from '../../user-profile.models';
@Component({ selector: 'app-personal-information', standalone: true, templateUrl: './personal-information.html', styleUrl: './personal-information.css' })
export class PersonalInformation { @Input({ required: true }) profile!: CurrentUserProfile; @Output() editRequested = new EventEmitter<void>(); }
