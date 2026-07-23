import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FenceManagement } from './fence-management';

describe('FenceManagement', () => {
  let fixture: ComponentFixture<FenceManagement>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [FenceManagement] }).compileComponents(); fixture = TestBed.createComponent(FenceManagement); fixture.detectChanges(); });
  it('creates and displays all demo fences', () => { expect(fixture.componentInstance).toBeTruthy(); expect(fixture.componentInstance.filteredFences.length).toBe(5); });
  it('filters fences by health', () => { fixture.componentInstance.filters = { ...fixture.componentInstance.filters, health:'HEALTHY' }; expect(fixture.componentInstance.filteredFences.length).toBe(2); });
});
