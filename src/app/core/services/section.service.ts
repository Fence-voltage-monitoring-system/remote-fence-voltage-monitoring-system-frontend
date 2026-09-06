import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FenceSection } from '../../pages/section-management/section-management.models';

@Injectable({ providedIn: 'root' })
export class SectionService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/sections';
  private readonly options = { withCredentials: true } as const;

  getSectionsByFence(fenceId: number): Observable<any[]> {
    return this.http.get<any[]>(this.endpoint, { params: { fenceId }, ...this.options });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/${id}`, this.options);
  }

  create(section: any): Observable<any> {
    return this.http.post<any>(this.endpoint, section, this.options);
  }

  update(id: number, section: any): Observable<any> {
    return this.http.put<any>(`${this.endpoint}/${id}`, section, this.options);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`, this.options);
  }

  bulkCreate(payload: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.endpoint}/bulk`, payload, this.options);
  }
}
