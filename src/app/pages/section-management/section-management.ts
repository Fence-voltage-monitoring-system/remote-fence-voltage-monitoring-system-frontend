import { Component, inject } from '@angular/core';
import { ManagementAccessService } from '../../core/services/management-access.service';
import { SectionOverview } from './components/section-overview/section-overview';
import { SectionToolbar } from './components/section-toolbar/section-toolbar';
import { SectionTable } from './components/section-table/section-table';
import { FenceOption, FenceSection } from './section-management.models';
import { SectionRegistrationDrawer, SectionRegistrationValue } from './components/section-registration-drawer/section-registration-drawer';
import { SectionEditModal, SectionEditValue } from './components/section-edit-modal/section-edit-modal';
import { BulkSectionRow, SectionBulkAddModal } from './components/section-bulk-add-modal/section-bulk-add-modal';
@Component({selector:'app-section-management',standalone:true,imports:[SectionOverview,SectionToolbar,SectionTable,SectionRegistrationDrawer,SectionEditModal,SectionBulkAddModal],templateUrl:'./section-management.html',styleUrl:'./section-management.css'})
export class SectionManagement {
 readonly access=inject(ManagementAccessService);
 readonly fences:FenceOption[]=[{code:'EPF-MNR-A',name:'Monaragala Zone A',province:'Uva',district:'Monaragala',totalSections:12,totalLengthKm:48.6,operational:8,averageVoltageKv:5.4},{code:'EPF-ANR-B',name:'Anuradhapura Zone B',province:'North Central',district:'Anuradhapura',totalSections:16,totalLengthKm:62.4,operational:15,averageVoltageKv:5.9}];
 readonly sections:FenceSection[]=[
 {id:1,fenceCode:'EPF-MNR-A',code:'SEC-001',startGps:'6.8721, 81.3382',endGps:'6.8845, 81.3420',lengthKm:4.2,device:'DEV-EFE-0047',voltageKv:6.2,battery:87,maintenance:'No Issues',status:'HEALTHY',updated:'12s ago'},
 {id:2,fenceCode:'EPF-MNR-A',code:'SEC-002',startGps:'6.8845, 81.3420',endGps:'6.8960, 81.3460',lengthKm:3.9,device:'DEV-EFE-0048',voltageKv:5.8,battery:74,maintenance:'No Issues',status:'HEALTHY',updated:'18s ago'},
 {id:3,fenceCode:'EPF-MNR-A',code:'SEC-003',startGps:'6.8960, 81.3460',endGps:'6.9080, 81.3498',lengthKm:4.1,device:'DEV-EFE-0049',voltageKv:4.1,battery:45,maintenance:'Scheduled Check',status:'WARNING',updated:'34s ago'},
 {id:4,fenceCode:'EPF-MNR-A',code:'SEC-004',startGps:'6.9080, 81.3498',endGps:'6.9195, 81.3536',lengthKm:3.7,device:'DEV-EFE-0050',voltageKv:0,battery:12,maintenance:'Urgent Repair',status:'CRITICAL',updated:'4m ago'},
 {id:5,fenceCode:'EPF-MNR-A',code:'SEC-005',startGps:'6.9195, 81.3536',endGps:'6.9310, 81.3574',lengthKm:4.5,device:'DEV-EFE-0051',voltageKv:5.9,battery:91,maintenance:'No Issues',status:'HEALTHY',updated:'8s ago'},
 {id:6,fenceCode:'EPF-MNR-A',code:'SEC-006',startGps:'6.9310, 81.3574',endGps:'6.9430, 81.3615',lengthKm:4,device:null,voltageKv:null,battery:null,maintenance:'No Device',status:'OFFLINE',updated:'22m ago'}];
 province=this.access.lockedProvince;district=this.access.lockedDistrict;selectedFence=this.accessibleFences[0]??this.fences[0]; search=''; status=''; notice=''; isRegistrationOpen=false; isBulkAddOpen=false; selectedSection:FenceSection|null=null;
 get accessibleFences(){return this.fences.filter(f=>this.access.canView(f.province,f.district)&&(!this.province||f.province===this.province)&&(!this.district||f.district===this.district));}
 get provinces(){return this.access.provinces([...new Set(this.fences.map(f=>f.province))]);}
 get districts(){const all=[...new Set(this.fences.filter(f=>this.access.canView(f.province,f.district)&&(!this.province||f.province===this.province)).map(f=>f.district))];return this.access.districts(this.province,all);}
 get filteredSections(){const q=this.search.trim().toLowerCase();return this.sections.filter(s=>s.id>=0&&s.fenceCode===this.selectedFence.code&&this.accessibleFences.some(f=>f.code===s.fenceCode)&&(!q||`${s.code} ${s.device??''}`.toLowerCase().includes(q))&&(!this.status||s.status===this.status));}
 selectFence(code:string){this.selectedFence=this.fences.find(f=>f.code===code)??this.fences[0];}
 changeProvince(province:string){this.province=province;this.district='';this.selectFirstAccessibleFence();}
 changeDistrict(district:string){this.district=district;this.selectFirstAccessibleFence();}
 private selectFirstAccessibleFence(){this.selectedFence=this.accessibleFences[0]??this.selectedFence;}
 message(value:string){this.notice=value;}
 openRegistration(){this.isRegistrationOpen=true;}
 closeRegistration(){this.isRegistrationOpen=false;}
 registerSection(section:SectionRegistrationValue){this.notice=`${section.sectionCode} was submitted for registration.`;this.closeRegistration();}
 editSection(section:FenceSection){this.selectedSection=section;}
 closeEdit(){this.selectedSection=null;}
 saveSection(section:SectionEditValue){this.notice=`${section.sectionCode} changes were saved.`;this.closeEdit();}
 openBulkAdd(){this.isBulkAddOpen=true;}
 closeBulkAdd(){this.isBulkAddOpen=false;}
 importSections(result:{fenceCode:string;rows:BulkSectionRow[]}){this.notice=`${result.rows.length} sections were submitted for ${result.fenceCode}.`;this.closeBulkAdd();}
}
