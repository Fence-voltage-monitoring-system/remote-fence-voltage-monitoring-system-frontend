import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('Authentication error handling', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let auth: AuthService;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({providers: [
      provideRouter([]),
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
    ]});
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    auth = TestBed.inject(AuthService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    auth.login({email: 'test@example.com', password: 'test-password', rememberMe: false}).subscribe();
    http.expectOne('/api/auth/login').flush({
      accessToken: 'test-token',
      user: {id: 'test-user', fullName: 'Test User', email: 'test@example.com', role: 'REGIONAL_ADMIN'},
    });
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('keeps the session and reports a forbidden action to the caller', () => {
    let status = 0;
    client.get('/api/configuration').subscribe({error: error => status = error.status});
    http.expectOne('/api/configuration').flush({}, {status: 403, statusText: 'Forbidden'});
    expect(status).toBe(403);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.getAccessToken()).toBe('test-token');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('clears an unauthorized session and returns to login', () => {
    client.get('/api/fences').subscribe({error: () => {}});
    http.expectOne('/api/fences').flush({}, {status: 401, statusText: 'Unauthorized'});
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.getAccessToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('leaves a rejected login for the login form to handle', () => {
    client.post('/api/auth/login', {}).subscribe({error: () => {}});
    http.expectOne('/api/auth/login').flush({}, {status: 401, statusText: 'Unauthorized'});
    expect(navigate).not.toHaveBeenCalled();
  });
});
