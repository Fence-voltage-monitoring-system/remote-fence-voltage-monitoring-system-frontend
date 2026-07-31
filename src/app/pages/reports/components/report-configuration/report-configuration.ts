import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportConfigurationValue, ReportFormat, ReportOption, ReportRange, ReportTemplateId } from '../../reports.models';

@Component({selector:'app-report-configuration',standalone:true,imports:[FormsModule],templateUrl:'./report-configuration.html',styleUrl:'./report-configuration.css'})
export class ReportConfiguration {
  @Input({required:true}) value!:ReportConfigurationValue;
  @Input({required:true}) template!:ReportTemplateId;
  @Input() provinces:ReportOption[]=[];
  @Input() districts:ReportOption[]=[];
  @Input() fences:ReportOption[]=[];
  @Input() sections:ReportOption[]=[];
  @Input() optionsLoading=false;
  @Input() generating=false;
  @Output() valueChange=new EventEmitter<ReportConfigurationValue>();
  @Output() previewRequested=new EventEmitter<void>();
  @Output() generateRequested=new EventEmitter<void>();

  readonly ranges:{id:ReportRange;label:string}[]=[{id:'TODAY',label:'Today'},{id:'LAST_7_DAYS',label:'Last 7 Days'},{id:'LAST_30_DAYS',label:'Last 30 Days'},{id:'LAST_90_DAYS',label:'Last 90 Days'},{id:'CUSTOM',label:'Custom'}];

  get valid():boolean{return this.value.range!=='CUSTOM'||(!!this.value.customFrom&&!!this.value.customTo&&this.value.customFrom<=this.value.customTo);}
  get chartsAvailable():boolean{return this.value.format==='PDF';}

  update<K extends keyof ReportConfigurationValue>(field:K,value:ReportConfigurationValue[K]):void{
    let next={...this.value,[field]:value};
    if(field==='province')next={...next,district:'',fence:'',section:''};
    if(field==='district')next={...next,fence:'',section:''};
    if(field==='fence')next={...next,section:''};
    if(field==='format'&&value==='CSV')next={...next,includeCharts:false};
    this.valueChange.emit(next);
  }
  setRange(range:ReportRange):void{this.update('range',range);}
  setFormat(format:ReportFormat):void{this.update('format',format);}
}
