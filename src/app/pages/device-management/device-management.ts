import { AfterViewChecked, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Activity, BatteryCharging, Check, ChevronDown, CirclePlus, Cpu, createIcons, MoreHorizontal, Pencil, Plus, Radio, Search, Signal, SlidersHorizontal, Trash2, Wifi, X } from 'lucide';
import { Device, DeviceStatus } from '../../core/models/device.models';
import { DeviceService } from '../../core/services/device.service';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-device-management-page',
  standalone: true,
  imports: [FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './device-management.html',
  styleUrl: './device-management.css',
})
export class DeviceManagementPage implements OnInit, AfterViewChecked {
  private readonly router = inject(Router);
  private readonly deviceService = inject(DeviceService);

  readonly fences = ['Monaragala Elephant Protection Fence', 'Wilpattu North Buffer Fence', 'Mihintale Wildlife Buffer Fence', 'Gal Oya East Protection Fence'];
  readonly sectionsByFence: Record<string, string[]> = {
    [this.fences[0]]: ['SEC-001', 'SEC-002', 'SEC-003', 'SEC-004'],
    [this.fences[1]]: ['SEC-001', 'SEC-002', 'SEC-003'],
    [this.fences[2]]: ['SEC-001', 'SEC-002', 'SEC-003'],
    [this.fences[3]]: ['SEC-001', 'SEC-002', 'SEC-003', 'SEC-004'],
  };

  devices: Device[] = [];
  isLoading = false;
  isSubmitting = false;
  usingPreview = false;
  notice = '';
  errorMessage = '';

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

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.deviceService.getDevices().pipe(finalize(() => { this.isLoading = false; })).subscribe({
      next: (devices) => {
        if (devices && devices.length > 0) {
          this.devices = devices;
          this.usingPreview = false;
          this.notice = '';
        } else {
          this.devices = this.deviceService.previewDevices;
          this.usingPreview = true;
          this.notice = 'Device API returned empty list. Displaying preview dataset.';
        }
      },
      error: () => {
        this.devices = this.deviceService.previewDevices;
        this.usingPreview = true;
        this.notice = 'Device API unavailable. Displaying preview dataset.';
      },
    });
  }

  get onlinePercentage(): number {
    return this.devices.length ? Math.round((this.count('online') / this.devices.length) * 100) : 0;
  }

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
  
  toggleEnabled(device: Device, event: Event): void {
    event.stopPropagation();
    const nextState = !device.enabled;
    device.enabled = nextState;
    this.deviceService.toggleEnabled(device.id, nextState).subscribe({
      error: () => {
        this.notice = 'Status update saved locally.';
      },
    });
  }

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

  confirmAssignment(): void {
    if (!this.selectedUnassigned) return;
    const target = this.selectedUnassigned;
    const fence = this.assignmentFence;
    const section = this.assignmentSection;
    this.isSubmitting = true;

    this.deviceService.assignDevice(target.id, { fence, section }).pipe(finalize(() => { this.isSubmitting = false; })).subscribe({
      next: (updated) => {
        Object.assign(target, updated);
        this.assignmentOpen = false;
        this.selected = undefined;
      },
      error: () => {
        Object.assign(target, { fence, section, status: 'online' as DeviceStatus, voltage: 6, signal: 100, lastSeen: 'Just now', enabled: true });
        this.assignmentOpen = false;
        this.selected = undefined;
        this.notice = 'Assignment saved locally.';
      },
    });
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
    this.isSubmitting = true;

    const assigned = !!this.registrationSection;
    const wasAssigned = !!this.editing?.section;

    if (this.editing) {
      const payload = {
        name: this.form.name,
        serial: this.form.serial,
        fence: assigned ? this.registrationFence : null,
        section: assigned ? this.registrationSection : null,
      };

      this.deviceService.updateDevice(this.editing.id, payload).pipe(finalize(() => { this.isSubmitting = false; })).subscribe({
        next: (updated) => {
          Object.assign(this.editing!, updated);
          this.dialogOpen = false;
        },
        error: () => {
          Object.assign(this.editing!, this.form, {
            fence: assigned ? this.registrationFence : null,
            section: assigned ? this.registrationSection : null,
            status: assigned ? (wasAssigned ? this.form.status : 'online') : 'offline',
            voltage: assigned ? (wasAssigned ? this.form.voltage : 6) : null,
            signal: assigned ? (wasAssigned ? this.form.signal : 100) : 0,
            lastSeen: assigned ? (wasAssigned ? this.form.lastSeen : 'Just now') : 'Unassigned',
            enabled: assigned ? (wasAssigned ? this.form.enabled : true) : false,
          });
          this.dialogOpen = false;
          this.notice = 'Device update saved locally.';
        },
      });
    } else {
      const payload = {
        name: this.form.name,
        serial: this.form.serial,
        fence: assigned ? this.registrationFence : null,
        section: assigned ? this.registrationSection : null,
      };

      this.deviceService.createDevice(payload).pipe(finalize(() => { this.isSubmitting = false; })).subscribe({
        next: (created) => {
          this.devices = [created, ...this.devices];
          this.dialogOpen = false;
        },
        error: () => {
          const newDevice: Device = {
            ...this.form,
            id: `DEV-EFE-${String(60 + this.devices.length).padStart(4, '0')}`,
            fence: assigned ? this.registrationFence : null,
            section: assigned ? this.registrationSection : null,
            status: assigned ? 'online' : 'offline',
            voltage: assigned ? 6 : null,
            signal: assigned ? 100 : 0,
            lastSeen: assigned ? 'Just now' : 'Not installed',
            enabled: assigned,
          };
          this.devices = [newDevice, ...this.devices];
          this.dialogOpen = false;
          this.notice = 'New device created locally.';
        },
      });
    }
  }

  remove(device: Device): void {
    if (!window.confirm(`Are you sure you want to remove device ${device.name} (${device.id})?`)) return;
    this.deviceService.deleteDevice(device.id).subscribe({
      next: () => {
        this.devices = this.devices.filter((item) => item !== device);
        if (this.selected === device) this.selected = undefined;
        this.menuDevice = undefined;
      },
      error: () => {
        this.devices = this.devices.filter((item) => item !== device);
        if (this.selected === device) this.selected = undefined;
        this.menuDevice = undefined;
        this.notice = 'Device removed locally.';
      },
    });
  }

  unassign(device: Device): void {
    this.deviceService.unassignDevice(device.id).subscribe({
      next: (updated) => {
        Object.assign(device, updated);
        this.menuDevice = undefined;
      },
      error: () => {
        Object.assign(device, { fence: null, section: null, status: 'offline' as DeviceStatus, voltage: null, signal: 0, lastSeen: 'Unassigned', enabled: false });
        this.menuDevice = undefined;
        this.notice = 'Device unassigned locally.';
      },
    });
  }

  private blankDevice(): Device {
    return { id: '', name: '', serial: '', type: 'Voltage Monitor', fence: null, section: null, status: 'offline', voltage: null, signal: 0, battery: 100, lastSeen: 'Not installed', enabled: false };
  }
}
