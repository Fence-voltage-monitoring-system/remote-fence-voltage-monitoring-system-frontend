import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { SystemHealth } from './system-health';

describe('SystemHealth', () => {
  async function createComponent(): Promise<SystemHealth> {
    await TestBed.configureTestingModule({ imports: [SystemHealth], providers: [provideHttpClient()] }).compileComponents();
    return TestBed.createComponent(SystemHealth).componentInstance;
  }

  it('formats uptime for the summary card', async () => {
    const component = await createComponent();
    expect(component.formatUptime(90000)).toBe('1d 1h');
  });

  it('opens and closes system event details', async () => {
    const component = await createComponent();
    component.openEvent(component.snapshot.events[0]);
    expect(component.selectedEvent?.id).toBe('EVT-901');
    component.closeEvent();
    expect(component.selectedEvent).toBeNull();
  });
});
