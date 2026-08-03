import { TestBed } from '@angular/core/testing';
import { NEVER, of } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { Notifications } from './notifications';

describe('Notifications',()=>{
  it('loads notifications and statistics',async()=>{
    const items=[{id:1,code:'N1',title:'Critical',message:'Test',category:'CRITICAL' as const,fence:'F1',section:'S1',time:'10:00',read:false,channels:['IN_APP' as const]}];
    await TestBed.configureTestingModule({imports:[Notifications],providers:[
      {provide:NotificationService,useValue:{getNotifications:()=>of({items,page:1,pageSize:20,totalItems:1,totalPages:1}),getStats:()=>of({inApp:1,websocket:0,smsDelivered:0,unread:1}),connectLive:()=>NEVER}},
      {provide:UserService,useValue:{getNotificationPreferences:()=>of({soundEnabled:true,desktopNotificationsEnabled:false,markAsReadOnOpen:true,quietHoursEnabled:false,quietHoursStart:'22:00',quietHoursEnd:'06:00',groupSimilarNotifications:true,groupingWindowMinutes:30,digestEnabled:false,digestIntervalMinutes:60})}}
    ]}).compileComponents();
    const fixture=TestBed.createComponent(Notifications);fixture.detectChanges();expect(fixture.componentInstance.notifications.length).toBe(1);expect(fixture.componentInstance.unread).toBe(1);
  });
});
