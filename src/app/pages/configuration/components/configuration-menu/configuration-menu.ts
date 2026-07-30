import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfigurationSection } from '../../configuration.models';

@Component({
  selector: 'app-configuration-menu',
  standalone: true,
  templateUrl: './configuration-menu.html',
  styleUrl: './configuration-menu.css'
})
export class ConfigurationMenu {
  @Input() active: ConfigurationSection = 'general';
  @Output() sectionChange = new EventEmitter<ConfigurationSection>();

  readonly items: { id: ConfigurationSection; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'voltage', label: 'Voltage Thresholds' },
    { id: 'alerts', label: 'Alert Rules' },
    { id: 'notifications', label: 'Notification Settings' },
    { id: 'retention', label: 'Data Retention' },
    { id: 'security', label: 'Security' },
    { id: 'sessions', label: 'Session Management' },
    { id: 'map', label: 'Map Settings' },
    { id: 'health', label: 'System Health' }
  ];
}
