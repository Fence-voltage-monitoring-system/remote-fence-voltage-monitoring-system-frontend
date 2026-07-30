import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

interface Faq { question: string; answer: string; category: string; }

@Component({
  selector: 'app-help-support-page',
  standalone: true,
  imports: [FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './help-support.html',
  styleUrl: './help-support.css',
})
export class HelpSupportPage {
  query = '';
  expandedQuestion = '';
  copied = false;

  readonly faqs: Faq[] = [
    { category: 'Monitoring', question: 'Why is a fence section showing as offline?', answer: 'Check the gateway connection and last telemetry time first. If the gateway is online, inspect the field device power and communication status for the affected section.' },
    { category: 'Alerts', question: 'How are critical voltage alerts triggered?', answer: 'A critical alert is raised when the measured voltage remains below the configured section threshold. Alert rules and notification recipients are managed by administrators.' },
    { category: 'Devices', question: 'How do I add or replace a monitoring device?', answer: 'Open Device Management, register the device identifier, assign it to the correct fence section, and confirm that telemetry is received before completing the installation.' },
    { category: 'Account', question: 'How can I update my profile or security settings?', answer: 'Use the user menu in the top-right corner. My Profile contains personal details, while Security contains password, two-factor authentication, and active-session controls.' },
    { category: 'Map', question: 'What do the map colors mean?', answer: 'Green indicates healthy operation, amber indicates a warning, red indicates a critical condition, and grey indicates an offline section.' },
  ];

  get filteredFaqs(): Faq[] {
    const term = this.query.trim().toLowerCase();
    return term ? this.faqs.filter(item => `${item.question} ${item.answer} ${item.category}`.toLowerCase().includes(term)) : this.faqs;
  }

  toggle(question: string): void { this.expandedQuestion = this.expandedQuestion === question ? '' : question; }

  async copyEmail(): Promise<void> {
    await navigator.clipboard.writeText('support@dwc.gov.lk');
    this.copied = true;
    window.setTimeout(() => this.copied = false, 1800);
  }
}
