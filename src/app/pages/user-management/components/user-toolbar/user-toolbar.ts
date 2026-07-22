import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserFilters } from '../../user-management.models';

@Component({
  selector: 'app-user-toolbar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-toolbar.html',
  styleUrl: './user-toolbar.css',
})
export class UserToolbar {
  @Input({ required: true }) filters!: UserFilters;
  @Input() provinces: string[] = [];
  @Output() filtersChange = new EventEmitter<UserFilters>();
  @Output() createUser = new EventEmitter<void>();

  updateFilter(field: keyof UserFilters, value: string): void {
    this.filtersChange.emit({ ...this.filters, [field]: value });
  }
}
