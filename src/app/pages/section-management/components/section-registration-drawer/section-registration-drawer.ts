import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FenceOption } from '../../section-management.models';

export interface SectionRegistrationValue { fenceCode:string; sectionCode:string; startLatitude:number; startLongitude:number; endLatitude:number; endLongitude:number; lengthKm:number; installationDate:string; maintenanceNotes:string; }
@Component({selector:'app-section-registration-drawer',standalone:true,imports:[ReactiveFormsModule],templateUrl:'./section-registration-drawer.html',styleUrl:'./section-registration-drawer.css'})
export class SectionRegistrationDrawer {
 @Input() fences:FenceOption[]=[]; @Input() selectedFenceCode=''; @Output() closed=new EventEmitter<void>(); @Output() registered=new EventEmitter<SectionRegistrationValue>();
 isClosing=false;
 readonly form=new FormGroup({
  fenceCode:new FormControl('',{nonNullable:true,validators:Validators.required}), sectionCode:new FormControl({value:'SEC-013',disabled:true},{nonNullable:true}),
  startLatitude:new FormControl<number|null>(6.9430,[Validators.required,Validators.min(-90),Validators.max(90)]), startLongitude:new FormControl<number|null>(81.3615,[Validators.required,Validators.min(-180),Validators.max(180)]),
  endLatitude:new FormControl<number|null>(6.9550,[Validators.required,Validators.min(-90),Validators.max(90)]), endLongitude:new FormControl<number|null>(81.3653,[Validators.required,Validators.min(-180),Validators.max(180)]),
  lengthKm:new FormControl<number|null>(4,[Validators.required,Validators.min(.1)]), installationDate:new FormControl('',{nonNullable:true,validators:Validators.required}), maintenanceNotes:new FormControl('',{nonNullable:true})
 });
 ngOnInit(){this.form.controls.fenceCode.setValue(this.selectedFenceCode||this.fences[0]?.code||'');}
 @HostListener('document:keydown.escape') escape(){this.close();}
 close(){this.leave(()=>this.closed.emit());}
 submit(){if(this.form.invalid){this.form.markAllAsTouched();return;}const v=this.form.getRawValue();const value:SectionRegistrationValue={fenceCode:v.fenceCode,sectionCode:v.sectionCode,startLatitude:v.startLatitude!,startLongitude:v.startLongitude!,endLatitude:v.endLatitude!,endLongitude:v.endLongitude!,lengthKm:v.lengthKm!,installationDate:v.installationDate,maintenanceNotes:v.maintenanceNotes};this.leave(()=>this.registered.emit(value));}
 private leave(done:()=>void){if(this.isClosing)return;this.isClosing=true;window.setTimeout(done,280);}
}
