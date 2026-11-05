import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ManagementAccessService } from '../../core/services/management-access.service';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

type AuditResult = 'success' | 'failed' | 'warning';
type AuditCategory = 'Authentication' | 'Gateway' | 'Fence' | 'Section' | 'Device' | 'User' | 'System';
interface Change { field: string; before: string; after: string; }
interface AuditEvent { id:string; timestamp:string; actor:string; actorId?:string; role:string; action:string; category:AuditCategory; resource:string; resourceId:string; description:string; result:AuditResult; severity:'info'|'warning'|'critical'; ip:string; client:string; changes:Change[]; province?:string; district?:string; fence?:string; }
interface AuditPage { items: AuditEvent[]; page: number; pageSize: number; totalItems: number; totalPages: number; }

@Component({selector:'app-audit-logs-page',standalone:true,imports:[FormsModule,HeaderComponent,SidebarComponent],templateUrl:'./audit-logs.html',styleUrl:'./audit-logs.css'})
export class AuditLogsPage implements OnInit {
  private readonly http=inject(HttpClient);readonly access=inject(ManagementAccessService);
  events: AuditEvent[] = [];
  readonly previewEvents: AuditEvent[] = [];
  search=''; category='all'; result='all'; severity='all'; dateRange='today'; selected?:AuditEvent;isLoading=false;usingPreview=false;error='';
  ngOnInit(){this.load();}
  get scopedEvents(){return this.events.filter(event=>this.canView(event));}
  get filtered():AuditEvent[]{const q=this.search.trim().toLowerCase();return this.scopedEvents.filter(e=>(this.category==='all'||e.category===this.category)&&(this.result==='all'||e.result===this.result)&&(this.severity==='all'||e.severity===this.severity)&&(!q||[e.id,e.actor,e.action,e.resource,e.resourceId,e.description,e.ip].some(v=>v.toLowerCase().includes(q))));}
  get failedCount(){return this.scopedEvents.filter(e=>e.result==='failed').length} get securityCount(){return this.scopedEvents.filter(e=>e.category==='Authentication'||e.category==='User').length} get changeCount(){return this.scopedEvents.filter(e=>e.changes.length).length}
  get scopeLabel(){const scope=this.access.scope();if(scope.role==='SUPER_ADMIN')return'National scope';if(scope.role==='REGIONAL_ADMIN')return scope.provinces.join(', ')||'Assigned provinces';if(scope.role==='FIELD_ADMIN')return scope.districts.join(', ')||'Assigned districts';return scope.fences?.join(', ')||'Assigned fences';}
  load(){this.isLoading=true;this.error='';this.http.get<AuditPage|AuditEvent[]>('/api/audit-logs',{withCredentials:true}).pipe(finalize(()=>this.isLoading=false)).subscribe({next:value=>{this.events=Array.isArray(value)?value:value.items;this.usingPreview=false;},error:()=>{this.events=[];this.usingPreview=false;this.error='';}});}
  private canView(event:AuditEvent){const scope=this.access.scope();if(scope.role==='SUPER_ADMIN')return true;if(event.actorId&&event.actorId===scope.userId)return true;if(!event.province||!event.district)return false;return this.access.canView(event.province,event.district,event.fence??'');}
  clear(){this.search='';this.category='all';this.result='all';this.severity='all';this.dateRange='today'}
  exportCsv(){const rows=[['Timestamp','Actor','Action','Category','Resource','Result','IP'],...this.filtered.map(e=>[e.timestamp,e.actor,e.action,e.category,`${e.resource} (${e.resourceId})`,e.result,e.ip])];const csv=rows.map(r=>r.map(v=>`"${v.replaceAll('"','""')}"`).join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='audit-logs.csv';a.click();URL.revokeObjectURL(url)}
}
