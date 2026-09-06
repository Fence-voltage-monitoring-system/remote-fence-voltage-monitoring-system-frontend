import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { LiveUpdatesService } from './live-updates.service';
import { AlertOptions, CreateAlertRequest } from '../../pages/alerts/alerts.models';
import { Observable } from 'rxjs';
import { AlertFilters, AlertPage, AlertRecord, AlertStats, CompleteWorkRequest, DeclineAssignmentRequest, MaintenanceStaffOption, ReassignAlertRequest } from '../../pages/alerts/alerts.models';

@Injectable({providedIn:'root'})
export class AlertService {
  private readonly http=inject(HttpClient);
  private readonly endpoint='/api/alerts';
  private readonly options={withCredentials:true} as const;

  getAlerts(filters:AlertFilters,page=1,pageSize=20):Observable<AlertPage>{let params=new HttpParams().set('page',page).set('pageSize',pageSize);Object.entries(filters).forEach(([key,value])=>{if(value)params=params.set(key,value)});return this.http.get<AlertPage>(this.endpoint,{params,...this.options});}
  getStats():Observable<AlertStats>{return this.http.get<AlertStats>(`${this.endpoint}/stats`,this.options);}
  getEligibleMaintenance(id:number):Observable<MaintenanceStaffOption[]>{return this.http.get<MaintenanceStaffOption[]>(`${this.endpoint}/${id}/eligible-maintenance`,this.options);}
  acknowledge(id:number):Observable<AlertRecord>{return this.http.patch<AlertRecord>(`${this.endpoint}/${id}/acknowledge`,{},this.options);}
  acceptAssignment(id:number):Observable<AlertRecord>{return this.http.patch<AlertRecord>(`${this.endpoint}/${id}/maintenance-assignment/accept`,{},this.options);}
  declineAssignment(id:number,request:DeclineAssignmentRequest):Observable<AlertRecord>{return this.http.patch<AlertRecord>(`${this.endpoint}/${id}/maintenance-assignment/decline`,request,this.options);}
  reassignMaintenance(id:number,request:ReassignAlertRequest):Observable<AlertRecord>{return this.http.post<AlertRecord>(`${this.endpoint}/${id}/maintenance-assignments`,request,this.options);}
  escalateAssignment(id:number):Observable<AlertRecord>{return this.http.post<AlertRecord>(`${this.endpoint}/${id}/maintenance-assignment/escalate`,{},this.options);}
  startWork(id:number):Observable<AlertRecord>{return this.http.patch<AlertRecord>(`${this.endpoint}/${id}/work/start`,{},this.options);}
  completeWork(id:number,request:CompleteWorkRequest):Observable<AlertRecord>{return this.http.patch<AlertRecord>(`${this.endpoint}/${id}/work/complete`,request,this.options);}
  resolveManually(id:number,reason:string):Observable<AlertRecord>{return this.http.patch<AlertRecord>(`${this.endpoint}/${id}/resolve`,{reason},this.options);}
  addComment(id:number,comment:string):Observable<AlertRecord>{return this.http.post<AlertRecord>(`${this.endpoint}/${id}/comments`,{comment},this.options);}
  getAlert(key:string|number){return this.http.get<AlertRecord>(`${this.endpoint}/${encodeURIComponent(key)}`,this.options);}
  getOptions(){return this.http.get<AlertOptions>(`${this.endpoint}/options`,this.options);}
  create(request:CreateAlertRequest){return this.http.post<AlertRecord>(this.endpoint,request,this.options);}
  private readonly live=inject(LiveUpdatesService);
  connectLive():Observable<void>{return this.live.connect<void>('alerts');}
}


