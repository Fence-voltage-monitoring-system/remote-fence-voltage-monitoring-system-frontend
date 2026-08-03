import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataRetentionSettings } from '../../configuration.models';

@Component({
  selector: 'app-data-retention-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './data-retention-editor.html',
  styleUrl: './data-retention-editor.css'
})
export class DataRetentionEditor {
  @Input({ required: true }) value!: DataRetentionSettings;
  @Output() valueChange = new EventEmitter<DataRetentionSettings>();
  @Output() cleanupRequested = new EventEmitter<void>();

  update<K extends keyof DataRetentionSettings>(field: K, value: DataRetentionSettings[K]): void {
    this.valueChange.emit({ ...this.value, [field]: value });
  }
}
