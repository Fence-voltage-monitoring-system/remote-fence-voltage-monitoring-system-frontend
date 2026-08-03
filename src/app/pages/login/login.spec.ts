import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";

import { AuthService } from "../../core/services/auth.service";
import { Login } from "./login";

describe("Login", () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: vi.fn().mockReturnValue(of({
              user: {
                id: "1",
                name: "Test User",
                email: "test@dwc.gov.lk",
                role: "operator",
              },
            })),
          },
        },
      ],
    }).compileComponents();

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
    expect(component.usernameControl.touched).toBe(true);
    expect(component.passwordControl.touched).toBe(true);
  });

  it("should toggle password visibility", () => {
    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBe(true);

    component.togglePasswordVisibility();
    expect(component.passwordVisible).toBe(false);
  });
});
