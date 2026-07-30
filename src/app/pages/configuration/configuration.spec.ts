import { TestBed } from '@angular/core/testing';
import { Configuration } from './configuration';

describe('Configuration', () => {
  async function createComponent() {
    await TestBed.configureTestingModule({ imports: [Configuration] }).compileComponents();
    return TestBed.createComponent(Configuration).componentInstance;
  }

  it('validates voltage threshold order', async () => {
    const component = await createComponent();
    component.active = 'voltage';
    expect(component.valid).toBe(true);
    component.voltageValue = { ...component.voltageValue, criticalKv: 4 };
    expect(component.valid).toBe(false);
  });

  it('validates general settings', async () => {
    const component = await createComponent();
    expect(component.valid).toBe(true);
    component.generalValue = { ...component.generalValue, supportEmail: 'invalid-email' };
    expect(component.valid).toBe(false);
  });

  it('requires an alert delivery channel and recipient', async () => {
    const component = await createComponent();
    component.active = 'alerts';
    expect(component.valid).toBe(true);
    component.alertValue = { ...component.alertValue, inAppEnabled: false, websocketEnabled: false, smsEnabled: false };
    expect(component.valid).toBe(false);
  });

  it('requires at least one notification channel', async () => {
    const component = await createComponent();
    component.active = 'notifications';
    expect(component.valid).toBe(true);
    component.notificationValue = { ...component.notificationValue, inAppEnabled: false, websocketEnabled: false, smsEnabled: false };
    expect(component.valid).toBe(false);
  });

  it('requires retention summaries to outlive raw telemetry', async () => {
    const component = await createComponent();
    component.active = 'retention';
    expect(component.valid).toBe(true);
    component.retentionValue = { ...component.retentionValue, hourlySummaryDays: 30 };
    expect(component.valid).toBe(false);
  });
});
