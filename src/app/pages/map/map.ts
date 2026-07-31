import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';

type FenceStatus = 'healthy' | 'warning' | 'critical';

interface MapFence {
  id: string;
  monitoringFenceId: string;
  name: string;
  province: string;
  district: string;
  status: FenceStatus;
  voltage: number;
  sections: number;
  activeSections: number;
  coordinates: L.LatLngExpression;
  lastCommunication: string;
}

@Component({
  selector: 'app-fence-map-workspace',
  standalone: true,
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class FenceMapWorkspaceComponent implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  @ViewChild('mapCanvas') mapElement!: ElementRef<HTMLDivElement>;

  readonly fences: MapFence[] = [
    { id: 'MNR-A', monitoringFenceId: 'monaragala', name: 'Monaragala Elephant Protection Fence', province: 'Uva', district: 'Monaragala', status: 'healthy', voltage: 5.9, sections: 24, activeSections: 22, coordinates: [6.872, 81.350], lastCommunication: '8s ago' },
    { id: 'WLP-N', monitoringFenceId: 'wilpattu', name: 'Wilpattu North Buffer Fence', province: 'North Western', district: 'Puttalam', status: 'healthy', voltage: 6.1, sections: 18, activeSections: 18, coordinates: [8.458, 80.028], lastCommunication: '12s ago' },
    { id: 'MHT-B', monitoringFenceId: 'mihintale', name: 'Mihintale Wildlife Buffer Fence', province: 'North Central', district: 'Anuradhapura', status: 'warning', voltage: 4.2, sections: 12, activeSections: 11, coordinates: [8.350, 80.505], lastCommunication: '34s ago' },
    { id: 'GOY-E', monitoringFenceId: 'gal-oya', name: 'Gal Oya East Protection Fence', province: 'Eastern', district: 'Ampara', status: 'critical', voltage: 0.8, sections: 20, activeSections: 16, coordinates: [7.292, 81.625], lastCommunication: '4m ago' },
    { id: 'LNV-P', monitoringFenceId: 'lunugamvehera', name: 'Lunugamvehera Park Fence', province: 'Southern', district: 'Hambantota', status: 'warning', voltage: 4.6, sections: 16, activeSections: 15, coordinates: [6.341, 81.151], lastCommunication: '51s ago' },
  ];

  readonly provinces = [...new Set(this.fences.map((fence) => fence.province))].sort();
  selectedProvince = 'all';
  selectedDistrict = 'all';
  selectedStatus: FenceStatus | 'all' = 'all';
  selectedFence?: MapFence;

  private map?: L.Map;
  private markerLayer?: L.LayerGroup;
  private resizeObserver?: ResizeObserver;
  private readonly markers = new Map<string, L.CircleMarker>();
  private readonly sriLankaBounds = L.latLngBounds([5.72, 79.32], [10.05, 82.05]);

  get districts(): string[] {
    return [...new Set(this.fences
      .filter((fence) => this.selectedProvince === 'all' || fence.province === this.selectedProvince)
      .map((fence) => fence.district))].sort();
  }

  get visibleFences(): MapFence[] {
    return this.fences.filter((fence) =>
      (this.selectedProvince === 'all' || fence.province === this.selectedProvince) &&
      (this.selectedDistrict === 'all' || fence.district === this.selectedDistrict) &&
      (this.selectedStatus === 'all' || fence.status === this.selectedStatus));
  }

  count(status: FenceStatus): number {
    return this.fences.filter((fence) => fence.status === status).length;
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement.nativeElement, {
      center: [7.75, 80.72], zoom: 7, minZoom: 6, maxZoom: 16,
      maxBounds: this.sriLankaBounds.pad(0.35), maxBoundsViscosity: 0.9,
      zoomAnimation: true, fadeAnimation: true, wheelPxPerZoomLevel: 100,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, noWrap: true, attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    this.markerLayer = L.layerGroup().addTo(this.map);
    this.renderMarkers();
    requestAnimationFrame(() => this.fitVisibleFences(false));
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize({ pan: false }));
    this.resizeObserver.observe(this.mapElement.nativeElement);
  }

  selectProvince(province: string): void {
    this.selectedProvince = province;
    this.selectedDistrict = 'all';
    this.applyFilters();
  }

  selectDistrict(district: string): void {
    this.selectedDistrict = district;
    this.applyFilters();
  }

  selectStatus(status: string): void {
    this.selectedStatus = status as FenceStatus | 'all';
    this.applyFilters();
  }

  selectFence(fence: MapFence): void {
    this.selectedFence = fence;
    const marker = this.markers.get(fence.id);
    if (!this.map || !marker) return;
    this.map.flyTo(fence.coordinates, 11, { animate: true, duration: 1.1 });
    marker.openPopup();
  }

  openFenceDetails(fence: MapFence): void {
    void this.router.navigate(['/virtual-fence'], {
      queryParams: { fenceId: fence.monitoringFenceId },
    }).then((navigated) => {
      if (navigated) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }

  resetFilters(): void {
    this.selectedProvince = 'all';
    this.selectedDistrict = 'all';
    this.selectedStatus = 'all';
    this.applyFilters();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  private applyFilters(): void {
    if (this.selectedFence && !this.visibleFences.includes(this.selectedFence)) this.selectedFence = undefined;
    this.renderMarkers();
    this.fitVisibleFences(true);
  }

  private renderMarkers(): void {
    if (!this.markerLayer) return;
    this.markerLayer.clearLayers();
    this.markers.clear();
    for (const fence of this.visibleFences) {
      const marker = L.circleMarker(fence.coordinates, {
        radius: 10, color: '#0c1c10', weight: 3, fillColor: this.statusColor(fence.status),
        fillOpacity: 1, className: `fence-status-marker fence-status-marker--${fence.status}`,
      }).bindTooltip(fence.name, { permanent: true, direction: 'right', offset: [13, 0], className: `fence-location-label fence-location-label--${fence.status}` })
        .bindPopup(this.popup(fence), { offset: [0, -8] })
        .on('click', () => this.openFenceDetails(fence))
        .addTo(this.markerLayer);
      this.markers.set(fence.id, marker);
    }
  }

  private fitVisibleFences(animate: boolean): void {
    if (!this.map) return;
    this.map.invalidateSize({ pan: false });
    const coordinates = this.visibleFences.map((fence) => fence.coordinates);
    if (!coordinates.length) this.map.fitBounds(this.sriLankaBounds, { padding: [35, 35], animate });
    else if (coordinates.length === 1) this.map.setView(coordinates[0], 10, { animate });
    else this.map.fitBounds(L.latLngBounds(coordinates), { padding: [70, 70], maxZoom: 10, animate });
  }

  private statusColor(status: FenceStatus): string {
    return { healthy: '#48e174', warning: '#ffc01c', critical: '#ff4941' }[status];
  }

  private popup(fence: MapFence): string {
    return `<div class="fence-map-popup"><strong>${fence.name}</strong><span>${fence.district} &middot; ${fence.sections} sections</span><b>${fence.voltage.toFixed(1)} kV</b><em>${fence.status}</em></div>`;
  }
}
