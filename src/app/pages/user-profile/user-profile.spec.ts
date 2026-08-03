import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfilePage } from './user-profile';
describe('UserProfilePage', () => { let fixture: ComponentFixture<UserProfilePage>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [UserProfilePage], providers: [{ provide: UserService, useValue: { getCurrentProfile: vi.fn().mockReturnValue(of()), getNotificationPreferences:vi.fn().mockReturnValue(of()) } }, { provide: AuthService, useValue: { signOutOtherSessions: vi.fn() } }] }).compileComponents(); fixture = TestBed.createComponent(UserProfilePage); fixture.detectChanges(); }); it('should create', () => expect(fixture.componentInstance).toBeTruthy()); it('should render the profile heading', () => expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('User Profile')); });
