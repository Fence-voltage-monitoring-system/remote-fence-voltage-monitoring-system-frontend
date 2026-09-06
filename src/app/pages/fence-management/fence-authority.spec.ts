import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FenceManagement } from './fence-management';
import { ManagementAccessService, ManagementRole } from '../../core/services/management-access.service';
import { FenceRegistrationDrawer } from './components/fence-registration-drawer/fence-registration-drawer';

describe('Fence authority permissions', () => {
  const locations = [
    { id:1, name:'Uva', districts:[{id:11,name:'Monaragala'},{id:12,name:'Badulla'}] },
    { id:2, name:'Western', districts:[{id:21,name:'Colombo'}] },
  ];
  function pageFor(role:ManagementRole, provinces:string[], districts:string[]) {
    TestBed.configureTestingModule({imports:[FenceManagement],providers:[provideHttpClient(),provideHttpClientTesting()]});
    const access=TestBed.inject(ManagementAccessService);
    access.setScope({role,provinces,districts});
    const page=TestBed.createComponent(FenceManagement).componentInstance;
    page.locations=locations;
    return page;
  }
  afterEach(()=>TestBed.inject(HttpTestingController).verify());
  it('allows Super Admin to select every location',()=>{
    const page=pageFor('SUPER_ADMIN',[],[]);
    expect(page.editableLocations).toEqual(locations);
    page.openRegistration();expect(page.isRegistrationOpen).toBe(true);
  });
  it('allows Regional Admin to select districts within assigned provinces',()=>{
    const page=pageFor('REGIONAL_ADMIN',['Uva'],[]);
    expect(page.editableLocations).toEqual([locations[0]]);
    const drawer=new FenceRegistrationDrawer();drawer.locations=page.editableLocations;drawer.ngOnInit();
    drawer.changeDistrict('Badulla');expect(drawer.form.controls.district.value).toBe('Badulla');
    drawer.changeProvince('Western');expect(drawer.form.controls.province.value).toBe('Uva');
  });
  it('allows a district-only Field Admin to register and edit within that district',()=>{
    const page=pageFor('FIELD_ADMIN',[],['Monaragala']);
    expect(page.editableLocations).toEqual([{...locations[0],districts:[locations[0].districts[0]]}]);
    page.openRegistration();expect(page.isRegistrationOpen).toBe(true);
    page.fences=[{id:1,code:'F-1',name:'Test',province:'Uva',district:'Monaragala',lengthKm:1,sections:0,health:'OFFLINE',averageVoltageKv:null}];
    expect(page.accessibleFences.length).toBe(1);
    page.selectFence(page.fences[0]);
    expect(page.selectedFence?.id).toBe(1);
    TestBed.inject(HttpTestingController).expectOne('/api/fences/maintenance-candidates?fenceId=1').flush([]);
    page.ngOnDestroy();
  });
  it('blocks maintenance users and administrators without an assigned scope',()=>{
    const page=pageFor('MAINTENANCE',['Uva'],['Monaragala']);
    page.openRegistration();expect(page.isRegistrationOpen).toBe(false);
    TestBed.inject(ManagementAccessService).setScope({role:'REGIONAL_ADMIN',provinces:[],districts:[]});
    page.openRegistration();expect(page.isRegistrationOpen).toBe(false);expect(page.error).toContain('No locations');
  });
  it('rejects registration submitted outside the assigned district',()=>{
    const page=pageFor('FIELD_ADMIN',[],['Monaragala']);
    page.registerFence({name:'Test',code:'F-NEW',province:'Western',district:'Colombo',provinceId:2,districtId:21,lengthKm:1,
      installationDate:'',gateway:'',startGps:'',endGps:'',description:'',primaryMaintenanceUserId:null,backupMaintenanceUserIds:[]});
    TestBed.inject(HttpTestingController).expectNone('/api/fences');
    expect(page.error).toContain('assigned authority');
  });
});
