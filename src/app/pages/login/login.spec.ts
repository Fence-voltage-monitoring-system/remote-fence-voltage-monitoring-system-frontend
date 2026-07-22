import { ComponentFixture, TestBed } from "@angular/core/testing";

import { Login } from "./login";

describe("Login", () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
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
});
