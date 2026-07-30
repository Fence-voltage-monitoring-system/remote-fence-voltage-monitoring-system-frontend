import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertRecord, CompleteWorkRequest, MaintenanceStaffOption, ReassignAlertRequest } from '../../alerts.models';

@Component({selector:'app-incident-panel',standalone:true,imports:[FormsModule],templateUrl:'./incident-panel.html',styleUrl:'./incident-panel.css'})
export class IncidentPanel {
  @Input({required:true}) alert!:AlertRecord;
  @Input() canAdminister=true;
  @Input() canMaintain=false;
  @Output() closed=new EventEmitter<void>();
  @Output() acknowledged=new EventEmitter<AlertRecord>();
  @Output() accepted=new EventEmitter<AlertRecord>();
  @Output() declined=new EventEmitter<{alert:AlertRecord;reason:string}>();
  @Output() reassigned=new EventEmitter<{alert:AlertRecord;request:ReassignAlertRequest}>();
  @Output() escalated=new EventEmitter<AlertRecord>();
  @Output() workStarted=new EventEmitter<AlertRecord>();
  @Output() workCompleted=new EventEmitter<{alert:AlertRecord;request:CompleteWorkRequest}>();
  @Output() resolved=new EventEmitter<{alert:AlertRecord;reason:string}>();
  @Output() commentAdded=new EventEmitter<{alert:AlertRecord;comment:string}>();
  comment='';reason='';selectedStaffId:number|null=null;cause='';actions='';workSummary='';mode:'NONE'|'REASSIGN'|'DECLINE'|'COMPLETE'|'RESOLVE'='NONE';

  get eligible():MaintenanceStaffOption[]{return this.alert.eligibleMaintenanceStaff??[];}
  addComment(){const value=this.comment.trim();if(!value)return;this.commentAdded.emit({alert:this.alert,comment:value});this.comment='';}
  submitReassign(){if(!this.selectedStaffId||!this.reason.trim())return;this.reassigned.emit({alert:this.alert,request:{staffId:this.selectedStaffId,reason:this.reason.trim()}});this.resetMode();}
  submitDecline(){if(!this.reason.trim())return;this.declined.emit({alert:this.alert,reason:this.reason.trim()});this.resetMode();}
  submitComplete(){if(!this.cause.trim()||!this.actions.trim())return;this.workCompleted.emit({alert:this.alert,request:{cause:this.cause.trim(),actions:this.actions.trim(),summary:this.workSummary.trim()}});this.resetMode();}
  submitResolve(){if(!this.reason.trim())return;this.resolved.emit({alert:this.alert,reason:this.reason.trim()});this.resetMode();}
  resetMode(){this.mode='NONE';this.reason='';this.selectedStaffId=null;this.cause='';this.actions='';this.workSummary='';}
}
