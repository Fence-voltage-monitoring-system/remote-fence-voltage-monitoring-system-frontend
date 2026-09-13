import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Reports } from './reports';
import { ReportsService } from '../../core/services/reports.service';

describe('Reports API integration', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [Reports], providers: [provideHttpClient(), provideHttpClientTesting()]}).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  const options = {provinces: [], districts: [], fences: [], sections: []};
  it('shows empty history rather than sample reports on failure', () => {
    const fixture = TestBed.createComponent(Reports);
    fixture.detectChanges();
    http.expectOne('/api/reports/filters').flush(options);
    http.expectOne('/api/reports?page=0').flush({}, {status: 500, statusText: 'Error'});
    expect(fixture.componentInstance.reports).toEqual([]);
    expect(fixture.componentInstance.notice).toContain('Unable');
  });
  it('cancels outdated filter responses', () => {
    const fixture = TestBed.createComponent(Reports);
    fixture.detectChanges();
    const old = http.expectOne('/api/reports/filters');
    http.expectOne('/api/reports?page=0').flush({items: [], total: 0});
    const c = fixture.componentInstance;
    c.configurationChanged({...c.configuration, province: 'Uva'});
    expect(old.cancelled).toBe(true);
    http.expectOne('/api/reports/filters?province=Uva').flush(options);
    expect(c.optionsLoading).toBe(false);
  });
  it('generates through the backend and reloads persisted history', () => {
    const c = TestBed.createComponent(Reports).componentInstance;
    c.configuration = {...c.configuration, format: 'CSV'};
    c.reloadFilters();
    http.expectOne('/api/reports/filters').flush(options);
    c.generate();
    const req = http.expectOne('/api/reports');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.options.includeCharts).toBe(false);
    expect(req.request.body.scope.fence).toBeNull();
    const report = {id: 4, name: 'Real report', status: 'READY', format: 'CSV'};
    req.flush(report);
    http.expectOne('/api/reports?page=0').flush({items: [report], total: 1});
    expect(c.reports[0].id).toBe(4);
    expect(c.notice).toContain('ready');
    expect(c.generating).toBe(false);
  });
  it('downloads actual binary response', () => {
    const service = TestBed.inject(ReportsService);
    const blob = new Blob(['code,health\nF1,HEALTHY'], {type: 'text/csv'});
    let received: Blob | undefined;
    service.download(9).subscribe(file => received = file);
    const req = http.expectOne('/api/reports/9/download');
    expect(req.request.responseType).toBe('blob');
    req.flush(blob);
    expect(received).toBe(blob);
  });
  it('shows a filter failure separately and displays registered fences after retry', () => {
    const fixture = TestBed.createComponent(Reports);
    fixture.detectChanges();
    http.expectOne('/api/reports/filters').flush({}, {status: 404, statusText: 'Not Found'});
    http.expectOne('/api/reports?page=0').flush({items: [], total: 0});
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Restart the backend');
    fixture.componentInstance.generate();
    http.expectNone('/api/reports');
    fixture.componentInstance.reloadFilters();
    http.expectOne('/api/reports/filters').flush({...options, fences: [{value: 'F1', label: 'F1 · Registered Fence'}]});
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Registered Fence');
    expect(fixture.componentInstance.filterError).toBe('');
    expect(fixture.componentInstance.filtersReady).toBe(true);
  });
  it('clears all location restrictions before reloading fences', () => {
    const c = TestBed.createComponent(Reports).componentInstance;
    c.configuration = {...c.configuration, province: 'Uva', district: 'Monaragala', fence: 'F1', section: 'S1'};
    c.clearFilters();
    http.expectOne('/api/reports/filters').flush(options);
    expect(c.configuration.province).toBe('');
    expect(c.configuration.district).toBe('');
    expect(c.configuration.fence).toBe('');
    expect(c.configuration.section).toBe('');
  });
});
