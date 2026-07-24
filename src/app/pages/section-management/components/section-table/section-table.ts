import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FenceSection, SectionStatus } from '../../section-management.models';
@Component({ selector:'app-section-table', standalone:true, templateUrl:'./section-table.html', styleUrls:['./section-table.css','./section-table-compact.css'] })
export class SectionTable { @Input() sections:FenceSection[]=[]; @Output() edit=new EventEmitter<FenceSection>(); statusClass(s:SectionStatus){return s.toLowerCase();} batteryClass(v:number|null){return v===null?'offline':v<20?'critical':v<60?'warning':'healthy';} }
