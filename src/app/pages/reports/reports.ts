import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription, timer } from 'rxjs';

import { ReportsService } from '../../core/services/reports.service';
import { ReportConfiguration } from './components/report-configuration/report-configuration';
import { ReportHistory } from './components/report-history/report-history';
import { ReportTemplateSelector } from './components/report-template-selector/report-template-selector';
import { GeneratedReport, ReportConfigurationValue, ReportFilterOptions, ReportGenerationRequest, ReportTemplate, ReportTemplateId } from './reports.models';

@Component({selector:'app-reports',standalone:true,imports:[ReportTemplateSelector,ReportConfiguration,ReportHistory],templateUrl:'./reports.html',styleUrl:'./reports.css'})
export class Reports implements OnInit {
  private readonly service=inject(ReportsService);
  private readonly destroyRef=inject(DestroyRef);
  private readonly cdr=inject(ChangeDetectorRef);
  private optionsSubscription?:Subscription;
  historyPage=0;
  historyTotal=0;
  previousPage():void {if(this.historyPage>0){this.historyPage--;this.loadHistory();}}
  nextPage():void {if((this.historyPage+1)*25<this.historyTotal){this.historyPage++;this.loadHistory();}}

  readonly templates:ReportTemplate[]=[
    {id:'FENCE_HEALTH',icon:'▣',name:'Fence Health Report',description:'Comprehensive health status of all monitored fences'},
    {id:'VOLTAGE_PERFORMANCE',icon:'ϟ',name:'Voltage Performance Report',description:'Voltage readings, trends, and stability analysis'},
    {id:'ALERT_SUMMARY',icon:'♨',name:'Alert Summary Report',description:'All alerts, acknowledgements, and resolution status'},
    {id:'DEVICE_STATUS',icon:'♟',name:'Device Status Report',description:'Device connectivity, battery, and telemetry summary'},
    {id:'GATEWAY_CONNECTIVITY',icon:'▥',name:'Gateway Connectivity Report',description:'Current gateway connectivity, signal quality, and firmware status'},
    {id:'MAINTENANCE',icon:'⌕',name:'Maintenance Report',description:'Recorded incident workflow activities and outcomes'}
  ];
  selectedTemplate:ReportTemplateId='FENCE_HEALTH';
  configuration:ReportConfigurationValue={province:'',district:'',fence:'',section:'',range:'LAST_30_DAYS',customFrom:'',customTo:'',includeCharts:true,includeAlertHistory:true,includeMaintenanceRecords:false,format:'PDF'};
  filterOptions:ReportFilterOptions={provinces:[],districts:[],fences:[],sections:[]};
  reports:GeneratedReport[]=[];
  notice='';
  generating=false;
  previewing=false;
  optionsLoading=false;
  filterError='';
  filtersReady=false;
  reloadFilters():void {this.loadFilterOptions();}
  clearFilters():void {
    this.configuration={...this.configuration,province:'',district:'',fence:'',section:''};
    this.loadFilterOptions();
  }
  historyLoading=false;
  downloadingId:number|null=null;

