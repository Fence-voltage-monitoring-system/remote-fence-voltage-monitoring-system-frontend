import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MapSettings } from '../../configuration.models';

@Component({
  selector: 'app-map-settings-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './map-settings-editor.html',
  styleUrl: './map-settings-editor.css'
})
export class MapSettingsEditor {
  @Input({ required: true }) value!: MapSettings;
  @Output() valueChange = new EventEmitter<MapSettings>();

  update<K extends keyof MapSettings>(field: K, value: MapSettings[K]): void {
    const next = { ...this.value, [field]: value };
    if (field === 'liveUpdatesEnabled' && value === false) {
      next.highlightRecentChanges = false;
      next.focusCriticalAlerts = false;
    }
    if ((field === 'showActiveAlerts' || field === 'showAlertOverlay') && value === false) {
      next.focusCriticalAlerts = false;
    }
    this.valueChange.emit(next);
  }

  updateColor(field: 'healthyColor' | 'warningColor' | 'criticalColor' | 'offlineColor' | 'unassignedColor', value: string): void {
    this.update(field, value.toLowerCase());
  }
}
