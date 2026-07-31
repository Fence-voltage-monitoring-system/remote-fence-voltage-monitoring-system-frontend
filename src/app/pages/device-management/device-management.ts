import { AfterViewChecked, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Activity, BatteryCharging, Check, ChevronDown, CirclePlus, Cpu, createIcons, MoreHorizontal, Pencil, Plus, Radio, Search, Signal, SlidersHorizontal, Trash2, Wifi, X } from 'lucide';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

type DeviceStatus = 'online' | 'warning' | 'offline';
type DeviceType = 'Voltage Monitor';

interface Device {
  id: string;
  name: string;
  serial: string;
  type: DeviceType;
  fence: string | null;
  section: string | null;
  status: DeviceStatus;
  voltage: number | null;
  signal: number;
  battery: number;
  lastSeen: string;
  enabled: boolean;
}

@Component({
  selector: 'app-device-management-page',
  standalone: true,
  imports: [FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './device-management.html',
  styleUrl: './device-management.css',
})
export class DeviceManagementPage implements AfterViewChecked {
  private readonly router = inject(Router);
  readonly fences = ['Monaragala Elephant Protection Fence', 'Wilpattu North Buffer Fence', 'Mihintale Wildlife Buffer Fence', 'Gal Oya East Protection Fence'];
  readonly sectionsByFence: Record<string, string[]> = {
    [this.fences[0]]: ['SEC-001', 'SEC-002', 'SEC-003', 'SEC-004'],
    [this.fences[1]]: ['SEC-001', 'SEC-002', 'SEC-003'],
    [this.fences[2]]: ['SEC-001', 'SEC-002', 'SEC-003'],
    [this.fences[3]]: ['SEC-001', 'SEC-002', 'SEC-003', 'SEC-004'],
  };
  devices: Device[] = [
    { id: 'DVC-1024', name: 'North Gate Monitor', serial: 'VM-8F42-A109', type: 'Voltage Monitor', fence: this.fences[0], section: 'Section A-01', status: 'online', voltage: 6.2, signal: 92, battery: 88, lastSeen: '12 sec ago', enabled: true },
    { id: 'DVC-1023', name: 'River Bend Controller', serial: 'FC-2C11-B208', type: 'Voltage Monitor', fence: this.fences[0], section: 'Section A-08', status: 'warning', voltage: 4.1, signal: 64, battery: 41, lastSeen: '2 min ago', enabled: true },
    { id: 'DVC-1022', name: 'Wilpattu Relay 02', serial: 'RP-7D90-C511', type: 'Voltage Monitor', fence: this.fences[1], section: 'Section N-12', status: 'online', voltage: null, signal: 87, battery: 76, lastSeen: '28 sec ago', enabled: true },
    { id: 'DVC-1021', name: 'Mihintale East Monitor', serial: 'VM-5A33-D047', type: 'Voltage Monitor', fence: this.fences[2], section: 'Section E-03', status: 'offline', voltage: 0, signal: 0, battery: 12, lastSeen: '3 hr ago', enabled: true },
    { id: 'DVC-1020', name: 'Gal Oya Controller', serial: 'FC-9B74-E633', type: 'Voltage Monitor', fence: this.fences[3], section: 'Section G-01', status: 'warning', voltage: 3.8, signal: 52, battery: 57, lastSeen: '8 min ago', enabled: true },
    { id: 'DVC-1019', name: 'West Boundary Monitor', serial: 'VM-1E28-F904', type: 'Voltage Monitor', fence: this.fences[1], section: 'Section W-06', status: 'online', voltage: 5.9, signal: 78, battery: 93, lastSeen: '41 sec ago', enabled: true },
    { id: 'DVC-1018', name: 'Old Service Relay', serial: 'RP-4K17-G321', type: 'Voltage Monitor', fence: this.fences[2], section: 'Section S-02', status: 'offline', voltage: null, signal: 0, battery: 0, lastSeen: '2 days ago', enabled: false },
    { id: 'DEV-EFE-0060', name: 'Field Monitor 0060', serial: 'SN-2024-0060', type: 'Voltage Monitor', fence: null, section: null, status: 'offline', voltage: null, signal: 0, battery: 100, lastSeen: 'Not installed', enabled: false },
    { id: 'DEV-EFE-0061', name: 'Field Monitor 0061', serial: 'SN-2024-0061', type: 'Voltage Monitor', fence: null, section: null, status: 'offline', voltage: null, signal: 0, battery: 100, lastSeen: 'Not installed', enabled: false },
  ];

  search = '';
  statusFilter: DeviceStatus | 'all' = 'all';
  assignmentFilter: 'all' | 'assigned' | 'unassigned' = 'all';
  selected?: Device;
  menuDevice?: Device;
  editing?: Device;
  form: Device = this.blankDevice();
  dialogOpen = false;
  assignmentOpen = false;
  wizardStep = 1;
  selectedUnassigned?: Device;
  assignmentFence = this.fences[0];
  assignmentSection = '';
  registrationFence = this.fences[0];
  registrationSection = '';
  submitted = false;
  private iconsReady = false;

  get filteredDevices(): Device[] {
    const term = this.search.trim().toLowerCase();
    return this.devices.filter((device) =>
      (!term || [device.name, device.id, device.serial, device.fence ?? '', device.section ?? ''].some((value) => value.toLowerCase().includes(term))) &&
      (this.statusFilter === 'all' || device.status === this.statusFilter) &&
      (this.assignmentFilter === 'all' || (this.assignmentFilter === 'assigned') === !!device.section));
  }

  get unassignedDevices(): Device[] { return this.devices.filter(device => !device.section); }
  get availableSections(): string[] {
    const assigned = new Set(this.devices.filter(device => device.fence === this.assignmentFence && device.section).map(device => device.section));
    return (this.sectionsByFence[this.assignmentFence] ?? []).filter(section => !assigned.has(section));
  }
  get availableRegistrationSections(): string[] {
    const assigned = new Set(this.devices.filter(device => device !== this.editing && device.fence === this.registrationFence && device.section).map(device => device.section));
    return (this.sectionsByFence[this.registrationFence] ?? []).filter(section => !assigned.has(section));
  }

  count(status: DeviceStatus): number { return this.devices.filter((device) => device.status === status).length; }

  ngAfterViewChecked(): void {
    if (!this.iconsReady) {
      createIcons({ icons: { Activity, BatteryCharging, Check, ChevronDown, CirclePlus, Cpu, MoreHorizontal, Pencil, Plus, Radio, Search, Signal, SlidersHorizontal, Trash2, Wifi, X }, attrs: { 'stroke-width': 1.8, width: 16, height: 16 } });
      this.iconsReady = true;
    }
  }

  clearFilters(): void { this.search = ''; this.statusFilter = 'all'; this.assignmentFilter = 'all'; }
  selectDevice(device: Device): void {
    this.selected = device;
    this.iconsReady = false;
  }
  toggleMenu(device: Device, event: Event): void { event.stopPropagation(); this.menuDevice = this.menuDevice === device ? undefined : device; }
  toggleEnabled(device: Device, event: Event): void { event.stopPropagation(); device.enabled = !device.enabled; }

  openAdd(): void {
    this.editing = undefined;
    this.form = this.blankDevice();
    this.submitted = false;
    this.registrationFence = this.fences[0];
    this.registrationSection = '';
    this.dialogOpen = true;
    this.iconsReady = false;
  }

  openAssignment(device?: Device): void {
    this.wizardStep = 1;
    this.selectedUnassigned = device?.section ? undefined : device ?? this.unassignedDevices[0];
    this.assignmentFence = this.fences[0];
    this.assignmentSection = '';
    this.assignmentOpen = true;
    this.iconsReady = false;
  }

  closeAssignment(): void { this.assignmentOpen = false; }

  nextAssignmentStep(): void {
    if (this.wizardStep === 1 && !this.selectedUnassigned) return;
    if (this.wizardStep === 2 && !this.assignmentSection.trim()) return;
    if (this.wizardStep < 3) { this.wizardStep++; this.iconsReady = false; }
    else this.confirmAssignment();
  }

  previousAssignmentStep(): void {
    if (this.wizardStep > 1) { this.wizardStep--; this.iconsReady = false; }
    else this.closeAssignment();
  }

  private confirmAssignment(): void {
    if (!this.selectedUnassigned) return;
    Object.assign(this.selectedUnassigned, { fence: this.assignmentFence, section: this.assignmentSection, status: 'online' as DeviceStatus, voltage: 6, signal: 100, lastSeen: 'Just now', enabled: true });
    this.assignmentOpen = false;
    this.selected = undefined;
    void this.router.navigate(['/devices']);
  }

  openEdit(device: Device): void {
    this.editing = device;
    this.form = { ...device };
    this.registrationFence = device.fence ?? this.fences[0];
    this.registrationSection = device.section ?? '';
    this.submitted = false;
    this.menuDevice = undefined;
    this.dialogOpen = true;
    this.iconsReady = false;
  }

  save(): void {
    this.submitted = true;
    if (!this.form.name.trim() || !this.form.serial.trim()) return;
    if (this.editing) {
      const assigned = !!this.registrationSection;
      const wasAssigned = !!this.editing.section;
      Object.assign(this.editing, this.form, {
        fence: assigned ? this.registrationFence : null,
        section: assigned ? this.registrationSection : null,
        status: assigned ? (wasAssigned ? this.form.status : 'online') : 'offline',
        voltage: assigned ? (wasAssigned ? this.form.voltage : 6) : null,
        signal: assigned ? (wasAssigned ? this.form.signal : 100) : 0,
        lastSeen: assigned ? (wasAssigned ? this.form.lastSeen : 'Just now') : 'Unassigned',
        enabled: assigned ? (wasAssigned ? this.form.enabled : true) : false,
      });
    }
    else {
      const assigned = !!this.registrationSection;
      this.devices = [{
        ...this.form,
        id: `DEV-EFE-${String(60 + this.devices.length).padStart(4, '0')}`,
        fence: assigned ? this.registrationFence : null,
        section: assigned ? this.registrationSection : null,
        status: assigned ? 'online' : 'offline',
        voltage: assigned ? 6 : null,
        signal: assigned ? 100 : 0,
        lastSeen: assigned ? 'Just now' : 'Not installed',
        enabled: assigned,
      }, ...this.devices];
    }
    this.dialogOpen = false;
    this.submitted = false;
    if (this.editing) {
      this.selected = undefined;
      void this.router.navigate(['/devices']);
    }
  }

  remove(device: Device): void {
    this.devices = this.devices.filter((item) => item !== device);
    if (this.selected === device) this.selected = undefined;
    this.menuDevice = undefined;
  }

  unassign(device: Device): void {
    Object.assign(device, { fence: null, section: null, status: 'offline' as DeviceStatus, voltage: null, signal: 0, lastSeen: 'Unassigned', enabled: false });
    this.menuDevice = undefined;
  }

  private blankDevice(): Device {
    return { id: '', name: '', serial: '', type: 'Voltage Monitor', fence: null, section: null, status: 'offline', voltage: null, signal: 0, battery: 100, lastSeen: 'Not installed', enabled: false };
  }
}
