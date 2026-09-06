import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { AuthService } from "./auth.service";
import { ManagementAccessService } from "./management-access.service";
import { authInterceptor } from "../interceptors/auth.interceptor";
import { HttpClient } from "@angular/common/http";
import { provideRouter } from "@angular/router";
describe("Authentication merge regression", () => {
  let http: HttpTestingController;
  let auth: AuthService;
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });
  afterEach(() => {
    http.verify();
    sessionStorage.clear();
    localStorage.clear();
  });
  const response = {
    accessToken: "test-token",
    user: {
      id: "user-1",
      fullName: "Test admin",
      email: "test@example.com",
      role: "REGIONAL_ADMIN",
      provinces: ["Uva"],
      districts: ["Monaragala"],
    },
  };
  it("stores the token consistently and attaches it to API requests", () => {
    auth
      .login({ email: "test@example.com", password: "test", rememberMe: false })
      .subscribe();
    http.expectOne("/api/auth/login").flush(response);
    expect(auth.getAccessToken()).toBe("test-token");
    expect(localStorage.getItem("auth_access_token")).toBeNull();
    TestBed.inject(HttpClient).get("/api/fences").subscribe();
    const req = http.expectOne("/api/fences");
    expect(req.request.headers.get("Authorization")).toBe("Bearer test-token");
    req.flush([]);
  });
  it("persists remembered scope and removes persistent authentication on logout", () => {
    auth
      .login({ email: "test@example.com", password: "test", rememberMe: true })
      .subscribe();
    http.expectOne("/api/auth/login").flush(response);
    expect(
      JSON.parse(localStorage.getItem("auth_user_session")!).provinces,
    ).toEqual(["Uva"]);
    const restored = TestBed.runInInjectionContext(() => new AuthService());
    expect(TestBed.inject(ManagementAccessService).scope().role).toBe(
      "REGIONAL_ADMIN",
    );
    expect(restored.isAuthenticated()).toBe(true);
    auth.clearSessionLocally();
    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem("auth_user_session")).toBeNull();
  });
});
