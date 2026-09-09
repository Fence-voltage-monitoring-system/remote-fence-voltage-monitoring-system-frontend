import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, forkJoin, Subscription, timer, Observable } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { UserNotificationPreferences } from '../user-profile/user-profile.models';
import { NotificationDetail } from './components/notification-detail/notification-detail';
import { NotificationFeed } from './components/notification-feed/notification-feed';
import { NotificationSummary } from './components/notification-summary/notification-summary';
import { NotificationFilter, NotificationStats, SystemNotification } from './notifications.models';

@Component({selector:'app-notifications',standalone:true,imports:[NotificationSummary,NotificationFeed,NotificationDetail],templateUrl:'./notifications.html',styleUrls:['./notifications.css','./notifications-api.css']})
export class Notifications implements OnInit,OnDestroy {
  private readonly service=inject(NotificationService);
  private readonly userService=inject(UserService);
  private readonly router=inject(Router);
  private readonly cdr=inject(ChangeDetectorRef);
  private readonly subscriptions=new Subscription();
  private loadRequest?:Subscription;
  filter:NotificationFilter='ALL';selected:SystemNotification|null=null;notice='';error='';isLoading=false;isActionPending=false;
  page=1;readonly pageSize=20;totalPages=1;totalItems=0;
  stats:NotificationStats={inApp:0,websocket:0,smsDelivered:0,unread:0};
  notifications:SystemNotification[]=[];
  preferences:UserNotificationPreferences={soundEnabled:true,desktopNotificationsEnabled:false,markAsReadOnOpen:true,quietHoursEnabled:false,quietHoursStart:'22:00',quietHoursEnd:'06:00',groupSimilarNotifications:true,groupingWindowMinutes:30,digestEnabled:false,digestIntervalMinutes:60};
  ngOnInit(){
    this.load();
    this.subscriptions.add(this.userService.getNotificationPreferences().subscribe({next:p=>{this.preferences=p;this.cdr.markForCheck();},error:()=>{}}));
    this.subscriptions.add(this.service.connectLive().subscribe({next:item=>{this.deliverBrowserNotification(item);if(!this.isActionPending)this.load();},error:()=>{}}));
    this.subscriptions.add(timer(30000,30000).subscribe(()=>{if(!this.isLoading&&!this.isActionPending)this.load();}));
  }
  ngOnDestroy(){this.loadRequest?.unsubscribe();this.subscriptions.unsubscribe();}
  get visible(){return this.notifications.filter(item=>this.filter==='ALL'||(this.filter==='UNREAD'?!item.read:item.category===this.filter));}
  get unread(){return this.stats.unread;}
  changeFilter(filter:NotificationFilter){this.filter=filter;this.page=1;this.selected=null;this.notifications=[];this.totalItems=0;this.load();}
  changePage(page:number){if(page<1||page>this.totalPages||this.isLoading)return;this.page=page;this.selected=null;this.notifications=[];this.load();}
  load(){
    this.loadRequest?.unsubscribe();this.isLoading=true;this.error='';
    this.loadRequest=forkJoin({page:this.service.getNotifications({filter:this.filter,page:this.page,pageSize:this.pageSize}),stats:this.service.getStats()})
      .pipe(finalize(()=>{this.isLoading=false;this.cdr.markForCheck();}))
      .subscribe({next:({page,stats})=>{
        this.notifications=page.items;this.totalPages=Math.max(1,page.totalPages);this.totalItems=page.totalItems;this.stats=stats;
        if(this.selected)this.selected=page.items.find(n=>n.id===this.selected?.id)??this.selected;
        if(this.page>this.totalPages){this.page=this.totalPages;this.load();}
      },error:()=>{this.error='Unable to load notifications. Check your connection and retry.';}});
  }
  retry(){this.load();}
  select(item:SystemNotification){this.selected=item;if(this.preferences.markAsReadOnOpen&&!item.read)this.markRead(item);}
  viewAlert(item:SystemNotification){if(!item.relatedAlert)return;void this.router.navigate(['/alerts'],{queryParams:{alert:item.relatedAlert}});}
  markRead(item:SystemNotification){
    if(item.read||this.isActionPending)return;
    this.perform(this.service.markRead(item.id),updated=>{
      Object.assign(item,updated);if(this.selected?.id===item.id)this.selected=updated;
      this.stats={...this.stats,unread:Math.max(0,this.stats.unread-1)};
      this.service.updateStats(this.stats);
      this.notice='Notification marked as read.';
    },'Unable to mark the notification as read.');
  }
  markAll(){if(this.isActionPending)return;this.perform(this.service.markAllRead(),()=>{
    this.notifications=this.notifications.map(item=>({...item,read:true}));
    this.stats={...this.stats,unread:0};
    this.service.updateStats(this.stats);
    if(this.selected)this.selected={...this.selected,read:true};this.notice='All notifications marked as read.';
  },'Unable to mark all notifications as read.');}
  clearRead(){if(this.isActionPending)return;this.perform(this.service.clearRead(),()=>{
    if(this.selected?.read)this.selected=null;this.notice='Read notifications cleared.';
  },'Unable to clear read notifications.');}
  private perform<T>(request:Observable<T>,success:(value:T)=>void,message:string){
    // An older list response must not overwrite a confirmed read action.
    this.loadRequest?.unsubscribe();
    this.isActionPending=true;this.error='';
    this.subscriptions.add(request.pipe(finalize(()=>{this.isActionPending=false;this.cdr.markForCheck();})).subscribe({
      next:value=>{success(value);this.load();},
      error:()=>{this.error=message;}
    }));
  }
  private deliverBrowserNotification(item:SystemNotification){const silenced=item.category!=='CRITICAL'&&this.isQuietTime();if(this.preferences.soundEnabled&&!silenced)this.playNotificationTone();if(this.preferences.desktopNotificationsEnabled&&!silenced&&typeof window.Notification!=='undefined'&&window.Notification.permission==='granted')new window.Notification(item.title,{body:item.message,tag:item.relatedAlert??item.code});}
  private isQuietTime(){if(!this.preferences.quietHoursEnabled)return false;const now=new Date();const minutes=now.getHours()*60+now.getMinutes();const parse=(value:string)=>{const[hours,mins]=value.split(':').map(Number);return hours*60+mins;};const start=parse(this.preferences.quietHoursStart),end=parse(this.preferences.quietHoursEnd);return start<=end?minutes>=start&&minutes<end:minutes>=start||minutes<end;}
  private playNotificationTone(){try{const AudioContextClass=window.AudioContext;const context=new AudioContextClass();const oscillator=context.createOscillator();const gain=context.createGain();oscillator.frequency.value=660;gain.gain.value=.04;oscillator.connect(gain);gain.connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+.12);oscillator.onended=()=>void context.close();}catch{}}

}
