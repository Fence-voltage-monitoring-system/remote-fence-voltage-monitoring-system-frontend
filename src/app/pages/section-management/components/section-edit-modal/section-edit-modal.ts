import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FenceOption, FenceSection } from '../../section-management.models';

export interface SectionEditValue { id:number; fenceCode:string; sectionCode:string; startLatitude:number; startLongitude:number; endLatitude:number; endLongitude:number; lengthKm:number; installationDate:string; maintenanceNotes:string; }
@Component({selector:'app-section-edit-modal',standalone:true,imports:[ReactiveFormsModule],templateUrl:'./section-edit-modal.html',styleUrls:['./section-edit-modal.css','./section-delete.css']})
export class SectionEditModal {
 @Input({required:true}) section!:FenceSection; @Input() fences:FenceOption[]=[]; @Output() closed=new EventEmitter<void>(); @Output() saved=new EventEmitter<SectionEditValue>();
 isClosing=false; isDeleteConfirming=false;
 readonly form=new FormGroup({fenceCode:new FormControl('',{nonNullable:true,validators:Validators.required}),sectionCode:new FormControl({value:'',disabled:true},{nonNullable:true}),startLatitude:new FormControl<number|null>(null,[Validators.required,Validators.min(-90),Validators.max(90)]),startLongitude:new FormControl<number|null>(null,[Validators.required,Validators.min(-180),Validators.max(180)]),endLatitude:new FormControl<number|null>(null,[Validators.required,Validators.min(-90),Validators.max(90)]),endLongitude:new FormControl<number|null>(null,[Validators.required,Validators.min(-180),Validators.max(180)]),lengthKm:new FormControl<number|null>(null,[Validators.required,Validators.min(.1)]),installationDate:new FormControl('',{nonNullable:true,validators:Validators.required}),maintenanceNotes:new FormControl('',{nonNullable:true})});
 ngOnInit(){const start=this.parseGps(this.section.startGps),end=this.parseGps(this.section.endGps);this.form.reset({fenceCode:this.section.fenceCode,sectionCode:this.section.code,startLatitude:start[0],startLongitude:start[1],endLatitude:end[0],endLongitude:end[1],lengthKm:this.section.lengthKm,installationDate:'2024-07-24',maintenanceNotes:this.section.maintenance==='No Issues'?'':this.section.maintenance});}
 @HostListener('document:keydown.escape') escape(){this.close();}
 close(){this.leave(()=>this.closed.emit());}
 requestDelete(){if(!this.isDeleteConfirming){this.isDeleteConfirming=true;return;}this.section.id=-1;this.leave(()=>this.closed.emit());}
 cancelDelete(){this.isDeleteConfirming=false;}
 submit(){if(this.form.invalid){this.form.markAllAsTouched();return;}const v=this.form.getRawValue();this.leave(()=>this.saved.emit({id:this.section.id,fenceCode:v.fenceCode,sectionCode:v.sectionCode,startLatitude:v.startLatitude!,startLongitude:v.startLongitude!,endLatitude:v.endLatitude!,endLongitude:v.endLongitude!,lengthKm:v.lengthKm!,installationDate:v.installationDate,maintenanceNotes:v.maintenanceNotes}));}
 private parseGps(gps:string):[number,number]{const [lat,lng]=gps.split(',').map(Number);return [lat||0,lng||0];}
 private leave(done:()=>void){if(this.isClosing)return;this.isClosing=true;window.setTimeout(done,280);}
}
