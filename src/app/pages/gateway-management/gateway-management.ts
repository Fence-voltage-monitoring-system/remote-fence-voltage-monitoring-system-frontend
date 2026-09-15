import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewChecked, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import * as L from 'leaflet';
import { Check, ChevronDown, createIcons, MapPin, MoreHorizontal, Pencil, Plus, RadioTower, Search, Signal, Trash2, Wifi, X } from 'lucide';
import { Gateway, GatewayStatus } from '../../core/models/gateway.models';
import { GatewayService } from '../../core/services/gateway.service';
import { FenceService } from '../../core/services/fence.service';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-gateway-management-page',
  standalone: true,
  imports: [FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './gateway-management.html',
  styleUrl: './gateway-management.css',
})
export class GatewayManagementPage implements OnInit, AfterViewChecked, OnDestroy {
  private readonly gatewayService = inject(GatewayService);
  private readonly fenceService = inject(FenceService);
  private readonly cdr = inject(ChangeDetectorRef);

  fences: string[] = [];
  gateways: Gateway[] = [];

  isLoading = false;
  isSubmitting = false;
  usingPreview = false;
  notice = '';
  errorMessage = '';

  search = '';
  statusFilter: GatewayStatus | 'all' = 'all';
  assignmentFilter: 'all' | 'assigned' | 'unassigned' = 'all';
  selected?: Gateway;
  menuGateway?: Gateway;
  editing?: Gateway;
  drawerOpen = false;
  submitted = false;
  form = this.blankGateway();
  private iconsReady = false;

  private modalMap?: L.Map;
  private modalMarker?: L.Marker;

  ngOnInit(): void {
    this.loadGateways();
    this.loadFences();
  }

  ngOnDestroy(): void {
    this.destroyModalMap();
  }

  private loadFences(): void {
    this.fenceService.getFences().subscribe({
      next: (fences) => { this.fences = (fences || []).map((f) => f.name); },
      error: () => { this.fences = []; }
    });
  }

