import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MapSettingsService, DEFAULT_MAP_SETTINGS } from './map-settings.service';
import { MapSettings } from '../../pages/configuration/configuration.models';

describe('MapSettingsService', () => {
  let service: MapSettingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MapSettingsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });

    service = TestBed.inject(MapSettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('initializes with DEFAULT_MAP_SETTINGS', () => {
    expect(service.getSettings()).toEqual(DEFAULT_MAP_SETTINGS);
    expect(service.settings().healthyColor).toBe('#4ADE80');
    expect(service.settings().warningColor).toBe('#FBBF24');
    expect(service.settings().criticalColor).toBe('#F87171');
    expect(service.settings().offlineColor).toBe('#9CA3AF');
    expect(service.settings().unassignedColor).toBe('#4B5563');
  });

  it('loads configuration from backend API', () => {
    const customSettings: Partial<MapSettings> = {
      defaultLatitude: 8.5,
      defaultLongitude: 80.5,
      defaultZoom: 9,
      healthyColor: '#22c55e',
    };

    let result: MapSettings | undefined;
    service.load().subscribe(settings => {
      result = settings;
    });

    const req = http.expectOne('/api/configuration/map');
    expect(req.request.method).toBe('GET');
    req.flush({
      section: 'map',
      value: customSettings,
      version: 1,
      updatedAt: '2026-10-16T10:00:00Z',
      updatedBy: 'admin@nerdc.lk'
    });

    expect(result).toBeDefined();
    expect(result?.defaultLatitude).toBe(8.5);
    expect(result?.defaultLongitude).toBe(80.5);
    expect(result?.defaultZoom).toBe(9);
    expect(result?.healthyColor).toBe('#22c55e');
    expect(result?.warningColor).toBe('#FBBF24'); // preserved default
    expect(service.loaded()).toBe(true);
  });

  it('falls back to default settings gracefully when loading fails', () => {
    let result: MapSettings | undefined;
    service.load().subscribe(settings => {
      result = settings;
    });

    const req = http.expectOne('/api/configuration/map');
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(result).toEqual(DEFAULT_MAP_SETTINGS);
    expect(service.getSettings()).toEqual(DEFAULT_MAP_SETTINGS);
  });

  it('applies custom settings and clears them back to default', () => {
    service.apply({ defaultZoom: 12, healthyColor: '#00FF00' });
    expect(service.getSettings().defaultZoom).toBe(12);
    expect(service.getSettings().healthyColor).toBe('#00FF00');
    expect(service.loaded()).toBe(true);

    service.clear();
    expect(service.getSettings()).toEqual(DEFAULT_MAP_SETTINGS);
    expect(service.loaded()).toBe(false);
  });
});
