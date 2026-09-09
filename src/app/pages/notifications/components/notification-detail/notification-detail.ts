import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { SystemNotification } from '../../notifications.models';

@Component({selector:'app-notification-detail',standalone:true,templateUrl:'./notification-detail.html',styleUrl:'./notification-detail.css'})
export class NotificationDetail implements AfterViewInit, OnDestroy {
  @Input({required:true}) notification!:SystemNotification;
  @Output() closed=new EventEmitter<void>();
  @Output() markRead=new EventEmitter<SystemNotification>();
  @Output() viewAlert=new EventEmitter<SystemNotification>();
  @ViewChild('dialog',{static:true}) dialog!:ElementRef<HTMLDialogElement>;
  ngAfterViewInit(){this.dialog.nativeElement.showModal();}
  ngOnDestroy(){this.dialog.nativeElement.close();}
}
