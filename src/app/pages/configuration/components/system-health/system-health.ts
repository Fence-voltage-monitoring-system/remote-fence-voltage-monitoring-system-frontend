import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { timer, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BackgroundJobHealth, HealthState, SystemHealthEvent, SystemHealthSnapshot } from '../../../../core/models/system-health.models';
import { SystemHealthService } from '../../../../core/services/system-health.service';

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './system-health.html',
  styleUrl: './system-health.css'
})
export class SystemHealth implements OnInit {
  private readonly service = inject(SystemHealthService);
  private readonly destroyRef = inject(DestroyRef);

  snapshot = this.previewSnapshot();
  isLoading = false;
  retryingJobId = '';
  pendingJob: BackgroundJobHealth | null = null;
  retryReason = '';
  notice = '';
  autoRefreshEnabled = true;
  readonly refreshIntervalSeconds = 30;
  selectedEvent: SystemHealthEvent | null = null;

  ngOnInit(): void {
    this.refresh();
    timer(this.refreshIntervalSeconds * 1000, this.refreshIntervalSeconds * 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.autoRefreshEnabled && document.visibilityState === 'visible') this.refresh(false);
      });
  }

  refresh(showLoading = true): void {
    if (this.isLoading) return;
    this.isLoading = true;
    if (showLoading) this.notice = '';
    this.service.getSnapshot().pipe(finalize(() => this.isLoading = false)).subscribe({
      next: snapshot => this.snapshot = snapshot,
      error: (error: HttpErrorResponse) => this.notice = error.status === 0
        ? 'System Health API unavailable. Displaying preview data.'
        : 'Unable to refresh system health.'
    });
  }

  requestRetry(job: BackgroundJobHealth): void {
    if (!job.retryAllowed || job.result !== 'FAILED') return;
    this.pendingJob = job;
    this.retryReason = '';
  }

  cancelRetry(): void { this.pendingJob = null; this.retryReason = ''; }

  confirmRetry(): void {
    if (!this.pendingJob || !this.retryReason.trim() || this.retryingJobId) return;
    const job = this.pendingJob;
    this.retryingJobId = job.id;
    this.service.retryJob(job.id, this.retryReason.trim()).pipe(finalize(() => this.retryingJobId = '')).subscribe({
      next: response => {
        this.snapshot = { ...this.snapshot, jobs: this.snapshot.jobs.map(item => item.id === job.id ? { ...item, result: 'RUNNING' } : item) };
        this.notice = response.message || `${job.name} retry queued.`;
        this.cancelRetry();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 403) this.notice = 'You do not have permission to retry this job.';
        else if (error.status === 409) this.notice = 'This job is already running.';
        else this.notice = error.error?.message ?? 'Unable to retry the job.';
      }
    });
  }

  stateLabel(state: HealthState): string {
    return state.charAt(0) + state.slice(1).toLowerCase();
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }

  get snapshotIsStale(): boolean {
    const checkedAt = new Date(this.snapshot.checkedAt).getTime();
    return !Number.isFinite(checkedAt) || Date.now() - checkedAt > this.refreshIntervalSeconds * 3000;
  }

  openEvent(event: SystemHealthEvent): void { this.selectedEvent = event; }
  closeEvent(): void { this.selectedEvent = null; }

  private previewSnapshot(): SystemHealthSnapshot {
    return {
      overallState:'DEGRADED',uptimeSeconds:2386800,activeIssues:2,checkedAt:'2026-07-31T09:35:00+05:30',
      services:[
        {id:'api',name:'Backend API',state:'HEALTHY',responseTimeMs:42,lastSuccessfulCheck:'2026-07-31T09:35:00+05:30',message:null},
        {id:'database',name:'Database',state:'HEALTHY',responseTimeMs:18,lastSuccessfulCheck:'2026-07-31T09:35:00+05:30',message:null},
        {id:'websocket',name:'WebSocket service',state:'HEALTHY',responseTimeMs:31,lastSuccessfulCheck:'2026-07-31T09:34:58+05:30',message:null},
        {id:'alerts',name:'Alert processing',state:'DEGRADED',responseTimeMs:286,lastSuccessfulCheck:'2026-07-31T09:34:50+05:30',message:'Processing delay above target.'},
        {id:'notifications',name:'Notification service',state:'HEALTHY',responseTimeMs:64,lastSuccessfulCheck:'2026-07-31T09:34:57+05:30',message:null}
      ],
      gatewaySummary:{total:18,online:15,offline:1,lateReporting:2,communicationSuccessPercent:94.6,latestTelemetryAt:'2026-07-31T09:31:42+05:30'},
      unhealthyGateways:[
        {id:1,code:'GTW-AMP-04',fenceCode:'EPF-AMP-D',state:'OFFLINE',lastCommunicationAt:'2026-07-31T08:01:00+05:30',nextExpectedAt:'2026-07-31T08:31:00+05:30',delayMinutes:64},
        {id:2,code:'GTW-MNR-03',fenceCode:'EPF-MNR-A',state:'LATE',lastCommunicationAt:'2026-07-31T08:52:00+05:30',nextExpectedAt:'2026-07-31T09:22:00+05:30',delayMinutes:13}
      ],
      jobs:[
        {id:'telemetry-processing',name:'Telemetry processing',result:'SUCCESS',lastRunAt:'2026-07-31T09:31:43+05:30',nextRunAt:null,durationMs:1240,retryAllowed:false},
        {id:'alert-evaluation',name:'Alert evaluation',result:'SUCCESS',lastRunAt:'2026-07-31T09:31:45+05:30',nextRunAt:null,durationMs:680,retryAllowed:false},
        {id:'notification-delivery',name:'Notification delivery',result:'FAILED',lastRunAt:'2026-07-31T09:30:12+05:30',nextRunAt:'2026-07-31T09:40:00+05:30',durationMs:3200,retryAllowed:true},
        {id:'data-aggregation',name:'Data aggregation',result:'SUCCESS',lastRunAt:'2026-07-31T09:00:00+05:30',nextRunAt:'2026-07-31T10:00:00+05:30',durationMs:8420,retryAllowed:false},
        {id:'retention-cleanup',name:'Retention cleanup',result:'SCHEDULED',lastRunAt:'2026-07-30T02:00:00+05:30',nextRunAt:'2026-08-01T02:00:00+05:30',durationMs:18600,retryAllowed:false}
      ],
      events:[
        {id:'EVT-901',occurredAt:'2026-07-31T09:30:12+05:30',component:'Notification service',severity:'CRITICAL',message:'SMS delivery worker failed after provider timeout.',status:'OPEN'},
        {id:'EVT-900',occurredAt:'2026-07-31T09:22:01+05:30',component:'Gateway communication',severity:'WARNING',message:'GTW-MNR-03 missed its expected telemetry window.',status:'OPEN'},
        {id:'EVT-899',occurredAt:'2026-07-31T08:45:18+05:30',component:'WebSocket service',severity:'INFO',message:'Connection pool recovered after a brief interruption.',status:'RESOLVED'}
      ]
    };
  }
}
