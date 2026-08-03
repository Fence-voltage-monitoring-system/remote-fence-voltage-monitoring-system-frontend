import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { AlertService } from '../../core/services/alert.service';
import { Alerts } from './alerts';

describe('Alerts',()=>{
  it('loads alerts and statistics',async()=>{
    const items=[{id:1,code:'A1',title:'Wire break',type:'WIRE_BREAK',severity:'CRITICAL' as const,province:'Uva',district:'Monaragala',fence:'F1',section:'S1',value:'0',threshold:'3',detected:'10:00',status:'UNACKNOWLEDGED' as const,assignee:'None',device:'D1',comments:[]}];
    await TestBed.configureTestingModule({imports:[Alerts],providers:[provideRouter([]),{provide:AlertService,useValue:{getAlerts:()=>of({items,page:1,pageSize:20,totalItems:1,totalPages:1}),getStats:()=>of({activeCritical:1,activeWarnings:0,unacknowledged:1,underMaintenance:0,resolvedToday:0}),connectLive:()=>NEVER}}]}).compileComponents();
    const fixture=TestBed.createComponent(Alerts);fixture.detectChanges();
    expect(fixture.componentInstance.alerts.length).toBe(1);expect(fixture.componentInstance.critical).toBe(1);
  });

  it('supports assignment acceptance in preview mode',async()=>{
    await TestBed.configureTestingModule({imports:[Alerts],providers:[provideRouter([]),{provide:AlertService,useValue:{getAlerts:()=>throwError(()=>new Error('offline')),getStats:()=>throwError(()=>new Error('offline')),connectLive:()=>NEVER}}]}).compileComponents();
    const fixture=TestBed.createComponent(Alerts);fixture.detectChanges();
    const alert=fixture.componentInstance.alerts[0];fixture.componentInstance.accept(alert);
    expect(alert.assignmentStatus).toBe('ACCEPTED');
  });
});
