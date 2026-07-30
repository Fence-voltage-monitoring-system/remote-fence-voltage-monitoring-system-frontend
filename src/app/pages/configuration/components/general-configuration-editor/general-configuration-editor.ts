import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeneralConfiguration } from '../../configuration.models';

@Component({
  selector: 'app-general-configuration-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './general-configuration-editor.html',
  styleUrl: './general-configuration-editor.css'
})
export class GeneralConfigurationEditor {
  @Input({ required: true }) value!: GeneralConfiguration;
  @Output() valueChange = new EventEmitter<GeneralConfiguration>();

  update<K extends keyof GeneralConfiguration>(field: K, value: GeneralConfiguration[K]): void {
    this.valueChange.emit({ ...this.value, [field]: value });
  }
}
