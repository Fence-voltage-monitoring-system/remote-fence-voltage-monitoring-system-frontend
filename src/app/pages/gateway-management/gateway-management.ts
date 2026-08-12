import { AfterViewChecked, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Check, ChevronDown, createIcons, MoreHorizontal, Pencil, Plus, RadioTower, Search, Signal, Trash2, Wifi, X } from 'lucide';
import { Gateway, GatewayStatus } from '../../core/models/gateway.models';
import { GatewayService } from '../../core/services/gateway.service';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-gateway-management-page',
  standalone: true,
  imports: [FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './gateway-management.html',
  styleUrl: './gateway-management.css',
})
export class GatewayManagementPage implements OnInit, AfterViewChecked {
  private readonly gatewayService = inject(GatewayService);

  readonly fences = ['Monaragala Elephant Protection Fence', 'Wilpattu North Buffer Fence', 'Mihintale Wildlife Buffer Fence', 'Gal Oya East Protection Fence'];
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

  ngOnInit(): void {
    this.loadGateways();
  }

  loadGateways(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.gatewayService.getGateways().pipe(finalize(() => { this.isLoading = false; })).subscribe({
      next: (gateways) => {
        if (gateways && gateways.length > 0) {
          this.gateways = gateways;
          this.usingPreview = false;
          this.notice = '';
        } else {
          this.gateways = this.gatewayService.previewGateways;
          this.usingPreview = true;
          this.notice = 'Gateway API returned empty list. Displaying preview dataset.';
        }
      },
      error: () => {
        this.gateways = this.gatewayService.previewGateways;
        this.usingPreview = true;
        this.notice = 'Gateway API unavailable. Displaying preview dataset.';
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
      createIcons({ icons: { Check, ChevronDown, MoreHorizontal, Pencil, Plus, RadioTower, Search, Signal, Trash2, Wifi, X }, attrs: { 'stroke-width': 1.8, width: 16, height: 16 } });
      this.iconsReady = true;
    }
  }

  clearFilters(): void { this.search = ''; this.statusFilter = 'all'; this.assignmentFilter = 'all'; }
  selectGateway(gateway: Gateway): void { this.selected = gateway; this.menuGateway = undefined; this.iconsReady = false; }
  toggleMenu(gateway: Gateway, event: Event): void { event.stopPropagation(); this.menuGateway = this.menuGateway === gateway ? undefined : gateway; this.iconsReady = false; }
  
  toggleEnabled(gateway: Gateway, event: Event): void {
    event.stopPropagation();
    const nextState = !gateway.enabled;
    gateway.enabled = nextState;
    this.gatewayService.toggleEnabled(gateway.id, nextState).subscribe({
      error: () => {
        this.notice = 'Gateway status updated locally.';
      },
    });
  }

  openAdd(): void {
    this.editing = undefined; this.form = this.blankGateway(); this.submitted = false;
    this.drawerOpen = true; this.selected = undefined; this.iconsReady = false;
  }

  openEdit(gateway: Gateway): void {
    this.editing = gateway; this.form = { ...gateway, fences: [...gateway.fences] }; this.submitted = false;
    this.drawerOpen = true; this.selected = undefined; this.menuGateway = undefined; this.iconsReady = false;
  }

  save(): void {
    this.submitted = true;
    if (!this.form.name.trim() || !this.form.serial.trim() || !this.form.imei.trim()) return;
    this.isSubmitting = true;

    if (this.editing) {
      const payload = {
        name: this.form.name,
        serial: this.form.serial,
        imei: this.form.imei,
        fences: this.form.fences,
        firmware: this.form.firmware,
      };

      this.gatewayService.updateGateway(this.editing.id, payload).pipe(finalize(() => { this.isSubmitting = false; })).subscribe({
        next: (updated) => {
          Object.assign(this.editing!, updated);
          this.drawerOpen = false;
          this.submitted = false;
        },
        error: () => {
          Object.assign(this.editing!, this.form);
          this.drawerOpen = false;
          this.submitted = false;
          this.notice = 'Gateway update saved locally.';
        },
      });
    } else {
      const payload = {
        name: this.form.name,
        serial: this.form.serial,
        imei: this.form.imei,
        fences: this.form.fences,
        firmware: this.form.firmware,
      };

      this.gatewayService.createGateway(payload).pipe(finalize(() => { this.isSubmitting = false; })).subscribe({
        next: (created) => {
          this.gateways = [created, ...this.gateways];
          this.drawerOpen = false;
          this.submitted = false;
        },
        error: () => {
          const newGateway: Gateway = {
            ...this.form,
            id: `GTW-${String(1001 + this.gateways.length).padStart(4, '0')}`,
            status: this.form.fences.length > 0 ? 'online' : 'offline',
            signal: this.form.fences.length > 0 ? 100 : 0,
            power: 100,
            devices: 0,
            lastSeen: 'Just now',
            enabled: true,
          };
          this.gateways = [newGateway, ...this.gateways];
          this.drawerOpen = false;
          this.submitted = false;
          this.notice = 'New gateway registered locally.';
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
      },
      error: () => {
        this.gateways = this.gateways.filter(item => item !== gateway);
        if (this.selected === gateway) this.selected = undefined;
        this.menuGateway = undefined;
        this.notice = 'Gateway removed locally.';
      },
    });
  }

  private blankGateway(): Gateway {
    return { id: '', name: '', serial: '', imei: '', fences: [], status: 'offline', signal: 0, power: 100, devices: 0, lastSeen: 'Not installed', firmware: 'v2.4.1', enabled: false };
  }
}
