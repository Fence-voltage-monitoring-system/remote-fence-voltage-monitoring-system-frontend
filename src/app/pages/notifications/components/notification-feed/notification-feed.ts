import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NotificationFilter, SystemNotification } from '../../notifications.models';
@Component({ selector:'app-notification-feed', standalone:true, templateUrl:'./notification-feed.html', styleUrl:'./notification-feed.css' })
export class NotificationFeed {
  @Input() notifications:SystemNotification[]=[]; @Input() filter:NotificationFilter='ALL'; @Input() selectedId:number|null=null; @Input() unreadCount=0;
  @Output() filterChange=new EventEmitter<NotificationFilter>(); @Output() selected=new EventEmitter<SystemNotification>(); @Output() markAllRead=new EventEmitter<void>(); @Output() clearRead=new EventEmitter<void>();
  readonly tabs:{value:NotificationFilter;label:string}[]=[{value:'ALL',label:'All'},{value:'CRITICAL',label:'Critical'},{value:'WARNING',label:'Warnings'},{value:'MAINTENANCE',label:'Maintenance'},{value:'SYSTEM',label:'System'},{value:'UNREAD',label:'Unread'}];
  tone(n:SystemNotification){return n.category.toLowerCase();} icon(n:SystemNotification){return n.category==='MAINTENANCE'?'⌕':n.category==='SYSTEM'?'⚙':'△';}
  get displayNotifications(){return this.notifications;}
}