  ngOnInit():void{
    this.loadFilterOptions();
    this.loadHistory();
    timer(5000,5000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(()=>{
      if(this.reports.some(report=>report.status==='QUEUED'||report.status==='GENERATING')&&document.visibilityState==='visible')this.loadHistory(false);
    });
  }

  selectTemplate(template:ReportTemplateId):void{
    this.selectedTemplate=template;
    this.configuration={...this.configuration,includeMaintenanceRecords:template==='MAINTENANCE'||this.configuration.includeMaintenanceRecords};
    this.notice='';
  }

  configurationChanged(next:ReportConfigurationValue):void{
    const hierarchyChanged=next.province!==this.configuration.province||next.district!==this.configuration.district||next.fence!==this.configuration.fence;
    this.configuration=next;
    if(hierarchyChanged)this.loadFilterOptions();
  }

  preview():void{
    if(this.previewing||!this.filtersReady||this.optionsLoading)return;
    this.previewing=true;
    this.service.preview(this.buildRequest()).pipe(takeUntilDestroyed(this.destroyRef),finalize(()=>{this.previewing=false;this.cdr.markForCheck();})).subscribe({
      next:preview=>this.notice=`${preview.title}: ${preview.recordCount} records across ${preview.scopeLabel} (${preview.dateRangeLabel}).${preview.warnings.length?' '+preview.warnings.join(' '):''}`,
      error:(error:HttpErrorResponse)=>this.notice=this.errorMessage(error,'preview the report')
    });
  }

  generate():void{
    if(this.generating||!this.filtersReady||this.optionsLoading)return;
    this.generating=true;
    this.service.generate(this.buildRequest()).pipe(takeUntilDestroyed(this.destroyRef),finalize(()=>{this.generating=false;this.cdr.markForCheck();})).subscribe({
      next:report=>{this.reports=[report,...this.reports.filter(item=>item.id!==report.id)];this.historyPage=0;this.loadHistory(false);this.notice=report.status==='READY'?'Report is ready. Click Download in the history below.':'Report generation is in progress.';},
      error:(error:HttpErrorResponse)=>this.notice=this.errorMessage(error,'generate the report')
    });
  }

  download(report:GeneratedReport):void{
    if(report.status!=='READY'||this.downloadingId!==null)return;
    this.downloadingId=report.id;
    this.service.download(report.id).pipe(takeUntilDestroyed(this.destroyRef),finalize(()=>{this.downloadingId=null;this.cdr.markForCheck();})).subscribe({
      next:file=>{const url=URL.createObjectURL(file);const anchor=document.createElement('a');anchor.href=url;anchor.download=this.fileName(report);document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);this.notice=`Downloaded ${report.name}.`;},
      error:(error:HttpErrorResponse)=>this.notice=this.errorMessage(error,'download the report')
    });
  }

  private loadFilterOptions():void{
    this.optionsSubscription?.unsubscribe();
    this.optionsLoading=true;
    this.filterError='';
    this.filtersReady=false;
    const scope={province:this.configuration.province,district:this.configuration.district,fence:this.configuration.fence};
    this.optionsSubscription=this.service.getFilterOptions(scope).pipe(takeUntilDestroyed(this.destroyRef),finalize(()=>{this.optionsLoading=false;this.cdr.markForCheck();})).subscribe({
      next:options=>{this.filterOptions=options;this.filtersReady=true;},
      error:(error:HttpErrorResponse)=>{
        this.filterError=error.status===404
          ? 'The Reports filter API is unavailable. Restart the backend with the latest Reports code, then click Reload fences.'
          : this.errorMessage(error,'load registered fences');
      }
    });
  }

  private loadHistory(showLoading=true):void{
    if(this.historyLoading)return;
    this.historyLoading=true;
    if(showLoading)this.notice='';
    this.service.getHistory(this.historyPage).pipe(takeUntilDestroyed(this.destroyRef),finalize(()=>{this.historyLoading=false;this.cdr.markForCheck();})).subscribe({
      next:page=>{this.reports=page.items;this.historyTotal=page.total;},
      error:(error:HttpErrorResponse)=>{this.notice=this.errorMessage(error,'load report history');}
    });
  }

  private buildRequest():ReportGenerationRequest{
    const custom=this.configuration.range==='CUSTOM';
    return{template:this.selectedTemplate,scope:{province:this.configuration.province||null,district:this.configuration.district||null,fence:this.configuration.fence||null,section:this.configuration.section||null},dateRange:{preset:custom?null:this.configuration.range,from:custom?this.configuration.customFrom:null,to:custom?this.configuration.customTo:null},options:{includeCharts:this.configuration.format==='PDF'&&this.configuration.includeCharts,includeAlertHistory:this.configuration.includeAlertHistory,includeMaintenanceRecords:this.configuration.includeMaintenanceRecords},format:this.configuration.format};
  }

  private errorMessage(error:HttpErrorResponse,action:string):string{
    if(error.status===0)return`Reports API unavailable. Unable to ${action}.`;
    if(error.status===401)return'Your session has expired. Sign in again.';
    if(error.status===403)return'You are not authorized to report on the selected operational scope.';
    if(error.status===404)return'The requested report or operational scope no longer exists.';
    if(error.status===413)return'The selected report is too large. Select a shorter date range or narrower scope.';
    return error.error?.message??`Unable to ${action}.`;
  }

  private fileName(report:GeneratedReport):string{return`${report.name.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()}.${report.format.toLowerCase()}`;}

}
