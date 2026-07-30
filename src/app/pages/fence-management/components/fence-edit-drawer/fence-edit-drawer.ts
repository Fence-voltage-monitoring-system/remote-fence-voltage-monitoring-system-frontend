import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FenceRecord, MaintenanceUserOption } from '../../fence-management.models';

export interface FenceEditValue { id:number; name:string; code:string; province:string; district:string; lengthKm:number; installationDate:string; gateway:string; startGps:string; endGps:string; description:string; primaryMaintenanceUserId:number; backupMaintenanceUserIds:number[]; }
@Component({selector:'app-fence-edit-drawer',standalone:true,imports:[ReactiveFormsModule],templateUrl:'./fence-edit-drawer.html',styleUrls:['./fence-edit-drawer.css','./fence-edit-modal.css']})
export class FenceEditDrawer {
 @Input({required:true}) fence!:FenceRecord; @Input() maintenanceUsers:MaintenanceUserOption[]=[]; @Output() closed=new EventEmitter<void>(); @Output() saved=new EventEmitter<FenceEditValue>(); @Output() deleted=new EventEmitter<FenceRecord>();
 isClosing=false; isDeleteConfirming=false; readonly provinces=['Central','Eastern','North Central','Southern','Uva'];
 readonly districtMap:Record<string,string[]>={Central:['Kandy','Matale','Nuwara Eliya'],Eastern:['Ampara','Batticaloa','Trincomalee'],'North Central':['Anuradhapura','Polonnaruwa'],Southern:['Galle','Hambantota','Matara'],Uva:['Badulla','Monaragala']};
 readonly gateways=['GTW-MNR-01','GTW-ANR-02','GTW-PLN-03','GTW-AMP-04','GTW-HMB-05'];
 readonly coordinatePattern=/-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?/;
 readonly form=new FormGroup({name:new FormControl('',{nonNullable:true,validators:Validators.required}),code:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.pattern(/^EPF-[A-Z0-9-]+$/)]}),province:new FormControl('',{nonNullable:true,validators:Validators.required}),district:new FormControl('',{nonNullable:true,validators:Validators.required}),lengthKm:new FormControl<number|null>(null,[Validators.required,Validators.min(.1)]),installationDate:new FormControl('',{nonNullable:true,validators:Validators.required}),gateway:new FormControl('',{nonNullable:true,validators:Validators.required}),startGps:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.pattern(this.coordinatePattern)]}),endGps:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.pattern(this.coordinatePattern)]}),description:new FormControl('',{nonNullable:true}),primaryMaintenanceUserId:new FormControl<number|null>(null,Validators.required),backupMaintenanceUserIds:new FormControl<number[]>([],{nonNullable:true})});
 get districts(){return this.districtMap[this.form.controls.province.value]??[];}
 get eligibleMaintenanceUsers(){const v=this.form.getRawValue();return this.maintenanceUsers.filter(user=>user.active&&user.province===v.province&&user.district===v.district);}
 get backupCandidates(){return this.eligibleMaintenanceUsers.filter(user=>user.id!==this.form.controls.primaryMaintenanceUserId.value);}
 ngOnInit(){this.form.reset({name:this.fence.name,code:this.fence.code,province:this.fence.province,district:this.fence.district,lengthKm:this.fence.lengthKm,installationDate:'2023-01-15',gateway:this.fence.gateway,startGps:'6.8721, 81.3382',endGps:'6.9102, 81.4210',description:'',primaryMaintenanceUserId:this.fence.primaryMaintenanceUserId??null,backupMaintenanceUserIds:this.fence.backupMaintenanceUserIds??[]});}
 changeProvince(province:string){this.form.controls.province.setValue(province);this.changeDistrict(this.districtMap[province]?.[0]??'');}
 changeDistrict(district:string){this.form.controls.district.setValue(district);this.clearMaintenanceTeam();}
 changePrimary(userId:string){const id=Number(userId)||null;this.form.controls.primaryMaintenanceUserId.setValue(id);this.form.controls.backupMaintenanceUserIds.setValue(this.form.controls.backupMaintenanceUserIds.value.filter(item=>item!==id));}
 toggleBackup(userId:number,checked:boolean){const selected=this.form.controls.backupMaintenanceUserIds.value;this.form.controls.backupMaintenanceUserIds.setValue(checked?[...selected,userId]:selected.filter(id=>id!==userId));}
 isBackupSelected(userId:number){return this.form.controls.backupMaintenanceUserIds.value.includes(userId);}
 @HostListener('document:keydown.escape') escape(){this.close();}
 close(){this.leave(()=>this.closed.emit());}
 requestDelete(){if(!this.isDeleteConfirming){this.isDeleteConfirming=true;return;}this.leave(()=>this.deleted.emit(this.fence));}
 cancelDelete(){this.isDeleteConfirming=false;}
 submit(){if(this.form.invalid){this.form.markAllAsTouched();return;}const v=this.form.getRawValue();this.leave(()=>this.saved.emit({id:this.fence.id,name:v.name,code:v.code,province:v.province,district:v.district,lengthKm:v.lengthKm!,installationDate:v.installationDate,gateway:v.gateway,startGps:v.startGps,endGps:v.endGps,description:v.description,primaryMaintenanceUserId:v.primaryMaintenanceUserId!,backupMaintenanceUserIds:v.backupMaintenanceUserIds}));}
 private clearMaintenanceTeam(){this.form.controls.primaryMaintenanceUserId.setValue(null);this.form.controls.backupMaintenanceUserIds.setValue([]);}
 private leave(done:()=>void){if(this.isClosing)return;this.isClosing=true;window.setTimeout(done,280);}
}
