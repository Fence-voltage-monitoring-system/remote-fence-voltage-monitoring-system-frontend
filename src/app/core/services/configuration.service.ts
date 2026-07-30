import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AlertRuleSettings, ConfigurationSection, DataRetentionSettings, GeneralConfiguration, NotificationSettings, SecurityPolicySettings, SessionManagementSettings, SessionOverview, VoltageThresholds } from '../../pages/configuration/configuration.models';

export type ConfigurationValue=GeneralConfiguration|VoltageThresholds|AlertRuleSettings|NotificationSettings|DataRetentionSettings|SecurityPolicySettings|SessionManagementSettings;
export interface ConfigurationSaveRequest<T extends ConfigurationValue>{value:T;reason:string;}
export interface ConfigurationSaveResponse<T extends ConfigurationValue>{section:ConfigurationSection;value:T;updatedBy:string;updatedAt:string;version:number;}

@Injectable({providedIn:'root'})
export class ConfigurationService {
  private readonly http=inject(HttpClient); private readonly endpoint='/api/configuration';
  getSection<T extends ConfigurationValue>(section:ConfigurationSection):Observable<ConfigurationSaveResponse<T>>{return this.http.get<ConfigurationSaveResponse<T>>(`${this.endpoint}/${section}`,{withCredentials:true});}
  saveSection<T extends ConfigurationValue>(section:ConfigurationSection,value:T,reason:string):Observable<ConfigurationSaveResponse<T>>{return this.http.put<ConfigurationSaveResponse<T>>(`${this.endpoint}/${section}`,{value,reason},{withCredentials:true});}
  getSessionOverview():Observable<SessionOverview>{return this.http.get<SessionOverview>(`${this.endpoint}/sessions/active`,{withCredentials:true});}
  revokeSession(sessionId:string,reason:string):Observable<{message:string}>{return this.http.post<{message:string}>(`${this.endpoint}/sessions/active/${sessionId}/revoke`,{reason},{withCredentials:true});}
  revokeUserSessions(userId:number,reason:string):Observable<{message:string;revokedSessions:number}>{return this.http.post<{message:string;revokedSessions:number}>(`${this.endpoint}/sessions/users/${userId}/revoke`,{reason},{withCredentials:true});}
}
