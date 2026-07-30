import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ManagementAccessService } from '../../../../core/services/management-access.service';
import { NotificationFilter, SystemNotification } from '../../notifications.models';
@Component({ selector:'app-notification-feed', standalone:true, templateUrl:'./notification-feed.html', styleUrl:'./notification-feed.css' })
export class NotificationFeed {
  private readonly access=inject(ManagementAccessService);
  @Input() notifications:SystemNotification[]=[]; @Input() filter:NotificationFilter='ALL'; @Input() selectedId:number|null=null; @Input() unreadCount=0;
  @Output() filterChange=new EventEmitter<NotificationFilter>(); @Output() selected=new EventEmitter<SystemNotification>(); @Output() markAllRead=new EventEmitter<void>(); @Output() clearRead=new EventEmitter<void>();
  readonly tabs:{value:NotificationFilter;label:string}[]=[{value:'ALL',label:'All'},{value:'CRITICAL',label:'Critical'},{value:'WARNING',label:'Warnings'},{value:'MAINTENANCE',label:'Maintenance'},{value:'SYSTEM',label:'System'},{value:'UNREAD',label:'Unread'}];
  tone(n:SystemNotification){return n.category.toLowerCase();} icon(n:SystemNotification){return n.category==='MAINTENANCE'?'⌕':n.category==='SYSTEM'?'⚙':'△';}
  get displayNotifications(){return this.notifications.filter(item=>{if(this.access.scope().role==='SUPER_ADMIN')return true;const locations:Record<string,[string,string]>={'EPF-MNR-A':['Uva','Monaragala'],'EPF-PLN-C':['North Central','Polonnaruwa'],'EPF-HMB-E':['Southern','Hambantota'],'EPF-ANR-B':['North Central','Anuradhapura']};const [province,district]=item.province&&item.district?[item.province,item.district]:(locations[item.fence]??['','']);return this.access.canView(province,district);});}
}
