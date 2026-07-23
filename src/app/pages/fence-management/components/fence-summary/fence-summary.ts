import { Component, Input } from '@angular/core';
import { FenceSummaryData } from '../../fence-management.models';
@Component({ selector: 'app-fence-summary', standalone: true, templateUrl: './fence-summary.html', styleUrl: './fence-summary.css' })
export class FenceSummary { @Input({ required: true }) summary!: FenceSummaryData; }
