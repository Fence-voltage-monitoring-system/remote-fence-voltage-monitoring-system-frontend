import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Faq, SupportTicketPayload, SystemStatusInfo } from '../models/support.models';

@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/support';
  private readonly options = { withCredentials: true } as const;

  readonly previewFaqs: Faq[] = [
    { category: 'Monitoring', question: 'Why is a fence section showing as offline?', answer: 'Check the gateway connection and last telemetry time first. If the gateway is online, inspect the field device power and communication status for the affected section.' },
    { category: 'Alerts', question: 'How are critical voltage alerts triggered?', answer: 'A critical alert is raised when the measured voltage remains below the configured section threshold. Alert rules and notification recipients are managed by administrators.' },
    { category: 'Devices', question: 'How do I add or replace a monitoring device?', answer: 'Open Device Management, register the device identifier, assign it to the correct fence section, and confirm that telemetry is received before completing the installation.' },
    { category: 'Account', question: 'How can I update my profile or security settings?', answer: 'Use the user menu in the top-right corner. My Profile contains personal details, while Security contains password, two-factor authentication, and active-session controls.' },
    { category: 'Map', question: 'What do the map colors mean?', answer: 'Green indicates healthy operation, amber indicates a warning, red indicates a critical condition, and grey indicates an offline section.' },
    { category: 'Gateways', question: 'What should I do if a gateway drops connection?', answer: 'Verify cellular signal strength at the installation site, check solar power backup battery levels, and perform a remote restart command if available.' },
  ];

  getFaqs(): Observable<Faq[]> {
    return this.http.get<Faq[]>(`${this.endpoint}/faqs`, this.options);
  }

  submitTicket(payload: SupportTicketPayload): Observable<{ id: string; status: string }> {
    return this.http.post<{ id: string; status: string }>(`${this.endpoint}/tickets`, payload, this.options);
  }

  getSystemStatus(): Observable<SystemStatusInfo> {
    return this.http.get<SystemStatusInfo>(`${this.endpoint}/status`, this.options);
  }
}
