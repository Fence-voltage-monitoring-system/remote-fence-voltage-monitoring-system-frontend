import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";

import { AuthService } from "../../core/services/auth.service";
import { SystemIdentityService, DEFAULT_GENERAL_CONFIGURATION } from "../../core/services/system-identity.service";
import { Login } from "./login";

describe("Login", () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let identityService: SystemIdentityService;
  let mockAuthService: { login: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn().mockReturnValue(of({
        user: {
          id: "1",
          name: "Test User",
          email: "test@dwc.gov.lk",
          role: "operator",
        },
      })),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compileComponents();

    identityService = TestBed.inject(SystemIdentityService);
    identityService.apply({ ...DEFAULT_GENERAL_CONFIGURATION, maintenanceMode: false });

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render the secure login interface", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("main")).toBeTruthy();
    expect(compiled.querySelector("h2")?.textContent).toContain(
      "Secure System Access",
    );
  });

  it("should reject an empty form", () => {
    component.submitLogin();

    expect(component.loginForm.invalid).toBe(true);
    expect(component.emailControl.touched).toBe(true);
    expect(component.passwordControl.touched).toBe(true);
  });

  it("should toggle password visibility", () => {
    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBe(true);

    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBe(false);
  });

  it("should display maintenance banner when maintenance mode is active", async () => {
    identityService.apply({
      ...DEFAULT_GENERAL_CONFIGURATION,
      maintenanceMode: true,
      allowLoginDuringMaintenance: false,
      maintenanceMessage: "Scheduled server upgrades underway.",
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const maintenanceAlert = compiled.querySelector("aside[role='alert']");
    expect(maintenanceAlert).toBeTruthy();
    expect(maintenanceAlert?.textContent).toContain("SCHEDULED MAINTENANCE");
    expect(maintenanceAlert?.textContent).toContain("Scheduled server upgrades underway.");
    expect(maintenanceAlert?.textContent).toContain("Only Super Administrators may log in");
  });

  it("should surface custom maintenance error message returned from backend on 401/403", () => {
    mockAuthService.login.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 401,
      error: { message: "System is in maintenance mode. Non-admin logins restricted." },
    })));

    component.loginForm.setValue({
      email: "user@nerdc.lk",
      password: "password123",
      rememberMe: false,
    });

    component.submitLogin();

    expect(component.errorMessage).toBe("System is in maintenance mode. Non-admin logins restricted.");
  });
});
