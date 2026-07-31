import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { GeneratedReport, ReportFilterOptions, ReportGenerationRequest, ReportHistoryPage, ReportPreview } from '../../pages/reports/reports.models';

@Injectable({providedIn:'root'})
export class ReportsService {
  private readonly http=inject(HttpClient);
  private readonly endpoint='/api/reports';

  getFilterOptions(scope:{province:string;district:string;fence:string}):Observable<ReportFilterOptions>{
    let params=new HttpParams();
    if(scope.province)params=params.set('province',scope.province);
    if(scope.district)params=params.set('district',scope.district);
    if(scope.fence)params=params.set('fence',scope.fence);
    return this.http.get<ReportFilterOptions>(`${this.endpoint}/filter-options`,{params,withCredentials:true});
  }
  getHistory(page=1,pageSize=20):Observable<ReportHistoryPage>{return this.http.get<ReportHistoryPage>(this.endpoint,{params:new HttpParams().set('page',page).set('pageSize',pageSize),withCredentials:true});}
  generate(request:ReportGenerationRequest):Observable<GeneratedReport>{return this.http.post<GeneratedReport>(this.endpoint,request,{withCredentials:true});}
  preview(request:ReportGenerationRequest):Observable<ReportPreview>{return this.http.post<ReportPreview>(`${this.endpoint}/preview`,request,{withCredentials:true});}
  download(reportId:number):Observable<Blob>{return this.http.get(`${this.endpoint}/${reportId}/download`,{responseType:'blob',withCredentials:true});}
}
