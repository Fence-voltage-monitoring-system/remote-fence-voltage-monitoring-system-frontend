import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timer } from 'rxjs';

import { ReportsService } from '../../core/services/reports.service';
import { ReportConfiguration } from './components/report-configuration/report-configuration';
import { ReportHistory } from './components/report-history/report-history';
import { ReportTemplateSelector } from './components/report-template-selector/report-template-selector';
import { GeneratedReport, ReportConfigurationValue, ReportFilterOptions, ReportGenerationRequest, ReportOption, ReportTemplate, ReportTemplateId } from './reports.models';

@Component({selector:'app-reports',standalone:true,imports:[ReportTemplateSelector,ReportConfiguration,ReportHistory],templateUrl:'./reports.html',styleUrl:'./reports.css'})
export class Reports implements OnInit {
  private readonly service=inject(ReportsService);
  private readonly destroyRef=inject(DestroyRef);

  readonly templates:ReportTemplate[]=[
    {id:'FENCE_HEALTH',icon:'▣',name:'Fence Health Report',description:'Comprehensive health status of all monitored fences'},
    {id:'VOLTAGE_PERFORMANCE',icon:'ϟ',name:'Voltage Performance Report',description:'Voltage readings, trends, and stability analysis'},
    {id:'ALERT_SUMMARY',icon:'♨',name:'Alert Summary Report',description:'All alerts, acknowledgements, and resolution status'},
    {id:'DEVICE_STATUS',icon:'♟',name:'Device Status Report',description:'Device connectivity, battery, and telemetry summary'},
    {id:'GATEWAY_CONNECTIVITY',icon:'▥',name:'Gateway Connectivity Report',description:'Gateway uptime, signal quality, and firmware status'},
    {id:'MAINTENANCE',icon:'⌕',name:'Maintenance Report',description:'Maintenance activities, schedules, and outcomes'}
  ];
  selectedTemplate:ReportTemplateId='FENCE_HEALTH';
  configuration:ReportConfigurationValue={province:'',district:'',fence:'',section:'',range:'LAST_30_DAYS',customFrom:'',customTo:'',includeCharts:true,includeAlertHistory:true,includeMaintenanceRecords:false,format:'PDF'};
  filterOptions:ReportFilterOptions={provinces:[],districts:[],fences:[],sections:[]};
  reports:GeneratedReport[]=[];
  notice='';
  generating=false;
  previewing=false;
  optionsLoading=false;
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
    if(this.previewing)return;
    this.previewing=true;
    this.service.preview(this.buildRequest()).pipe(finalize(()=>this.previewing=false)).subscribe({
      next:preview=>this.notice=`${preview.title}: ${preview.recordCount} records across ${preview.scopeLabel} (${preview.dateRangeLabel}).${preview.warnings.length?' '+preview.warnings.join(' '):''}`,
      error:(error:HttpErrorResponse)=>this.notice=this.errorMessage(error,'preview the report')
    });
  }

  generate():void{
    if(this.generating)return;
    this.generating=true;
    this.service.generate(this.buildRequest()).pipe(finalize(()=>this.generating=false)).subscribe({
      next:report=>{this.reports=[report,...this.reports.filter(item=>item.id!==report.id)];this.notice='Report generation has been queued. You may continue using the application.';},
      error:(error:HttpErrorResponse)=>this.notice=this.errorMessage(error,'generate the report')
    });
  }

  download(report:GeneratedReport):void{
    if(report.status!=='READY'||this.downloadingId!==null)return;
    this.downloadingId=report.id;
    this.service.download(report.id).pipe(finalize(()=>this.downloadingId=null)).subscribe({
      next:file=>{const url=URL.createObjectURL(file);const anchor=document.createElement('a');anchor.href=url;anchor.download=this.fileName(report);anchor.click();URL.revokeObjectURL(url);this.notice=`Downloaded ${report.name}.`;},
      error:(error:HttpErrorResponse)=>this.notice=this.errorMessage(error,'download the report')
    });
  }

  private loadFilterOptions():void{
    this.optionsLoading=true;
    const scope={province:this.configuration.province,district:this.configuration.district,fence:this.configuration.fence};
    this.service.getFilterOptions(scope).pipe(finalize(()=>this.optionsLoading=false)).subscribe({
      next:options=>this.filterOptions=options,
      error:()=>{this.filterOptions=this.previewOptions(scope);this.notice='Report filter API unavailable. Displaying scoped preview options.';}
    });
  }

  private loadHistory(showLoading=true):void{
    if(this.historyLoading)return;
    this.historyLoading=true;
    if(showLoading)this.notice='';
    this.service.getHistory().pipe(finalize(()=>this.historyLoading=false)).subscribe({
      next:page=>this.reports=page.items,
      error:()=>{if(!this.reports.length)this.reports=[{id:1,name:'Fence Health Report — June 2026',generatedBy:'Suresh Ambegoda',dateRange:'01 Jun – 30 Jun 2026',generatedAt:'2026-07-01T06:00:00+05:30',status:'READY',size:'2.4 MB',format:'PDF'}];if(showLoading)this.notice='Reports API unavailable. Displaying preview history.';}
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

  private previewOptions(scope:{province:string;district:string;fence:string}):ReportFilterOptions{
    const provinces:ReportOption[]=[{value:'Central',label:'Central'},{value:'Eastern',label:'Eastern'},{value:'North Central',label:'North Central'},{value:'Southern',label:'Southern'},{value:'Uva',label:'Uva'}];
    const districtsByProvince:Record<string,ReportOption[]>={Central:[{value:'Kandy',label:'Kandy'},{value:'Matale',label:'Matale'},{value:'Nuwara Eliya',label:'Nuwara Eliya'}],Eastern:[{value:'Ampara',label:'Ampara'},{value:'Batticaloa',label:'Batticaloa'}],'North Central':[{value:'Anuradhapura',label:'Anuradhapura'},{value:'Polonnaruwa',label:'Polonnaruwa'}],Southern:[{value:'Hambantota',label:'Hambantota'}],Uva:[{value:'Badulla',label:'Badulla'},{value:'Monaragala',label:'Monaragala'}]};
    const fenceRecords=[{province:'Uva',district:'Monaragala',value:'EPF-MNR-A',label:'EPF-MNR-A · Monaragala Zone A'},{province:'North Central',district:'Anuradhapura',value:'EPF-ANR-B',label:'EPF-ANR-B · Anuradhapura Zone B'},{province:'North Central',district:'Polonnaruwa',value:'EPF-PLN-C',label:'EPF-PLN-C · Polonnaruwa Corridor C'},{province:'Eastern',district:'Ampara',value:'EPF-AMP-D',label:'EPF-AMP-D · Ampara Zone D'},{province:'Southern',district:'Hambantota',value:'EPF-HMB-E',label:'EPF-HMB-E · Hambantota Southern E'}];
    const fences=fenceRecords.filter(item=>(!scope.province||item.province===scope.province)&&(!scope.district||item.district===scope.district)).map(({value,label})=>({value,label}));
    const sections=scope.fence?Array.from({length:6},(_,index)=>({value:`SEC-${String(index+1).padStart(3,'0')}`,label:`SEC-${String(index+1).padStart(3,'0')}`})):[];
    return{provinces,districts:scope.province?districtsByProvince[scope.province]??[]:[],fences,sections};
  }
}
