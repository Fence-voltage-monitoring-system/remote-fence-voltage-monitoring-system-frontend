import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AssignDevicePayload, CreateDevicePayload, Device, UpdateDevicePayload } from '../models/device.models';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/devices';
  private readonly options = { withCredentials: true } as const;

  readonly previewDevices: Device[] = [
    { id: 'DVC-1024', name: 'North Gate Monitor', serial: 'VM-8F42-A109', type: 'Voltage Monitor', fence: 'Monaragala Elephant Protection Fence', section: 'SEC-001', status: 'online', voltage: 6.2, signal: 92, battery: 88, lastSeen: '12 sec ago', enabled: true },
    { id: 'DVC-1023', name: 'River Bend Controller', serial: 'FC-2C11-B208', type: 'Voltage Monitor', fence: 'Monaragala Elephant Protection Fence', section: 'SEC-002', status: 'warning', voltage: 4.1, signal: 64, battery: 41, lastSeen: '2 min ago', enabled: true },
    { id: 'DVC-1022', name: 'Wilpattu Relay 02', serial: 'RP-7D90-C511', type: 'Voltage Monitor', fence: 'Wilpattu North Buffer Fence', section: 'SEC-001', status: 'online', voltage: null, signal: 87, battery: 76, lastSeen: '28 sec ago', enabled: true },
    { id: 'DVC-1021', name: 'Mihintale East Monitor', serial: 'VM-5A33-D047', type: 'Voltage Monitor', fence: 'Mihintale Wildlife Buffer Fence', section: 'SEC-003', status: 'offline', voltage: 0, signal: 0, battery: 12, lastSeen: '3 hr ago', enabled: true },
    { id: 'DVC-1020', name: 'Gal Oya Controller', serial: 'FC-9B74-E633', type: 'Voltage Monitor', fence: 'Gal Oya East Protection Fence', section: 'SEC-001', status: 'warning', voltage: 3.8, signal: 52, battery: 57, lastSeen: '8 min ago', enabled: true },
    { id: 'DVC-1019', name: 'West Boundary Monitor', serial: 'VM-1E28-F904', type: 'Voltage Monitor', fence: 'Wilpattu North Buffer Fence', section: 'SEC-002', status: 'online', voltage: 5.9, signal: 78, battery: 93, lastSeen: '41 sec ago', enabled: true },
    { id: 'DVC-1018', name: 'Old Service Relay', serial: 'RP-4K17-G321', type: 'Voltage Monitor', fence: 'Mihintale Wildlife Buffer Fence', section: 'SEC-002', status: 'offline', voltage: null, signal: 0, battery: 0, lastSeen: '2 days ago', enabled: false },
    { id: 'DEV-EFE-0060', name: 'Field Monitor 0060', serial: 'SN-2024-0060', type: 'Voltage Monitor', fence: null, section: null, status: 'offline', voltage: null, signal: 0, battery: 100, lastSeen: 'Not installed', enabled: false },
    { id: 'DEV-EFE-0061', name: 'Field Monitor 0061', serial: 'SN-2024-0061', type: 'Voltage Monitor', fence: null, section: null, status: 'offline', voltage: null, signal: 0, battery: 100, lastSeen: 'Not installed', enabled: false },
  ];

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(this.endpoint, this.options);
  }

  createDevice(payload: CreateDevicePayload): Observable<Device> {
    return this.http.post<Device>(this.endpoint, payload, this.options);
  }

  updateDevice(id: string, payload: UpdateDevicePayload): Observable<Device> {
    return this.http.patch<Device>(`${this.endpoint}/${id}`, payload, this.options);
  }

  assignDevice(id: string, payload: AssignDevicePayload): Observable<Device> {
    return this.http.post<Device>(`${this.endpoint}/${id}/assign`, payload, this.options);
  }

  unassignDevice(id: string): Observable<Device> {
    return this.http.post<Device>(`${this.endpoint}/${id}/unassign`, {}, this.options);
  }

  toggleEnabled(id: string, enabled: boolean): Observable<Device> {
    return this.http.patch<Device>(`${this.endpoint}/${id}/status`, { enabled }, this.options);
  }

  deleteDevice(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`, this.options);
  }
}
