import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as L from 'leaflet';

type LocationStatus = 'healthy' | 'warning' | 'critical';

interface FenceLocation {
  name: string;
  district: string;
  status: LocationStatus;
  voltage: string;
  fences: number;
  coordinates: L.LatLngExpression;
}

@Component({ selector: 'app-fence-map', standalone: true, templateUrl: './fence-map.html', styleUrl: './fence-map.css' })
export class FenceMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map') mapElement!: ElementRef<HTMLDivElement>;

  selected?: FenceLocation;
  private map?: L.Map;
  private resizeObserver?: ResizeObserver;
  private readonly markers = new Map<string, L.CircleMarker>();
  private readonly sriLankaBounds = L.latLngBounds(
    [5.72, 79.32],
    [10.05, 82.05],
  );

  readonly locations: FenceLocation[] = [
    { name: 'Wilpattu North', district: 'Puttalam', status: 'healthy', voltage: '6.1 kV', fences: 3, coordinates: [8.458, 80.028] },
    { name: 'Mihintale Buffer', district: 'Anuradhapura', status: 'warning', voltage: '4.2 kV', fences: 2, coordinates: [8.350, 80.505] },
    { name: 'Gal Oya East', district: 'Ampara', status: 'critical', voltage: '0.8 kV', fences: 4, coordinates: [7.292, 81.625] },
    { name: 'Monaragala Zone A', district: 'Monaragala', status: 'healthy', voltage: '5.9 kV', fences: 5, coordinates: [6.872, 81.350] },
    { name: 'Lunugamvehera', district: 'Hambantota', status: 'warning', voltage: '4.6 kV', fences: 3, coordinates: [6.341, 81.151] },
  ];

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement.nativeElement, {
      center: [7.75, 80.72],
      zoom: 7,
      minZoom: 6,
      maxZoom: 16,
      zoomSnap: 0.25,
      zoomControl: true,
      attributionControl: true,
      maxBounds: this.sriLankaBounds.pad(0.35),
      maxBoundsViscosity: 0.85,
      worldCopyJump: false,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      wheelDebounceTime: 45,
      wheelPxPerZoomLevel: 100,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      noWrap: true,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.locations.forEach((location) => {
      const marker = L.circleMarker(location.coordinates, {
        radius: 9,
        color: '#102015',
        weight: 3,
        fillColor: this.statusColor(location.status),
        fillOpacity: 1,
        opacity: 1,
        className: `fence-status-marker fence-status-marker--${location.status}`,
      })
        .addTo(this.map!)
        .bindPopup(this.popupContent(location), { offset: [0, -7] })
        .bindTooltip(location.name, {
          permanent: true,
          direction: 'right',
          offset: [12, 0],
          className: `fence-location-label fence-location-label--${location.status}`,
        });
      marker.on('click', () => this.selected = location);
      this.markers.set(location.name, marker);
    });

    this.fitSriLanka();
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize({ pan: false }));
    this.resizeObserver.observe(this.mapElement.nativeElement);
  }

  selectLocation(location: FenceLocation): void {
    this.selected = location;
    const marker = this.markers.get(location.name);
    if (!this.map || !marker) return;

    this.map.closePopup();
    this.map.once('moveend', () => marker.openPopup());
    this.map.flyTo(location.coordinates, 10, {
      animate: true,
      duration: 1.2,
      easeLinearity: 0.2,
      noMoveStart: true,
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  private fitSriLanka(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.map?.invalidateSize({ pan: false });
        this.map?.fitBounds(this.sriLankaBounds, { padding: [35, 35], animate: false });
      });
    });
  }

  private statusColor(status: LocationStatus): string {
    return { healthy: '#48e174', warning: '#ffc01c', critical: '#ff4941' }[status];
  }

  private popupContent(location: FenceLocation): string {
    return `<div class="fence-map-popup"><strong>${location.name}</strong><span>${location.district} &middot; ${location.fences} fences</span><b>${location.voltage}</b><em>${location.status}</em></div>`;
  }
}
