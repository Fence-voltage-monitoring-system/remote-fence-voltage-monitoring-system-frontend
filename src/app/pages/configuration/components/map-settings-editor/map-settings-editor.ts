import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

import { MapSettings } from '../../configuration.models';

@Component({
  selector: 'app-map-settings-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './map-settings-editor.html',
  styleUrl: './map-settings-editor.css'
})
export class MapSettingsEditor implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('previewMap') private previewMapElement?: ElementRef<HTMLDivElement>;
  @Input({ required: true }) value!: MapSettings;
  @Output() valueChange = new EventEmitter<MapSettings>();

  private map?: L.Map;
  private readonly previewLayers = L.layerGroup();

  ngAfterViewInit(): void {
    if (!this.previewMapElement) return;
    this.map = L.map(this.previewMapElement.nativeElement, {
      attributionControl: true,
      zoomControl: true,
      minZoom: 6,
      maxZoom: 18,
      maxBounds: [[5.65, 79.35], [10.15, 82.25]],
      maxBoundsViscosity: 0.8
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);
    this.previewLayers.addTo(this.map);
    this.renderMapPreview();
    queueMicrotask(() => this.map?.invalidateSize());
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.map) queueMicrotask(() => this.renderMapPreview());
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

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

  private renderMapPreview(): void {
    if (!this.map || !this.value) return;
    const latitude = Math.min(10, Math.max(5.8, Number(this.value.defaultLatitude) || 7.8731));
    const longitude = Math.min(82.2, Math.max(79.5, Number(this.value.defaultLongitude) || 80.7718));
    const zoom = Math.min(18, Math.max(6, Number(this.value.defaultZoom) || 7));
    this.map.setView([latitude, longitude], zoom, { animate: false });
    this.previewLayers.clearLayers();

    if (this.value.showFenceCoverage) {
      L.polyline([
        [6.8721, 81.3382], [6.8845, 81.3420], [6.8960, 81.3460],
        [6.9080, 81.3498], [6.9195, 81.3536], [6.9310, 81.3574]
      ], { color: this.value.healthyColor, weight: 4, opacity: 0.9 })
        .bindTooltip('Monaragala fence coverage')
        .addTo(this.previewLayers);
    }
    if (this.value.showGateways) this.addMarker([6.9271, 79.8612], 'G', '#55c9ff', 'Gateway · Colombo');
    if (this.value.showMonitoringDevices) this.addMarker([6.8728, 81.3507], 'D', this.value.healthyColor, 'Monitoring device · Monaragala');
    if (this.value.showActiveAlerts && this.value.showAlertOverlay) this.addMarker([8.3114, 80.4037], '!', this.value.criticalColor, 'Critical alert · Anuradhapura');
    if (this.value.showMaintenanceWork) this.addMarker([6.1241, 81.1185], 'M', this.value.warningColor, 'Maintenance work · Hambantota');
  }

  private addMarker(position: L.LatLngExpression, label: string, colour: string, title: string): void {
    const icon = L.divIcon({
      className: 'map-preview-icon',
      html: `<span title="${title}" style="display:grid;width:26px;height:26px;place-items:center;border:3px solid #eef5ec;border-radius:50%;background:${colour};box-shadow:0 3px 10px rgba(0,0,0,.55);color:#07160b;font:700 11px Inter,sans-serif">${label}</span>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    L.marker(position, { icon }).bindTooltip(title, { direction: 'top', offset: [0, -12] }).addTo(this.previewLayers);
  }
}
