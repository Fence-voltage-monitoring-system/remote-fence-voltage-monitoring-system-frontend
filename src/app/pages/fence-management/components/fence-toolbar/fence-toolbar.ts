import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FenceFilters } from '../../fence-management.models';

@Component({
  selector: 'app-fence-toolbar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './fence-toolbar.html',
  styleUrl: './fence-toolbar.css'
})
export class FenceToolbar {
  @Input({ required: true }) filters!: FenceFilters;
  @Input() provinces: string[] = [];
  @Input() districts: string[] = [];
  @Input() gateways: string[] = [];
  @Output() filtersChange = new EventEmitter<FenceFilters>();
  @Output() registerFence = new EventEmitter<void>();

  update(field: keyof FenceFilters, value: string): void {
    const next = { ...this.filters, [field]: value };
    if (field === 'province') next.district = '';
    this.filtersChange.emit(next);
  }
}
