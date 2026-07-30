import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserNotificationPreferences } from '../../user-profile.models';

@Component({selector:'app-notification-preferences',standalone:true,imports:[FormsModule],templateUrl:'./notification-preferences.html',styleUrl:'./notification-preferences.css'})
export class NotificationPreferences implements OnChanges {
  @Input({required:true}) preferences!:UserNotificationPreferences;
  @Input() isSaving=false;
  @Output() saved=new EventEmitter<UserNotificationPreferences>();
  draft!:UserNotificationPreferences;
  ngOnChanges(){this.draft={...this.preferences};}
  get dirty(){return JSON.stringify(this.draft)!==JSON.stringify(this.preferences);}
  get valid(){return(!this.draft.quietHoursEnabled||!!this.draft.quietHoursStart&&!!this.draft.quietHoursEnd)&&(!this.draft.groupSimilarNotifications||this.draft.groupingWindowMinutes>=1)&&(!this.draft.digestEnabled||this.draft.digestIntervalMinutes>=5);}
  reset(){this.draft={...this.preferences};}
}
