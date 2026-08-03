import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertRuleSettings } from '../../configuration.models';

@Component({
  selector: 'app-alert-rules-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './alert-rules-editor.html',
  styleUrl: './alert-rules-editor.css'
})
export class AlertRulesEditor {
  @Input({ required: true }) value!: AlertRuleSettings;
  @Output() valueChange = new EventEmitter<AlertRuleSettings>();

  update<K extends keyof AlertRuleSettings>(field: K, value: AlertRuleSettings[K]): void {
    this.valueChange.emit({ ...this.value, [field]: value });
  }
}
