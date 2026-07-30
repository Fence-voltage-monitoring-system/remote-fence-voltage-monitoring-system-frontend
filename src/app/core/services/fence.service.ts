import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FenceEditValue } from '../../pages/fence-management/components/fence-edit-drawer/fence-edit-drawer';
import { FenceRegistrationValue } from '../../pages/fence-management/components/fence-registration-drawer/fence-registration-drawer';
import { FenceRecord, MaintenanceUserOption } from '../../pages/fence-management/fence-management.models';

@Injectable({providedIn:'root'})
export class FenceService {
  private readonly http=inject(HttpClient); private readonly endpoint='/api/fences'; private readonly options={withCredentials:true} as const;
  getEligibleMaintenance(province:string,district:string):Observable<MaintenanceUserOption[]>{return this.http.get<MaintenanceUserOption[]>(`${this.endpoint}/maintenance-candidates`,{params:{province,district},...this.options});}
  register(value:FenceRegistrationValue):Observable<FenceRecord>{return this.http.post<FenceRecord>(this.endpoint,value,this.options);}
  saveDraft(value:FenceRegistrationValue):Observable<{draftId:number}>{return this.http.post<{draftId:number}>(`${this.endpoint}/drafts`,value,this.options);}
  update(value:FenceEditValue):Observable<FenceRecord>{return this.http.put<FenceRecord>(`${this.endpoint}/${value.id}`,value,this.options);}
  updateMaintenanceTeam(id:number,primaryMaintenanceUserId:number,backupMaintenanceUserIds:number[]):Observable<FenceRecord>{return this.http.put<FenceRecord>(`${this.endpoint}/${id}/maintenance-team`,{primaryMaintenanceUserId,backupMaintenanceUserIds},this.options);}
  delete(id:number):Observable<void>{return this.http.delete<void>(`${this.endpoint}/${id}`,this.options);}
}
