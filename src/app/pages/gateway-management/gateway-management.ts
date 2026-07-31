import { AfterViewChecked, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Check, ChevronDown, createIcons, MoreHorizontal, Pencil, Plus, RadioTower, Search, Signal, Trash2, Wifi, X } from 'lucide';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

type GatewayStatus = 'online' | 'warning' | 'offline';

interface Gateway {
  id: string; name: string; serial: string; imei: string; fences: string[];
  status: GatewayStatus; signal: number; power: number; devices: number;
  lastSeen: string; firmware: string; enabled: boolean;
}

@Component({
  selector: 'app-gateway-management-page',
  standalone: true,
  imports: [FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './gateway-management.html',
  styleUrl: './gateway-management.css',
})
export class GatewayManagementPage implements AfterViewChecked {
  readonly fences = ['Monaragala Elephant Protection Fence', 'Wilpattu North Buffer Fence', 'Mihintale Wildlife Buffer Fence', 'Gal Oya East Protection Fence'];
  gateways: Gateway[] = [
    { id: 'GTW-1004', name: 'Monaragala Main Gateway', serial: 'GW-2026-1004', imei: '356938035643809', fences: [this.fences[0], this.fences[3]], status: 'online', signal: 94, power: 100, devices: 4, lastSeen: '8 sec ago', firmware: 'v2.4.1', enabled: true },
    { id: 'GTW-1003', name: 'Wilpattu North Gateway', serial: 'GW-2026-1003', imei: '356938035643817', fences: [this.fences[1]], status: 'warning', signal: 46, power: 61, devices: 2, lastSeen: '3 min ago', firmware: 'v2.3.8', enabled: true },
    { id: 'GTW-1002', name: 'Mihintale Field Gateway', serial: 'GW-2026-1002', imei: '356938035643825', fences: [this.fences[2]], status: 'offline', signal: 0, power: 18, devices: 2, lastSeen: '4 hr ago', firmware: 'v2.3.8', enabled: true },
    { id: 'GTW-1001', name: 'Spare Gateway 01', serial: 'GW-2026-1001', imei: '356938035643833', fences: [], status: 'offline', signal: 0, power: 100, devices: 0, lastSeen: 'Not installed', firmware: 'v2.4.1', enabled: false },
  ];

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
  toggleEnabled(gateway: Gateway, event: Event): void { event.stopPropagation(); gateway.enabled = !gateway.enabled; }

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
    if (this.editing) Object.assign(this.editing, this.form);
    else this.gateways = [{ ...this.form, id: `GTW-${String(1001 + this.gateways.length).padStart(4, '0')}` }, ...this.gateways];
    this.drawerOpen = false; this.submitted = false;
  }

  remove(gateway: Gateway): void {
    if (!confirm(`Remove ${gateway.name}? This action cannot be undone.`)) return;
    this.gateways = this.gateways.filter(item => item !== gateway);
    if (this.selected === gateway) this.selected = undefined;
    this.menuGateway = undefined;
  }

  private blankGateway(): Gateway {
    return { id: '', name: '', serial: '', imei: '', fences: [], status: 'offline', signal: 0, power: 100, devices: 0, lastSeen: 'Not installed', firmware: 'v2.4.1', enabled: false };
  }
}
