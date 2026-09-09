import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
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
  private readonly cdr=inject(ChangeDetectorRef);
  private readonly service = inject(SystemHealthService);
  private readonly destroyRef = inject(DestroyRef);

  hasSnapshot=false;
  snapshot: SystemHealthSnapshot={overallState:'OFFLINE',uptimeSeconds:0,activeIssues:0,checkedAt:'',services:[],gatewaySummary:{total:0,online:0,offline:0,lateReporting:0,communicationSuccessPercent:0,latestTelemetryAt:null},unhealthyGateways:[],jobs:[],events:[]};
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
    this.service.getSnapshot().pipe(finalize(() => {this.isLoading = false;this.cdr.markForCheck();})).subscribe({
      next: snapshot => {this.snapshot = snapshot;this.hasSnapshot=true;},
      error: (error: HttpErrorResponse) => this.notice = error.status === 0
        ? 'System Health API unavailable. No live health data could be loaded.'
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
    this.service.retryJob(job.id, this.retryReason.trim()).pipe(finalize(() => {this.retryingJobId = '';this.cdr.markForCheck();})).subscribe({
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

}
