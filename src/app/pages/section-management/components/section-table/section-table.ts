import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FenceSection, SectionStatus } from '../../section-management.models';
import { SystemIdentityService } from '../../../../core/services/system-identity.service';
@Component({ selector:'app-section-table', standalone:true, templateUrl:'./section-table.html', styleUrls:['./section-table.css','./section-table-compact.css'] })
export class SectionTable {
  readonly identity = inject(SystemIdentityService);
  @Input() canEdit=true;
  @Input() sections:FenceSection[]=[];
  @Output() edit=new EventEmitter<FenceSection>();
  statusClass(s:SectionStatus){return s.toLowerCase();}
  batteryClass(v:number|null){return this.identity.getBatteryStatus(v);}
}
