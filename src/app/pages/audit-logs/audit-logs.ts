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
  readonly previewEvents: AuditEvent[] = [
    {id:'AUD-00942',timestamp:'27 Jul 2026, 14:32:18',actor:'Nimal Perera',role:'Administrator',action:'Assigned device',category:'Device',resource:'North Gate Monitor',resourceId:'DVC-1024',description:'Assigned voltage monitor to section SEC-001.',result:'success',severity:'info',ip:'192.168.1.24',client:'Chrome 138 · Windows',province:'Uva',district:'Monaragala',fence:'EPF-MNR-A',changes:[{field:'Fence',before:'Unassigned',after:'Monaragala Elephant Protection Fence'},{field:'Section',before:'Unassigned',after:'SEC-001'},{field:'Status',before:'Offline',after:'Online'}]},
    {id:'AUD-00941',timestamp:'27 Jul 2026, 14:20:43',actor:'Kasun Silva',role:'Operations Manager',action:'Changed gateway',category:'Fence',resource:'Gal Oya East Protection Fence',resourceId:'FNC-004',description:'Reassigned fence to Monaragala Main Gateway.',result:'success',severity:'info',ip:'192.168.1.31',client:'Edge 138 · Windows',province:'Eastern',district:'Ampara',fence:'EPF-AMP-D',changes:[{field:'Gateway',before:'GTW-1002',after:'GTW-1004'}]},
    {id:'AUD-00940',timestamp:'27 Jul 2026, 13:55:09',actor:'Monitoring service',role:'System',action:'Gateway disconnected',category:'Gateway',resource:'Mihintale Field Gateway',resourceId:'GTW-1002',description:'Gateway stopped sending heartbeat messages.',result:'warning',severity:'warning',ip:'10.20.3.12',client:'System service',province:'North Central',district:'Anuradhapura',fence:'EPF-ANR-B',changes:[{field:'Status',before:'Online',after:'Offline'}]},
    {id:'AUD-00939',timestamp:'27 Jul 2026, 13:40:26',actor:'Unknown user',role:'Unauthenticated',action:'Login attempt',category:'Authentication',resource:'Authentication',resourceId:'AUTH',description:'Login failed because the supplied password was incorrect.',result:'failed',severity:'critical',ip:'103.125.18.44',client:'Firefox 140 · Linux',changes:[]},
    {id:'AUD-00938',timestamp:'27 Jul 2026, 12:18:52',actor:'Nimal Perera',role:'Administrator',action:'Registered gateway',category:'Gateway',resource:'Spare Gateway 01',resourceId:'GTW-1001',description:'Added new gateway hardware to inventory.',result:'success',severity:'info',ip:'192.168.1.24',client:'Chrome 138 · Windows',province:'Uva',district:'Monaragala',fence:'EPF-MNR-A',changes:[{field:'Record',before:'Not present',after:'Created'}]},
    {id:'AUD-00937',timestamp:'27 Jul 2026, 11:46:31',actor:'Amali Fernando',role:'Field Officer',action:'Updated section',category:'Section',resource:'Western Boundary',resourceId:'SEC-003',description:'Updated section length after field inspection.',result:'success',severity:'info',ip:'192.168.1.46',client:'Chrome Mobile · Android',province:'Western',district:'Gampaha',fence:'EPF-GMP-F',changes:[{field:'Length',before:'3.7 km',after:'3.9 km'}]},
    {id:'AUD-00936',timestamp:'27 Jul 2026, 10:22:05',actor:'Nimal Perera',role:'Administrator',action:'Disabled user',category:'User',resource:'Field Officer Account',resourceId:'USR-0018',description:'Disabled user access following role change.',result:'success',severity:'warning',ip:'192.168.1.24',client:'Chrome 138 · Windows',province:'Uva',district:'Monaragala',fence:'EPF-MNR-A',changes:[{field:'Account status',before:'Active',after:'Disabled'}]},
    {id:'AUD-00935',timestamp:'27 Jul 2026, 09:10:14',actor:'Configuration service',role:'System',action:'Configuration sync',category:'System',resource:'Gateway configuration',resourceId:'GTW-1004',description:'Synchronized gateway configuration successfully.',result:'success',severity:'info',ip:'10.20.1.10',client:'System service',changes:[]},
  ];
  search=''; category='all'; result='all'; severity='all'; dateRange='today'; selected?:AuditEvent;isLoading=false;usingPreview=false;error='';
  ngOnInit(){this.load();}
  get scopedEvents(){return this.events.filter(event=>this.canView(event));}
  get filtered():AuditEvent[]{const q=this.search.trim().toLowerCase();return this.scopedEvents.filter(e=>(this.category==='all'||e.category===this.category)&&(this.result==='all'||e.result===this.result)&&(this.severity==='all'||e.severity===this.severity)&&(!q||[e.id,e.actor,e.action,e.resource,e.resourceId,e.description,e.ip].some(v=>v.toLowerCase().includes(q))));}
  get failedCount(){return this.scopedEvents.filter(e=>e.result==='failed').length} get securityCount(){return this.scopedEvents.filter(e=>e.category==='Authentication'||e.category==='User').length} get changeCount(){return this.scopedEvents.filter(e=>e.changes.length).length}
  get scopeLabel(){const scope=this.access.scope();if(scope.role==='SUPER_ADMIN')return'National scope';if(scope.role==='REGIONAL_ADMIN')return scope.provinces.join(', ')||'Assigned provinces';if(scope.role==='FIELD_ADMIN')return scope.districts.join(', ')||'Assigned districts';return scope.fences?.join(', ')||'Assigned fences';}
  load(){this.isLoading=true;this.error='';this.http.get<AuditPage|AuditEvent[]>('/api/audit-logs',{withCredentials:true}).pipe(finalize(()=>this.isLoading=false)).subscribe({next:value=>{this.events=Array.isArray(value)?value:value.items;this.usingPreview=false;},error:()=>{this.events=this.previewEvents;this.usingPreview=true;this.error='The audit API is unavailable. Displaying scoped preview data.';}});}
  private canView(event:AuditEvent){const scope=this.access.scope();if(scope.role==='SUPER_ADMIN')return true;if(event.actorId&&event.actorId===scope.userId)return true;if(!event.province||!event.district)return false;return this.access.canView(event.province,event.district,event.fence??'');}
  clear(){this.search='';this.category='all';this.result='all';this.severity='all';this.dateRange='today'}
  exportCsv(){const rows=[['Timestamp','Actor','Action','Category','Resource','Result','IP'],...this.filtered.map(e=>[e.timestamp,e.actor,e.action,e.category,`${e.resource} (${e.resourceId})`,e.result,e.ip])];const csv=rows.map(r=>r.map(v=>`"${v.replaceAll('"','""')}"`).join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='audit-logs.csv';a.click();URL.revokeObjectURL(url)}
}
