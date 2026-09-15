import { Component, Input } from '@angular/core';

export interface UserSummaryData {
  total: number;
  superAdmin: number;
  regionalAdmin: number;
  fieldAdmin: number;
  maintenance: number;
}

@Component({
  selector: 'app-user-summary',
  standalone: true,
  templateUrl: './user-summary.html',
  styleUrl: './user-summary.css'
})
export class UserSummary {
  @Input({ required: true }) summary!: UserSummaryData;
}
