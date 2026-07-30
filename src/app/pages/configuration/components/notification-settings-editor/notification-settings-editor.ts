import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotificationSettings } from '../../configuration.models';

@Component({
  selector: 'app-notification-settings-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './notification-settings-editor.html',
  styleUrl: './notification-settings-editor.css'
})
export class NotificationSettingsEditor {
  @Input({ required: true }) value!: NotificationSettings;
  @Output() valueChange = new EventEmitter<NotificationSettings>();

  update<K extends keyof NotificationSettings>(field: K, value: NotificationSettings[K]): void {
    this.valueChange.emit({ ...this.value, [field]: value });
  }
}
