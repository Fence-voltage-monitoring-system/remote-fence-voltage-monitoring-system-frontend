import { TestBed, ComponentFixture } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { FenceManagement } from "./fence-management";
import { FenceRegistrationDrawer } from "./components/fence-registration-drawer/fence-registration-drawer";
import { FenceEditDrawer } from "./components/fence-edit-drawer/fence-edit-drawer";
describe("FenceManagement API integration", () => {
  let fixture: ComponentFixture<FenceManagement>;
  let http: HttpTestingController;
  const fence = {
    id: 42,
    code: "F-42",
    name: "Test fence",
    provinceId: 90,
    districtId: 901,
    province: "Uva",
    district: "Monaragala",
    lengthKm: 2,
    sections: 0,
    health: "OFFLINE" as const,
    averageVoltageKv: null,
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FenceManagement],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FenceManagement);
    fixture.detectChanges();
    http.expectOne("/api/fences").flush([fence]);
    http.expectOne("/api/locations/provinces").flush([{ id: 90, name: "Uva" }]);
    http
      .expectOne("/api/locations/districts")
      .flush([{ id: 901, name: "Monaragala", provinceId: 90 }]);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());
  it("opens the registration form with real location options", () => {
    fixture.componentInstance.openRegistration();
    fixture.detectChanges();
    http.expectOne('/api/fences/maintenance-candidates?provinceId=90&districtId=901').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#fence-province').value).toBe('Uva');
    expect(fixture.nativeElement.querySelector('#fence-district').value).toBe('Monaragala');
  });
  it("uses database location IDs when registering a fence", () => {
    const drawer = new FenceRegistrationDrawer();
    drawer.locations = fixture.componentInstance.locations;
    drawer.ngOnInit();
    drawer.form.patchValue({ name: "New fence", code: "F-NEW", lengthKm: 1 });
    drawer.registered.subscribe((value) => {
      expect(value.provinceId).toBe(90);
      expect(value.districtId).toBe(901);
    });
    drawer.submit();
    expect(drawer.form.valid).toBe(true);
  });
  it("sends an empty maintenance team when existing assignments are cleared", () => {
    const page = fixture.componentInstance;
    page.saveFence({
      ...fence,
      installationDate: "",
      gateway: "",
      startGps: "",
      endGps: "",
      description: "",
      primaryMaintenanceUserId: null,
      backupMaintenanceUserIds: [],
    });
    http.expectOne("/api/fences/42").flush(fence);
    const req = http.expectOne("/api/fences/42/maintenance-team");
    expect(req.request.body).toEqual({
      primaryMaintenanceUserId: null,
      backupMaintenanceUserIds: [],
    });
    req.flush(fence);
    expect(page.isSaving).toBe(false);
  });
  it("retains the registration form when saving fails", () => {
    const page = fixture.componentInstance;
    page.openRegistration();
    page.registerFence({
      ...fence,
      installationDate: "",
      gateway: "",
      startGps: "",
      endGps: "",
      description: "",
      primaryMaintenanceUserId: null,
      backupMaintenanceUserIds: [],
    });
    http
      .expectOne("/api/fences")
      .flush(
        { message: "Code already exists" },
        { status: 400, statusText: "Bad Request" },
      );
    expect(page.isRegistrationOpen).toBe(true);
    expect(page.error).toBe("Code already exists");
    expect(page.isSaving).toBe(false);
  });
  it("edits actual fields without requiring fabricated GPS or installation dates", () => {
    const drawer = new FenceEditDrawer();
    drawer.fence = fence;
    drawer.locations = fixture.componentInstance.locations;
    drawer.ngOnInit();
    expect(drawer.form.valid).toBe(true);
    expect(drawer.form.controls.startGps.disabled).toBe(true);
  });
});