  private refreshIcons(): void {
    this.iconsReady = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      createIcons({
        icons: { Check, ChevronDown, MapPin, MoreHorizontal, Pencil, Plus, RadioTower, Search, Signal, Trash2, Wifi, X },
        attrs: { 'stroke-width': 1.8, width: 16, height: 16 }
      });
      this.iconsReady = true;
    }, 0);
  }

  loadGateways(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.gatewayService.getGateways().pipe(finalize(() => {
      this.isLoading = false;
      this.refreshIcons();
    })).subscribe({
      next: (gateways) => {
        this.gateways = gateways || [];
        this.usingPreview = false;
        this.notice = '';
        this.refreshIcons();
      },
      error: () => {
        this.gateways = [];
        this.usingPreview = false;
        this.errorMessage = 'Unable to connect to Gateway API.';
        this.refreshIcons();
      },
    });
  }

  get filteredGateways(): Gateway[] {
    const term = this.search.trim().toLowerCase();
    return this.gateways.filter(gateway =>
      (!term || [gateway.name, gateway.id, gateway.serial, gateway.imei, ...gateway.fences].some(value => value.toLowerCase().includes(term))) &&
      (this.statusFilter === 'all' || gateway.status === this.statusFilter) &&
      (this.assignmentFilter === 'all' || (this.assignmentFilter === 'assigned') === (gateway.fences.length > 0)));
  }

  count(status: GatewayStatus): number { return this.gateways.filter(gateway => gateway.status === status).length; }
  get unassignedCount(): number { return this.gateways.filter(gateway => gateway.fences.length === 0).length; }

  ngAfterViewChecked(): void {
    if (!this.iconsReady) {
      this.refreshIcons();
    }
  }

  clearFilters(): void { this.search = ''; this.statusFilter = 'all'; this.assignmentFilter = 'all'; }
  selectGateway(gateway: Gateway): void { this.selected = gateway; this.menuGateway = undefined; this.refreshIcons(); }
  toggleMenu(gateway: Gateway, event: Event): void { event.stopPropagation(); this.menuGateway = this.menuGateway === gateway ? undefined : gateway; this.refreshIcons(); }
  
  toggleEnabled(gateway: Gateway, event: Event): void {
    event.stopPropagation();
    const nextState = !gateway.enabled;
    gateway.enabled = nextState;
    this.gatewayService.toggleEnabled(gateway.id, nextState).subscribe({
      next: () => { this.refreshIcons(); },
      error: (err: HttpErrorResponse) => {
        gateway.enabled = !nextState; // revert toggle on error
        this.errorMessage = err.error?.message || 'Failed to toggle gateway status.';
        this.refreshIcons();
      },
    });
  }

  openAdd(): void {
    this.editing = undefined; this.form = this.blankGateway(); this.submitted = false;
    this.errorMessage = '';
    this.drawerOpen = true; this.selected = undefined;
    this.refreshIcons();
    this.initModalMap();
  }

  openEdit(gateway: Gateway): void {
    this.editing = gateway; this.form = { ...gateway, fences: [...gateway.fences] }; this.submitted = false;
    this.errorMessage = '';
    this.drawerOpen = true; this.selected = undefined; this.menuGateway = undefined;
    this.refreshIcons();
    this.initModalMap();
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.destroyModalMap();
  }

  private initModalMap(): void {
    setTimeout(() => {
      this.destroyModalMap();
      const container = document.getElementById('gatewayModalMap');
      if (!container) return;

      const initialLat = this.form.latitude ?? 7.8731;
      const initialLng = this.form.longitude ?? 80.7718;
      const zoom = (this.form.latitude && this.form.longitude) ? 13 : 7;

      this.modalMap = L.map(container, {
        attributionControl: false,
        zoomControl: true,
      }).setView([initialLat, initialLng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(this.modalMap);

      const customIcon = L.divIcon({
        className: 'custom-gateway-marker-pin',
        html: `<div style="background-color: #55e777; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #0f2913; box-shadow: 0 0 10px rgba(85,231,119,0.8); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background-color: #0f2913; border-radius: 50%;"></div></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      this.modalMarker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customIcon
      }).addTo(this.modalMap);

      this.modalMarker.on('dragend', () => {
        const pos = this.modalMarker?.getLatLng();
        if (pos) {
          this.form.latitude = Number(pos.lat.toFixed(6));
          this.form.longitude = Number(pos.lng.toFixed(6));
          this.cdr.detectChanges();
        }
      });

      this.modalMap.on('click', (e: L.LeafletMouseEvent) => {
        this.form.latitude = Number(e.latlng.lat.toFixed(6));
        this.form.longitude = Number(e.latlng.lng.toFixed(6));
        this.modalMarker?.setLatLng(e.latlng);
        this.cdr.detectChanges();
      });

      setTimeout(() => {
        this.modalMap?.invalidateSize();
      }, 200);
    }, 100);
  }

  onLatLngInputChange(): void {
    if (this.form.latitude != null && this.form.longitude != null && !isNaN(this.form.latitude) && !isNaN(this.form.longitude)) {
      const latLng: L.LatLngExpression = [this.form.latitude, this.form.longitude];
      this.modalMarker?.setLatLng(latLng);
      this.modalMap?.panTo(latLng);
    }
  }

  private destroyModalMap(): void {
    if (this.modalMap) {
      this.modalMap.remove();
      this.modalMap = undefined;
      this.modalMarker = undefined;
    }
  }

  save(): void {
    this.submitted = true;
    this.errorMessage = '';
    if (!this.form.name.trim() || !this.form.serial.trim() || !this.form.imei.trim()) return;
    this.isSubmitting = true;

    const payload = {
      name: this.form.name,
      serial: this.form.serial,
      imei: this.form.imei,
      fences: this.form.fences,
      firmware: this.form.firmware,
      latitude: this.form.latitude,
      longitude: this.form.longitude,
    };

    if (this.editing) {
      this.gatewayService.updateGateway(this.editing.id, payload).pipe(finalize(() => {
        this.isSubmitting = false;
        this.refreshIcons();
      })).subscribe({
        next: (updated) => {
          Object.assign(this.editing!, updated);
          this.closeDrawer();
          this.submitted = false;
          this.refreshIcons();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = this.extractErrorMessage(err);
          this.refreshIcons();
        },
      });
    } else {
      this.gatewayService.createGateway(payload).pipe(finalize(() => {
        this.isSubmitting = false;
        this.refreshIcons();
      })).subscribe({
        next: (created) => {
          this.gateways = [created, ...this.gateways];
          this.closeDrawer();
          this.submitted = false;
          this.refreshIcons();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = this.extractErrorMessage(err);
          this.refreshIcons();
        },
      });
    }
  }

  remove(gateway: Gateway): void {
    if (!confirm(`Remove ${gateway.name}? This action cannot be undone.`)) return;
    this.gatewayService.deleteGateway(gateway.id).subscribe({
      next: () => {
        this.gateways = this.gateways.filter(item => item !== gateway);
        if (this.selected === gateway) this.selected = undefined;
        this.menuGateway = undefined;
        this.refreshIcons();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = this.extractErrorMessage(err);
        this.refreshIcons();
      },
    });
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    if (!err) return 'An unexpected error occurred.';
    if (typeof err.error === 'string' && err.error.trim()) return err.error;
    if (err.error?.message) return err.error.message;
    if (err.error?.detail) return err.error.detail;
    if (err.error?.errors?.[0]?.defaultMessage) return err.error.errors[0].defaultMessage;
    if (err.error?.error) return `${err.status}: ${err.error.error}`;
    return err.message || 'Operation failed. Please try again.';
  }

  private blankGateway(): Gateway {
    return { id: '', name: '', serial: '', imei: '', fences: [], status: 'offline', signal: 0, power: 100, devices: 0, lastSeen: 'Not installed', firmware: 'v2.4.1', enabled: false, latitude: undefined, longitude: undefined };
  }
}
