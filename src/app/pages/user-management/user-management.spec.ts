import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { UserManagement } from './user-management';

describe('UserManagement', () => {
  let component: UserManagement;
  let fixture: ComponentFixture<UserManagement>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserManagement],
      providers: [{
        provide: UserService,
        useValue: {
          getUsers: vi.fn().mockReturnValue(of([{ id: 2, initials: 'KP', name: 'Kasun Perera', email: 'kperera@dwc.gov.lk', role: 'REGIONAL_ADMIN', province: 'Uva', district: '—', status: 'ACTIVE', lastLogin: '2025-07-14 07:45', created: '2023-03-22', recentActivity: [] }])),
        },
      }],
    }).compileComponents();
    fixture = TestBed.createComponent(UserManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => expect(component).toBeTruthy());
  it('should filter users by search', () => { component.filters = { ...component.filters, search: 'Kasun' }; expect(component.filteredUsers.map((user) => user.name)).toEqual(['Kasun Perera']); });
});
