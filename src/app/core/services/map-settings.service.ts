import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { MapSettings } from '../../pages/configuration/configuration.models';
import { ConfigurationService } from './configuration.service';

/** Shared map configuration state for map-view components. */
@Injectable({ providedIn: 'root' })
export class MapSettingsService {
  private readonly configuration = inject(ConfigurationService);
  private readonly state = signal<MapSettings | null>(null);

  readonly settings = this.state.asReadonly();
  readonly loaded = computed(() => this.state() !== null);

  load(): Observable<MapSettings> {
    return this.configuration.getSection<MapSettings>('map').pipe(
      map(response => response.value),
      tap(settings => this.apply(settings))
    );
  }

  apply(settings: MapSettings): void {
    this.state.set({ ...settings });
  }

  clear(): void {
    this.state.set(null);
  }
}
