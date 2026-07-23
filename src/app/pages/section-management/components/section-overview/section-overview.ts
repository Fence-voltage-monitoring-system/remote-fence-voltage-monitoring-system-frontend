import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FenceOption } from '../../section-management.models';
@Component({ selector:'app-section-overview', standalone:true, imports:[FormsModule], templateUrl:'./section-overview.html' })
export class SectionOverview { @Input() fences: FenceOption[]=[]; @Input({required:true}) selected!: FenceOption; @Output() fenceChanged=new EventEmitter<string>(); }
