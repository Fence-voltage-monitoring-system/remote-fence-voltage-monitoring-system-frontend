import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { MapSettings } from '../../pages/configuration/configuration.models';
import { ConfigurationService } from './configuration.service';

export const DEFAULT_MAP_SETTINGS: MapSettings = {
  defaultLatitude: 7.8731,
  defaultLongitude: 80.7718,
  defaultZoom: 7,
  healthyColor: '#4ADE80',
  warningColor: '#FBBF24',
  criticalColor: '#F87171',
  offlineColor: '#9CA3AF',
  unassignedColor: '#4B5563',
  showGateways: true,
  showMonitoringDevices: true,
  showActiveAlerts: true,
  showMaintenanceWork: true,
  liveUpdatesEnabled: true,
  highlightRecentChanges: true,
  focusCriticalAlerts: true,
  showStaleDataWarning: true,
  showOfflineIndicators: true,
  showProvinceBoundaries: false,
  showDistrictBoundaries: true,
  showFenceCoverage: true,
  showAlertOverlay: true,
};

/** Shared map configuration state for map-view components. */
@Injectable({ providedIn: 'root' })
export class MapSettingsService {
  private readonly configuration = inject(ConfigurationService);
  private readonly state = signal<MapSettings>(DEFAULT_MAP_SETTINGS);
  private readonly isLoaded = signal(false);

  readonly settings = this.state.asReadonly();
  readonly loaded = this.isLoaded.asReadonly();

  load(): Observable<MapSettings> {
    if (this.isLoaded()) {
      return of(this.state());
    }
    return this.configuration.getSection<MapSettings>('map').pipe(
      map(response => response.value),
      tap(settings => this.apply(settings)),
      map(() => this.state()),
      catchError(err => {
        console.warn('Could not load map configuration from backend, using defaults:', err);
        return of(this.state());
      })
    );
  }

  apply(settings: Partial<MapSettings>): void {
    this.state.set({ ...DEFAULT_MAP_SETTINGS, ...settings });
    this.isLoaded.set(true);
  }

  getSettings(): MapSettings {
    return this.state();
  }

  clear(): void {
    this.state.set(DEFAULT_MAP_SETTINGS);
    this.isLoaded.set(false);
  }
}
