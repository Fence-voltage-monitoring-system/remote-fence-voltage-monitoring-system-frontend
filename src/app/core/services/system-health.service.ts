import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { SystemHealthSnapshot } from '../models/system-health.models';

@Injectable({ providedIn: 'root' })
export class SystemHealthService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/system-health';

  getSnapshot(): Observable<SystemHealthSnapshot> {
    return this.http.get<SystemHealthSnapshot>(this.endpoint, { withCredentials: true });
  }

  retryJob(jobId: string, reason: string): Observable<{ message: string; executionId: string }> {
    return this.http.post<{ message: string; executionId: string }>(
      `${this.endpoint}/jobs/${encodeURIComponent(jobId)}/retry`,
      { reason },
      { withCredentials: true }
    );
  }
}
