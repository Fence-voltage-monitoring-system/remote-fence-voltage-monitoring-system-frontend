import { TestBed } from '@angular/core/testing';

import { MapSettings } from '../../configuration.models';
import { MapSettingsEditor } from './map-settings-editor';

describe('MapSettingsEditor', () => {
  const value: MapSettings = {
    defaultLatitude:7.8731,defaultLongitude:80.7718,defaultZoom:7,healthyColor:'#43d36c',warningColor:'#ffb800',criticalColor:'#ff4136',offlineColor:'#7f8b80',unassignedColor:'#a0aaa0',showGateways:true,showMonitoringDevices:true,showActiveAlerts:true,showMaintenanceWork:true,liveUpdatesEnabled:true,highlightRecentChanges:true,focusCriticalAlerts:true,showStaleDataWarning:true,showOfflineIndicators:true,showProvinceBoundaries:false,showDistrictBoundaries:true,showFenceCoverage:true,showAlertOverlay:true
  };

  it('disables live-dependent behaviour with WebSockets', async () => {
    await TestBed.configureTestingModule({ imports: [MapSettingsEditor] }).compileComponents();
    const component = TestBed.createComponent(MapSettingsEditor).componentInstance;
    component.value = value;
    let result: MapSettings | undefined;
    component.valueChange.subscribe(next => result = next);
    component.update('liveUpdatesEnabled', false);
    expect(result?.highlightRecentChanges).toBe(false);
    expect(result?.focusCriticalAlerts).toBe(false);
  });

  it('normalizes saved colours', async () => {
    await TestBed.configureTestingModule({ imports: [MapSettingsEditor] }).compileComponents();
    const component = TestBed.createComponent(MapSettingsEditor).componentInstance;
    component.value = value;
    let result: MapSettings | undefined;
    component.valueChange.subscribe(next => result = next);
    component.updateColor('healthyColor', '#AABBCC');
    expect(result?.healthyColor).toBe('#aabbcc');
  });
});
