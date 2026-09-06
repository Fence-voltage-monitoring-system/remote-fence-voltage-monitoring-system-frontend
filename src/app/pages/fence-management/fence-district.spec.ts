import { TestBed } from '@angular/core/testing';
import { FenceEditDrawer } from './components/fence-edit-drawer/fence-edit-drawer';
describe('Fence edit saved district selection', () => {
  it('displays Puttalam rather than the first district and saves its original ID', async () => {
    await TestBed.configureTestingModule({imports:[FenceEditDrawer]}).compileComponents();
    const fixture=TestBed.createComponent(FenceEditDrawer);
    fixture.componentRef.setInput('locations',[{id:5,name:'North Western',districts:[{id:14,name:'Kurunegala'},{id:15,name:'Puttalam'}]}]);
    fixture.componentRef.setInput('fence',{id:42,code:'F-PUT',name:'Puttalam fence',provinceId:5,districtId:15,province:'North Western',district:'Puttalam',lengthKm:2,sections:0,health:'OFFLINE',averageVoltageKv:null});
    fixture.detectChanges();
    await fixture.whenStable();
    const select=fixture.nativeElement.querySelector('#edit-district') as HTMLSelectElement;
    expect(select.selectedOptions[0]?.textContent?.trim()).toBe('Puttalam');
    const saved=vi.fn();fixture.componentInstance.saved.subscribe(saved);
    fixture.componentInstance.submit();
    expect(saved).toHaveBeenCalledWith(expect.objectContaining({districtId:15,district:'Puttalam'}));
    select.value='Kurunegala';select.dispatchEvent(new Event('change'));fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(saved).toHaveBeenLastCalledWith(expect.objectContaining({districtId:14,district:'Kurunegala'}));
  });
});

