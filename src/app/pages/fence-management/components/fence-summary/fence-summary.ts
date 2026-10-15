import { Component, Input, inject } from '@angular/core';
import { FenceSummaryData } from '../../fence-management.models';
import { SystemIdentityService } from '../../../../core/services/system-identity.service';
@Component({ selector: 'app-fence-summary', standalone: true, templateUrl: './fence-summary.html', styleUrls: ['./fence-summary.css', './fence-summary-compact.css'] })
export class FenceSummary {
  readonly identity = inject(SystemIdentityService);
  @Input({ required: true }) summary!: FenceSummaryData;
}
