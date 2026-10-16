import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertRuleSettings } from '../../configuration.models';
import { SystemIdentityService } from '../../../../core/services/system-identity.service';

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
  readonly identity = inject(SystemIdentityService);

  update<K extends keyof AlertRuleSettings>(field: K, value: AlertRuleSettings[K]): void {
    this.valueChange.emit({ ...this.value, [field]: value });
  }
}
