import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Reports } from './reports';

describe('Reports',()=>{
  async function create(){await TestBed.configureTestingModule({imports:[Reports],providers:[provideHttpClient()]}).compileComponents();return TestBed.createComponent(Reports).componentInstance;}
  it('clears dependent filters when province changes',async()=>{const component=await create();component.configuration={...component.configuration,province:'Uva',district:'Monaragala',fence:'EPF-MNR-A',section:'SEC-001'};component.configurationChanged({...component.configuration,province:'Central',district:'',fence:'',section:''});expect(component.configuration.district).toBe('');expect(component.configuration.fence).toBe('');});
  it('builds all-scope values as null in generation requests',async()=>{const component=await create();const request=(component as unknown as {buildRequest:()=>{scope:{province:string|null}}}).buildRequest();expect(request.scope.province).toBeNull();});
});
