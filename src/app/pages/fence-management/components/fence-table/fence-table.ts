import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ManagementAccessService } from '../../../../core/services/management-access.service';
import { FenceHealth, FenceRecord } from '../../fence-management.models';

@Component({ selector: 'app-fence-table', standalone: true, templateUrl: './fence-table.html', styleUrls: ['./fence-table.css', './fence-table-compact.css'] })
export class FenceTable {
  readonly access = inject(ManagementAccessService);
  @Input() saving = false;
  @Input() fences: FenceRecord[] = [];
  @Output() fenceSelected = new EventEmitter<FenceRecord>();

  canEdit(fence: FenceRecord): boolean {
    return this.access.canManage && this.access.canManageScope(fence.province, fence.district, fence.code);
  }

  healthClass(health: FenceHealth): string {
    return { HEALTHY: 'healthy', WARNING: 'warning', CRITICAL: 'critical', OFFLINE: 'offline' }[health];
  }
}
