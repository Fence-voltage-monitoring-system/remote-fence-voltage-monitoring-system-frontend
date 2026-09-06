import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, Observable, Subscription, timer } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from '../../core/services/alert.service';
import { SectionService, SectionResponse } from '../../core/services/section.service';
import { ManagementAccessService } from '../../core/services/management-access.service';
import { AlertList } from './components/alert-list/alert-list';
import { AlertSummary } from './components/alert-summary/alert-summary';
import { IncidentPanel } from './components/incident-panel/incident-panel';
import { AlertFilters, AlertRecord, AlertStats, AlertOptions, CreateAlertRequest, CompleteWorkRequest, ReassignAlertRequest } from './alerts.models';

@Component({selector:'app-alerts',standalone:true,imports:[FormsModule,AlertSummary,AlertList,IncidentPanel],templateUrl:'./alerts.html',styleUrls:['./alerts.css','./alerts-api.css']})
export class Alerts implements OnInit,OnDestroy {
  private readonly service=inject(AlertService);
  private readonly sectionsService=inject(SectionService);
  private readonly route=inject(ActivatedRoute);
  private readonly cdr=inject(ChangeDetectorRef);
  readonly access=inject(ManagementAccessService);
  private readonly subscriptions=new Subscription();
  private loadRequest?:Subscription;
  private sectionRequest?:Subscription;
  filters:AlertFilters={severity:'',province:'',fence:'',type:'',status:'',date:''};
  selected:AlertRecord|null=null;
  notice='';error='';isLoading=false;isActionPending=false;page=1;readonly pageSize=20;totalPages=1;totalItems=0;successVersion=0;
  alerts:AlertRecord[]=[];
  stats:AlertStats={activeCritical:0,activeWarnings:0,unacknowledged:0,underMaintenance:0,resolvedToday:0};
  options:AlertOptions={fences:[],types:[]};
  showCreate=false;createError='';sections:SectionResponse[]=[];sectionsLoading=false;
  draft:CreateAlertRequest=this.emptyDraft();
  private emptyDraft():CreateAlertRequest{return {fenceId:null,sectionId:null,title:'',type:'OTHER',severity:'WARNING',description:'',detectedVoltageKv:null,thresholdVoltageKv:null};}
  ngOnInit(){
    this.load();
    this.subscriptions.add(this.service.getOptions().subscribe({next:options=>{this.options=options;this.cdr.markForCheck();},error:()=>{this.error='Unable to load fence options. Retry to reconnect.';this.cdr.markForCheck();}}));
    const key=this.route.snapshot.queryParamMap.get('alert');
    if(key)this.subscriptions.add(this.service.getAlert(key).subscribe({next:a=>{this.selected=a;this.cdr.markForCheck();},error:e=>{this.error=this.message(e,'Related incident is unavailable or outside your authority.');this.cdr.markForCheck();}}));
    this.subscriptions.add(this.service.connectLive().subscribe(()=>this.refreshInBackground()));
    this.subscriptions.add(timer(30000,30000).subscribe(()=>this.refreshInBackground()));
  }
  ngOnDestroy(){this.subscriptions.unsubscribe();this.loadRequest?.unsubscribe();this.sectionRequest?.unsubscribe();}
  get visible(){return this.alerts;}
  get critical(){return this.stats.activeCritical;} get warnings(){return this.stats.activeWarnings;}
  get unacknowledged(){return this.stats.unacknowledged;} get maintenance(){return this.stats.underMaintenance;} get resolved(){return this.stats.resolvedToday;}
  get provinces(){return [...new Set([...this.options.fences.map(f=>f.province),...this.alerts.map(a=>a.province)])];}
  get fences(){return [...new Set([...this.options.fences.filter(f=>!this.filters.province||f.province===this.filters.province).map(f=>f.code),...this.alerts.filter(a=>!this.filters.province||a.province===this.filters.province).map(a=>a.fence)])];}
  get types(){return this.options.types;}
  get canCreate(){return ['SUPER_ADMIN','REGIONAL_ADMIN','FIELD_ADMIN'].includes(this.access.scope().role);}
  load(){
    this.loadRequest?.unsubscribe();this.isLoading=true;this.error='';
    this.loadRequest=forkJoin({page:this.service.getAlerts(this.filters,this.page,this.pageSize),stats:this.service.getStats()})
      .pipe(finalize(()=>{this.isLoading=false;this.cdr.markForCheck();}))
      .subscribe({next:({page,stats})=>{this.alerts=page.items;this.totalPages=Math.max(1,page.totalPages);this.totalItems=page.totalItems;this.stats=stats;if(this.page>this.totalPages){this.page=this.totalPages;this.load();}},error:e=>{this.error=this.message(e,'Unable to load alerts. Check your connection and retry.');}});
  }
  retry(){this.load();this.subscriptions.add(this.service.getOptions().subscribe({next:o=>{this.options=o;this.cdr.markForCheck();},error:()=>{}}));}
  updateFilters(filters:AlertFilters){if(filters.province!==this.filters.province)filters={...filters,fence:''};this.filters=filters;this.page=1;this.load();}
  changePage(page:number){if(page<1||page>this.totalPages||this.isLoading)return;this.page=page;this.load();}
  select(alert:AlertRecord){if(!this.isActionPending)this.selected=alert;}
  private refreshInBackground(){
    if(this.isActionPending||this.isLoading)return;
    this.load();
    if(this.selected){const id=this.selected.id;this.subscriptions.add(this.service.getAlert(id).subscribe({next:a=>{if(this.selected?.id===id)this.selected=a;this.cdr.markForCheck();},error:e=>{if(e.status===403||e.status===404)this.selected=null;this.cdr.markForCheck();}}));}
  }
  acknowledge(a:AlertRecord){this.perform(this.service.acknowledge(a.id),'Incident acknowledged.');}
  accept(a:AlertRecord){this.perform(this.service.acceptAssignment(a.id),'Assignment accepted.');}
  decline(e:{alert:AlertRecord;reason:string}){this.perform(this.service.declineAssignment(e.alert.id,{reason:e.reason}),'Assignment declined and escalated.');}
  reassign(e:{alert:AlertRecord;request:ReassignAlertRequest}){this.perform(this.service.reassignMaintenance(e.alert.id,e.request),'Maintenance assignment saved.');}
  escalate(a:AlertRecord){this.perform(this.service.escalateAssignment(a.id),'Assignment escalated.');}
  startWork(a:AlertRecord){this.perform(this.service.startWork(a.id),'Work started.');}
  completeWork(e:{alert:AlertRecord;request:CompleteWorkRequest}){this.perform(this.service.completeWork(e.alert.id,e.request),'Work recorded. Awaiting recovery confirmation or administrator resolution.');}
  resolve(e:{alert:AlertRecord;reason:string}){this.perform(this.service.resolveManually(e.alert.id,e.reason),'Incident resolved.');}
  addComment(e:{alert:AlertRecord;comment:string}){this.perform(this.service.addComment(e.alert.id,e.comment),'Comment saved.');}
  private perform(request:Observable<AlertRecord>,message:string){
    if(this.isActionPending)return;this.isActionPending=true;this.error='';this.notice='';
    this.subscriptions.add(request.pipe(finalize(()=>{this.isActionPending=false;this.cdr.markForCheck();})).subscribe({
      next:a=>{this.selected=a;this.successVersion++;this.notice=message;this.load();},
      error:e=>{this.error=this.message(e,'The action could not be completed. Your entered text has been kept.');}
    }));
  }
  openCreate(){this.showCreate=true;this.createError='';}
  loadSections(){
    this.sectionRequest?.unsubscribe();this.sections=[];this.draft.sectionId=null;this.sectionsLoading=false;
    if(!this.draft.fenceId)return;
    this.sectionsLoading=true;
    this.sectionRequest=this.sectionsService.getSectionsByFence(this.draft.fenceId).pipe(finalize(()=>{this.sectionsLoading=false;this.cdr.markForCheck();})).subscribe({
      next:s=>{this.sections=s;this.createError='';},
      error:()=>{this.createError='Unable to load sections for this fence. Select the fence again to retry.';}
    });
  }
  create(){
    if(this.isActionPending||!this.draft.fenceId||!this.draft.title.trim()||!this.draft.description.trim())return;
    this.isActionPending=true;this.createError='';
    this.subscriptions.add(this.service.create({...this.draft,title:this.draft.title.trim(),description:this.draft.description.trim()})
      .pipe(finalize(()=>{this.isActionPending=false;this.cdr.markForCheck();}))
      .subscribe({next:a=>{this.showCreate=false;this.draft=this.emptyDraft();this.sections=[];this.selected=a;this.notice='Incident registered.';this.page=1;this.load();},
        error:e=>{this.createError=this.message(e,'Unable to register the incident.');}}));
  }
  private message(error:any,fallback:string){return typeof error?.error?.message==='string'?error.error.message:fallback;}
}

