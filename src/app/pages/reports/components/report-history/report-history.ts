import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GeneratedReport } from '../../reports.models';

@Component({selector:'app-report-history',standalone:true,imports:[DatePipe],templateUrl:'./report-history.html',styleUrl:'./report-history.css'})
export class ReportHistory {
  @Input() reports:GeneratedReport[]=[];
  @Output() downloadRequested=new EventEmitter<GeneratedReport>();
}
