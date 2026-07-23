import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FenceHealth, FenceRecord } from '../../fence-management.models';

@Component({ selector: 'app-fence-table', standalone: true, templateUrl: './fence-table.html', styleUrl: './fence-table.css' })
export class FenceTable {
  @Input() fences: FenceRecord[] = [];
  @Output() fenceSelected = new EventEmitter<FenceRecord>();

  healthClass(health: FenceHealth): string {
    return { HEALTHY: 'healthy', WARNING: 'warning', CRITICAL: 'critical', OFFLINE: 'offline' }[health];
  }
}
