import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NEVER, of, throwError } from 'rxjs';
import { AlertService } from '../../core/services/alert.service';
import { Alerts } from './alerts';
import { IncidentPanel } from './components/incident-panel/incident-panel';
import { AlertRecord } from './alerts.models';

const alert:AlertRecord={id:1,code:'A1',title:'Wire break',type:'WIRE_BREAK',severity:'CRITICAL',province:'Uva',district:'Monaragala',fence:'F1',section:'S1',value:'0',threshold:'3',detected:'2026-09-06T10:00:00+05:30',status:'UNACKNOWLEDGED',assignee:'None',device:'D1',comments:[],allowedActions:['ACKNOWLEDGE']};
describe('Alerts',()=>{
  async function setup(overrides:object={}){
    const service={getAlerts:()=>of({items:[{...alert}],page:1,pageSize:20,totalItems:1,totalPages:1}),getStats:()=>of({activeCritical:1,activeWarnings:0,unacknowledged:1,underMaintenance:0,resolvedToday:0}),getOptions:()=>of({fences:[],types:['WIRE_BREAK']}),connectLive:()=>NEVER,...overrides};
    await TestBed.configureTestingModule({imports:[Alerts],providers:[provideRouter([]),provideHttpClient(),{provide:AlertService,useValue:service}]}).compileComponents();
    const fixture=TestBed.createComponent(Alerts);fixture.detectChanges();return fixture;
  }
  it('loads persisted alerts and statistics',async()=>{
    const fixture=await setup();
    expect(fixture.componentInstance.alerts.length).toBe(1);expect(fixture.componentInstance.critical).toBe(1);
  });
  it('does not invent preview incidents when API fails',async()=>{
    const fixture=await setup({getAlerts:()=>throwError(()=>new Error('offline'))});
    expect(fixture.componentInstance.alerts).toEqual([]);
    expect(fixture.componentInstance.error).toContain('Unable to load');
  });
  it('keeps incident state after a rejected action',async()=>{
    const fixture=await setup({acknowledge:()=>throwError(()=>({error:{message:'Incident changed. Refresh.'}}))});
    const page=fixture.componentInstance;page.selected=page.alerts[0];page.acknowledge(page.selected);
    expect(page.selected.status).toBe('UNACKNOWLEDGED');expect(page.successVersion).toBe(0);
    expect(page.error).toBe('Incident changed. Refresh.');expect(page.isActionPending).toBe(false);
  });
  it('uses the response for a successful action',async()=>{
    const fixture=await setup({acknowledge:()=>of({...alert,status:'ACKNOWLEDGED'})});
    const page=fixture.componentInstance;page.acknowledge(page.alerts[0]);
    expect(page.selected?.status).toBe('ACKNOWLEDGED');expect(page.successVersion).toBe(1);
  });
});
describe('IncidentPanel',()=>{
  it('preserves entered comments until the server confirms success',()=>{
    const panel=new IncidentPanel();panel.alert=alert;panel.comment='Investigating';
    panel.addComment();expect(panel.comment).toBe('Investigating');
  });
  it('does not offer actions absent from server permissions',()=>{
    const panel=new IncidentPanel();panel.alert=alert;
    expect(panel.allowed('ACKNOWLEDGE')).toBe(true);expect(panel.allowed('RESOLVE')).toBe(false);
  });
  it('requires a completion summary',()=>{
    const panel=new IncidentPanel();panel.alert=alert;panel.cause='Wire';panel.actions='Repaired';
    let submitted=false;panel.workCompleted.subscribe(()=>submitted=true);
    panel.submitComplete();expect(submitted).toBe(false);
    panel.workSummary='Finished';panel.submitComplete();expect(submitted).toBe(true);
  });
});

