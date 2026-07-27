import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { FenceRouteData, FenceRouteSection } from '../dashboard/components/fence-monitor/fence-monitor';

type RouteStatus = FenceRouteSection['status'];
interface RenderedSegment { section: FenceRouteSection; start: L.LatLngTuple; end: L.LatLngTuple; casing: L.Polyline; route: L.Polyline; }

@Component({ selector: 'app-fence-route-map', standalone: true, templateUrl: './fence-route-map.html', styleUrl: './fence-route-map.css' })
export class FenceRouteMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('routeMap') mapElement!: ElementRef<HTMLDivElement>;
  @Input() fence?: FenceRouteData;
  @Input() selectedSectionId = '';
  zoomLevel = 8;
  private map?: L.Map;
  private routeLayer?: L.LayerGroup;
  private detailLayer?: L.LayerGroup;
  private resizeObserver?: ResizeObserver;
  private segments: RenderedSegment[] = [];

  get counts(): Record<RouteStatus, number> {
    return (this.fence?.sections ?? []).reduce((totals, section) => ({ ...totals, [section.status]: totals[section.status] + 1 }), { healthy: 0, warning: 0, critical: 0, offline: 0 });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement.nativeElement, { zoomControl: true, minZoom: 8, maxZoom: 19, preferCanvas: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxNativeZoom: 19, maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(this.map);
    this.routeLayer = L.layerGroup().addTo(this.map);
    this.detailLayer = L.layerGroup().addTo(this.map);
    this.map.on('zoomend', () => this.updateZoomDetails());
    this.drawRoute();
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize({ pan: false }));
    this.resizeObserver.observe(this.mapElement.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;
    if (changes['fence']) this.drawRoute();
    if (changes['selectedSectionId'] && this.selectedSectionId) this.focusSection(this.selectedSectionId);
  }
  ngOnDestroy(): void { this.resizeObserver?.disconnect(); this.map?.remove(); }

  private drawRoute(): void {
    if (!this.map || !this.routeLayer || !this.detailLayer || !this.fence?.sections.length) return;
    this.routeLayer.clearLayers();
    this.detailLayer.clearLayers();
    this.segments = [];
    const sections = this.fence.sections;
    const points = sections.map(section => [section.latitude, section.longitude] as L.LatLngTuple);
    const last = points.at(-1)!;
    const previous = points.at(-2) ?? [last[0] - .001, last[1] - .001];
    points.push([last[0] + (last[0] - previous[0]), last[1] + (last[1] - previous[1])]);
    sections.forEach((section, index) => this.drawSegment(section, points[index], points[index + 1]));
    this.map.fitBounds(L.latLngBounds(points), { padding: [38, 38], maxZoom: 15, animate: false });
    this.updateZoomDetails();
  }

  private drawSegment(section: FenceRouteSection, start: L.LatLngTuple, end: L.LatLngTuple): void {
    const path: L.LatLngExpression[] = [start, end];
    const casing = L.polyline(path, { color: '#08150c', weight: 10, opacity: .72, lineCap: 'round', interactive: false }).addTo(this.routeLayer!);
    const route = L.polyline(path, { color: this.statusColor(section.status), weight: 6, opacity: .95, lineCap: 'round', className: `fence-route fence-route--${section.status}` })
      .bindTooltip(`${section.id} · ${section.status}`, { sticky: true, direction: 'top' })
      .bindPopup(`<div class="route-popup"><strong>${section.id}</strong><span>${this.fence!.name}</span><b>${section.voltage.toFixed(1)} kV · ${section.status}</b><small>Updated ${section.updated}</small></div>`)
      .addTo(this.routeLayer!);
    this.segments.push({ section, start, end, casing, route });
  }

  private focusSection(sectionId: string): void {
    const segment = this.segments.find(item => item.section.id === sectionId);
    if (!this.map || !segment) return;
    this.map.flyToBounds(L.latLngBounds([segment.start, segment.end]), {
      padding: [90, 90],
      maxZoom: 17,
      duration: .8,
    });
    segment.route.openPopup();
  }

  private updateZoomDetails(): void {
    if (!this.map || !this.detailLayer) return;
    this.zoomLevel = this.map.getZoom();
    this.detailLayer.clearLayers();
    const closeZoom = this.zoomLevel >= 16;
    this.segments.forEach(segment => {
      segment.casing.setStyle({ weight: closeZoom ? 7 : 10, opacity: closeZoom ? .45 : .72 });
      segment.route.setStyle({ weight: closeZoom ? 4 : this.zoomLevel >= 13 ? 5 : 6, opacity: closeZoom ? .78 : .95 });
    });
    if (this.zoomLevel >= 13) this.addSectionLabels();
    if (this.zoomLevel >= 14) this.addGatewayMarker();
    if (this.zoomLevel >= 15) this.addDeviceMarkers();
  }

  private addSectionLabels(): void {
    const interval = this.zoomLevel >= 15 ? 1 : this.zoomLevel >= 14 ? 2 : 4;
    this.segments.forEach((segment, index) => {
      if (index % interval) return;
      const midpoint = L.latLng((segment.start[0] + segment.end[0]) / 2, (segment.start[1] + segment.end[1]) / 2);
      L.tooltip({ permanent: true, direction: 'top', offset: [0, -5], className: 'fence-section-map-label', interactive: false })
        .setLatLng(midpoint).setContent(segment.section.id).addTo(this.detailLayer!);
    });
  }

  private addGatewayMarker(): void {
    const first = this.segments[0];
    if (!first) return;
    L.marker(first.start, { icon: L.divIcon({ className: 'fence-gateway-marker', html: '<span>G</span>', iconSize: [26, 26], iconAnchor: [13, 13] }) })
      .bindPopup(`<strong>Fence gateway</strong><br><small>${this.fence!.name}</small>`).addTo(this.detailLayer!);
  }

  private addDeviceMarkers(): void {
    this.segments.forEach(segment => {
      L.circleMarker(segment.start, { radius: this.zoomLevel >= 17 ? 6 : 4, color: '#eff8ed', weight: 1.5, fillColor: this.statusColor(segment.section.status), fillOpacity: 1 })
        .bindTooltip(`${segment.section.id} monitor`, { direction: 'right' })
        .bindPopup(`<div class="route-popup"><strong>${segment.section.id} monitor</strong><b>${segment.section.voltage.toFixed(1)} kV</b><span>${segment.section.status}</span><small>Updated ${segment.section.updated}</small></div>`)
        .addTo(this.detailLayer!);
    });
  }

  private statusColor(status: RouteStatus): string { return { healthy: '#48e174', warning: '#ffc01c', critical: '#ff4941', offline: '#7c8780' }[status]; }
}
