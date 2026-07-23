import { Component } from '@angular/core';
import { FenceMonitorComponent } from '../dashboard/components/fence-monitor/fence-monitor';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-virtual-fence-page',
  imports: [FenceMonitorComponent, HeaderComponent, SidebarComponent],
  templateUrl: './virtual-fence.html',
  styleUrl: './virtual-fence.css',
})
export class VirtualFencePage {
  readonly fences = [
    ['monaragala', 'Monaragala Elephant Protection Fence'],
    ['wilpattu', 'Wilpattu North Buffer Fence'],
    ['mihintale', 'Mihintale Wildlife Buffer Fence'],
    ['gal-oya', 'Gal Oya East Protection Fence'],
    ['lunugamvehera', 'Lunugamvehera Park Fence'],
  ];
  selectedFenceId = 'monaragala';
  selectedStatus = 'all';
  lastRefresh = new Date();

  refresh(): void {
    this.lastRefresh = new Date();
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }
}
