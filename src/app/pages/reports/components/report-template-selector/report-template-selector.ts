import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReportTemplate, ReportTemplateId } from '../../reports.models';

@Component({selector:'app-report-template-selector',standalone:true,templateUrl:'./report-template-selector.html',styleUrl:'./report-template-selector.css'})
export class ReportTemplateSelector {
  @Input({required:true}) templates!:ReportTemplate[];
  @Input({required:true}) selected!:ReportTemplateId;
  @Output() selectedChange=new EventEmitter<ReportTemplateId>();
}
