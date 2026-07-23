import { Component } from '@angular/core';
import { SectionOverview } from './components/section-overview/section-overview';
import { SectionToolbar } from './components/section-toolbar/section-toolbar';
import { SectionTable } from './components/section-table/section-table';
import { FenceOption, FenceSection } from './section-management.models';
import { SectionRegistrationDrawer, SectionRegistrationValue } from './components/section-registration-drawer/section-registration-drawer';
@Component({selector:'app-section-management',standalone:true,imports:[SectionOverview,SectionToolbar,SectionTable,SectionRegistrationDrawer],templateUrl:'./section-management.html',styleUrl:'./section-management.css'})
export class SectionManagement {
 readonly fences:FenceOption[]=[{code:'EPF-MNR-A',name:'Monaragala Zone A',totalSections:12,totalLengthKm:48.6,operational:8,averageVoltageKv:5.4},{code:'EPF-ANR-B',name:'Anuradhapura Zone B',totalSections:16,totalLengthKm:62.4,operational:15,averageVoltageKv:5.9}];
 readonly sections:FenceSection[]=[
 {id:1,fenceCode:'EPF-MNR-A',code:'SEC-001',startGps:'6.8721, 81.3382',endGps:'6.8845, 81.3420',lengthKm:4.2,device:'DEV-EFE-0047',voltageKv:6.2,battery:87,maintenance:'No Issues',status:'HEALTHY',updated:'12s ago'},
 {id:2,fenceCode:'EPF-MNR-A',code:'SEC-002',startGps:'6.8845, 81.3420',endGps:'6.8960, 81.3460',lengthKm:3.9,device:'DEV-EFE-0048',voltageKv:5.8,battery:74,maintenance:'No Issues',status:'HEALTHY',updated:'18s ago'},
 {id:3,fenceCode:'EPF-MNR-A',code:'SEC-003',startGps:'6.8960, 81.3460',endGps:'6.9080, 81.3498',lengthKm:4.1,device:'DEV-EFE-0049',voltageKv:4.1,battery:45,maintenance:'Scheduled Check',status:'WARNING',updated:'34s ago'},
 {id:4,fenceCode:'EPF-MNR-A',code:'SEC-004',startGps:'6.9080, 81.3498',endGps:'6.9195, 81.3536',lengthKm:3.7,device:'DEV-EFE-0050',voltageKv:0,battery:12,maintenance:'Urgent Repair',status:'CRITICAL',updated:'4m ago'},
 {id:5,fenceCode:'EPF-MNR-A',code:'SEC-005',startGps:'6.9195, 81.3536',endGps:'6.9310, 81.3574',lengthKm:4.5,device:'DEV-EFE-0051',voltageKv:5.9,battery:91,maintenance:'No Issues',status:'HEALTHY',updated:'8s ago'},
 {id:6,fenceCode:'EPF-MNR-A',code:'SEC-006',startGps:'6.9310, 81.3574',endGps:'6.9430, 81.3615',lengthKm:4,device:null,voltageKv:null,battery:null,maintenance:'No Device',status:'OFFLINE',updated:'22m ago'}];
 selectedFence=this.fences[0]; search=''; status=''; notice=''; isRegistrationOpen=false;
 get filteredSections(){const q=this.search.trim().toLowerCase();return this.sections.filter(s=>s.fenceCode===this.selectedFence.code&&(!q||`${s.code} ${s.device??''}`.toLowerCase().includes(q))&&(!this.status||s.status===this.status));}
 selectFence(code:string){this.selectedFence=this.fences.find(f=>f.code===code)??this.fences[0];}
 message(value:string){this.notice=value;}
 openRegistration(){this.isRegistrationOpen=true;}
 closeRegistration(){this.isRegistrationOpen=false;}
 registerSection(section:SectionRegistrationValue){this.notice=`${section.sectionCode} was submitted for registration.`;this.closeRegistration();}
}
