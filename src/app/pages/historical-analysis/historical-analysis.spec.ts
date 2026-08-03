import { TestBed } from '@angular/core/testing';
import { HistoricalAnalysis } from './historical-analysis';

describe('HistoricalAnalysis', () => {
  it('creates the historical dashboard', async () => {
    await TestBed.configureTestingModule({ imports: [HistoricalAnalysis] }).compileComponents();
    const fixture = TestBed.createComponent(HistoricalAnalysis);
    fixture.detectChanges();
    expect(fixture.componentInstance.metrics.length).toBe(6);
  });

  it('regenerates dummy chart data when filters change', async () => {
    await TestBed.configureTestingModule({ imports: [HistoricalAnalysis] }).compileComponents();
    const component = TestBed.createComponent(HistoricalAnalysis).componentInstance;
    const original = [...component.chartData.voltage];
    component.updateFilters({ ...component.filters, fence: 'EPF-MNR-A', period: '7d' });
    expect(component.chartData.voltage).not.toEqual(original);
    expect(component.chartData.voltage.length).toBe(28);
    expect(component.metrics.length).toBe(6);
  });
});
