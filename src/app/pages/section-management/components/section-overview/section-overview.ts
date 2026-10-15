import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FenceOption } from '../../section-management.models';
import { SystemIdentityService } from '../../../../core/services/system-identity.service';
@Component({ selector:'app-section-overview', standalone:true, imports:[FormsModule], templateUrl:'./section-overview.html' })
export class SectionOverview {
  readonly identity = inject(SystemIdentityService);
  @Input() fences: FenceOption[]=[];
  @Input({required:true}) selected!: FenceOption;
  @Output() fenceChanged=new EventEmitter<string>();
}
