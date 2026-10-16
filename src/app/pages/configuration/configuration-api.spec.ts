import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { Configuration } from './configuration';

describe('Configuration API integration',()=>{
  let page:Configuration;
  let http:HttpTestingController;
  beforeEach(async()=>{
    await TestBed.configureTestingModule({imports:[Configuration],providers:[provideHttpClient(),provideHttpClientTesting()]}).compileComponents();
    page=TestBed.createComponent(Configuration).componentInstance;
    http=TestBed.inject(HttpTestingController);
    page.ngOnInit();
  });
  afterEach(()=>http.verify());
  const reply=(section:string,value:object)=>({section,value,updatedAt:'2026-09-09T10:00:00Z',updatedBy:'admin@example.com',version:2});
  it('loads real settings and editor metadata',()=>{
    http.expectOne('/api/configuration/general').flush(reply('general',{...page.generalDefaults,systemName:'Saved system'}));
    expect(page.generalValue.systemName).toBe('Saved system');
    expect(page.lastModifiedBy).toBe('admin@example.com');
    expect(page.dirty).toBe(false);expect(page.ready).toBe(true);
  });
  it('retries a failed load and blocks saving defaults',()=>{
    http.expectOne('/api/configuration/general').flush({}, {status:503,statusText:'Unavailable'});
    expect(page.ready).toBe(false);
    page.generalValue.systemName='Changed';page.confirmSave('Test');
    http.expectNone(req=>req.method==='PUT');
    page.retryLoad();
    http.expectOne('/api/configuration/general').flush(reply('general',page.generalDefaults));
    expect(page.ready).toBe(true);expect(page.loadError).toBe('');
  });
  it('cancels a late response when switching sections',()=>{
    const old=http.expectOne('/api/configuration/general');
    page.selectSection('voltage');expect(old.cancelled).toBe(true);
    http.expectOne('/api/configuration/voltage').flush(reply('voltage',{...page.voltageDefaults,healthyKv:6}));
    expect(page.savedVoltage.healthyKv).toBe(6);expect(page.dirty).toBe(false);
    page.selectSection('general');
    http.expectOne('/api/configuration/general').flush(reply('general',page.generalDefaults));
  });
  it('sends values and audit reason then uses the saved response',()=>{
    http.expectOne('/api/configuration/general').flush(reply('general',page.generalDefaults));
    page.generalValue={...page.generalValue,systemName:'New name'};page.showSave=true;
    page.confirmSave(' Update name ');
    const save=http.expectOne('/api/configuration/general');
    expect(save.request.method).toBe('PUT');
    expect(save.request.body.reason).toBe('Update name');
    expect(save.request.body.value.systemName).toBe('New name');
    save.flush(reply('general',page.generalValue));
    expect(page.dirty).toBe(false);expect(page.showSave).toBe(false);
  });
  it('preserves the draft and dialog after a save error',()=>{
    http.expectOne('/api/configuration/general').flush(reply('general',page.generalDefaults));
    page.generalValue={...page.generalValue,systemName:'Unsaved'};page.showSave=true;
    page.confirmSave('Test save');
    http.expectOne('/api/configuration/general').flush({message:'Invalid configuration'},{status:400,statusText:'Bad Request'});
    expect(page.showSave).toBe(true);expect(page.generalValue.systemName).toBe('Unsaved');
    expect(page.dirty).toBe(true);expect(page.saveError).toBe('Invalid configuration');
  });
  it('explains disabled saving and clears validation after correction',()=>{
    expect(page.saveDisabledReason).toContain('loading');
    http.expectOne('/api/configuration/general').flush(reply('general',page.generalDefaults));
    expect(page.saveDisabledReason).toContain('Change a setting');
    page.generalValue={...page.generalValue,offlineTimeoutMinutes:1,lateArrivalGraceMinutes:5};
    expect(page.valid).toBe(false);
    expect(page.validationMessages).toContain('Offline timeout must be greater than late-arrival grace.');
    page.generalValue={...page.generalValue,offlineTimeoutMinutes:10};
    expect(page.valid).toBe(true);
    expect(page.saveDisabledReason).toBe('');
    page.confirmSave('Correct timeout');
    http.expectOne('/api/configuration/general').flush(reply('general',page.generalValue));
    expect(page.dirty).toBe(false);
  });
  it('explains voltage ordering and allows corrected thresholds',()=>{
    http.expectOne('/api/configuration/general').flush(reply('general',page.generalDefaults));
    page.selectSection('voltage');
    http.expectOne('/api/configuration/voltage').flush(reply('voltage',page.voltageDefaults));
    page.voltageValue={...page.voltageValue,warningKv:8};
    expect(page.validationMessages[0]).toContain('Healthy > Warning > Critical');
    page.voltageValue={...page.voltageValue,healthyKv:9};
    expect(page.valid).toBe(true);
    expect(page.saveDisabledReason).toBe('');
  });
  it('validates alert delivery channels and recipients', () => {
    http.expectOne('/api/configuration/general').flush(reply('general', page.generalDefaults));
    page.selectSection('alerts');
    http.expectOne('/api/configuration/alerts').flush(reply('alerts', page.alertDefaults));
    page.alertValue = { ...page.alertValue, inAppEnabled: false, websocketEnabled: false, smsEnabled: false };
    expect(page.valid).toBe(false);
    expect(page.validationMessages).toContain('Select at least one delivery channel (In-app, WebSocket, or SMS).');
    page.alertValue = { ...page.alertValue, inAppEnabled: true };
    expect(page.valid).toBe(true);
    page.confirmSave('Save alerts');
    const saveReq = http.expectOne('/api/configuration/alerts');
    expect(saveReq.request.method).toBe('PUT');
    saveReq.flush(reply('alerts', page.alertValue));
    expect(page.dirty).toBe(false);
  });

  it('loads retention status when switching to retention section', () => {
    http.expectOne('/api/configuration/general').flush(reply('general', page.generalDefaults));
    page.selectSection('retention');
    http.expectOne('/api/configuration/retention').flush(reply('retention', page.retentionDefaults));
    const statusReq = http.expectOne('/api/configuration/retention/status');
    statusReq.flush({
      databaseSizeFormatted: '45.2 GB',
      databaseAllocatedFormatted: '100 GB',
      databaseUsagePercentage: 45,
      archiveSizeFormatted: '120 GB',
      archiveAllocatedFormatted: '300 GB',
      archiveUsagePercentage: 40,
      lastCleanupFormatted: 'Today · 02:00',
      lastCleanupSummary: 'Completed · 1.5 GB removed',
      nextCleanupFormatted: 'Tomorrow · 02:00',
      nextCleanupStatus: 'Scheduled',
      automaticCleanupEnabled: true
    });
    expect(page.retentionStatus?.databaseSizeFormatted).toBe('45.2 GB');
  });

  it('triggers manual retention cleanup and updates notice and status', () => {
    http.expectOne('/api/configuration/general').flush(reply('general', page.generalDefaults));
    page.selectSection('retention');
    http.expectOne('/api/configuration/retention').flush(reply('retention', page.retentionDefaults));
    http.expectOne('/api/configuration/retention/status').flush({
      databaseSizeFormatted: '50 GB',
      databaseAllocatedFormatted: '100 GB',
      databaseUsagePercentage: 50,
      archiveSizeFormatted: '100 GB',
      archiveAllocatedFormatted: '300 GB',
      archiveUsagePercentage: 33,
      lastCleanupFormatted: 'Yesterday',
      lastCleanupSummary: 'Completed',
      nextCleanupFormatted: 'Tomorrow',
      nextCleanupStatus: 'Scheduled',
      automaticCleanupEnabled: true
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    page.requestManualCleanup();
    expect(page.isCleaningUpRetention).toBe(true);

    const cleanupReq = http.expectOne('/api/configuration/retention/cleanup');
    expect(cleanupReq.request.method).toBe('POST');
    cleanupReq.flush({
      success: true,
      manual: true,
      totalRecordsDeleted: 42,
      deletedTelemetry: 30,
      deletedNotifications: 5,
      deletedReports: 2,
      deletedAlerts: 5,
      deletedAuditLogs: 0,
      reclaimedMb: 12.5,
      durationMs: 85,
      executedAt: '2026-10-16T09:00:00Z',
      message: 'Purged 42 records'
    });

    expect(page.isCleaningUpRetention).toBe(false);
    expect(page.notice).toContain('Purged 42 records in 85ms');

    const refreshReq = http.expectOne('/api/configuration/retention/status');
    refreshReq.flush({
      databaseSizeFormatted: '49.9 GB',
      databaseAllocatedFormatted: '100 GB',
      databaseUsagePercentage: 50,
      archiveSizeFormatted: '100 GB',
      archiveAllocatedFormatted: '300 GB',
      archiveUsagePercentage: 33,
      lastCleanupFormatted: 'Just now',
      lastCleanupSummary: 'Completed · 12.5 MB removed',
      nextCleanupFormatted: 'Tomorrow',
      nextCleanupStatus: 'Scheduled',
      automaticCleanupEnabled: true
    });
    expect(page.retentionStatus?.databaseSizeFormatted).toBe('49.9 GB');
    confirmSpy.mockRestore();
  });
});
