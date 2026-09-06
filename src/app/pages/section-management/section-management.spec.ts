import { TestBed, ComponentFixture } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { SectionManagement } from "./section-management";
import { SectionEditModal } from "./components/section-edit-modal/section-edit-modal";
import { SectionBulkAddModal } from "./components/section-bulk-add-modal/section-bulk-add-modal";
describe("SectionManagement API integration", () => {
  let fixture: ComponentFixture<SectionManagement>;
  let http: HttpTestingController;
  const fence = {
    id: 42,
    code: "F-42",
    name: "Test fence",
    province: "Uva",
    district: "Monaragala",
    lengthKm: 2,
    sections: 1,
    health: "OFFLINE",
    averageVoltageKv: null,
  };
  const section = {
    id: 7,
    fenceId: 42,
    code: "SEC-001",
    startGps: "6, 81",
    endGps: "7, 81",
    lengthKm: 2,
    voltageKv: null,
    battery: null,
    status: "OFFLINE",
    updatedAt: null,
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionManagement],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SectionManagement);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());
  function load() {
    http.expectOne("/api/fences").flush([fence]);
    const req = http.expectOne("/api/sections?fenceId=42");
    expect(req.request.method).toBe("GET");
    req.flush([section]);
    fixture.detectChanges();
  }
  it("loads by database fence ID and renders unknown telemetry without inventing readings", () => {
    load();
    expect(fixture.componentInstance.filteredSections.length).toBe(1);
    expect(
      fixture.componentInstance.selectedFence?.averageVoltageKv,
    ).toBeNull();
    expect(fixture.nativeElement.textContent).toContain("SEC-001");
  });
  it("handles an empty fence list", () => {
    http.expectOne("/api/fences").flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("No fences available");
    http.expectNone((r) => r.url === "/api/sections");
  });
  it("keeps the registration open on failure and reloads after a successful retry", () => {
    load();
    const page = fixture.componentInstance;
    page.openRegistration();
    const value = {
      fenceCode: "F-42",
      sectionCode: "SEC-002",
      startLatitude: 7,
      startLongitude: 81,
      endLatitude: 8,
      endLongitude: 81,
      lengthKm: 1,
      installationDate: "",
      maintenanceNotes: "",
    };
    page.registerSection(value);
    let req = http.expectOne("/api/sections");
    expect(req.request.body).toEqual({
      fenceId: 42,
      code: "SEC-002",
      startGps: "7, 81",
      endGps: "8, 81",
      lengthKm: 1,
    });
    req.flush(
      { message: "Duplicate section code" },
      { status: 400, statusText: "Bad Request" },
    );
    expect(page.isRegistrationOpen).toBe(true);
    expect(page.isSaving).toBe(false);
    expect(page.error).toContain("Duplicate");
    page.registerSection(value);
    req = http.expectOne("/api/sections");
    req.flush({ ...section, id: 8, code: "SEC-002" });
    http
      .expectOne("/api/sections?fenceId=42")
      .flush([section, { ...section, id: 8, code: "SEC-002" }]);
    expect(page.isRegistrationOpen).toBe(false);
    expect(page.sections.length).toBe(2);
  });
  it("deletes only after confirmation and does not mutate the section ID", () => {
    load();
    const page = fixture.componentInstance;
    page.editSection(page.sections[0]);
    const modal = new SectionEditModal();
    modal.section = page.sections[0];
    modal.deleted.subscribe((value) => page.deleteSection(value));
    modal.requestDelete();
    http.expectNone((r) => r.method === "DELETE");
    modal.requestDelete();
    expect(modal.section.id).toBe(7);
    http.expectOne("/api/sections/7").flush(null);
    http.expectOne("/api/sections?fenceId=42").flush([]);
    expect(page.sections).toEqual([]);
  });
  it("cancels stale section loads when a different fence is selected", () => {
    http
      .expectOne("/api/fences")
      .flush([fence, { ...fence, id: 43, code: "F-43" }]);
    const old = http.expectOne("/api/sections?fenceId=42");
    fixture.componentInstance.selectFence("F-43");
    expect(old.cancelled).toBe(true);
    http.expectOne("/api/sections?fenceId=43").flush([]);
    expect(fixture.componentInstance.selectedFence?.id).toBe(43);
  });
  it("sends bulk imports to the backend", () => {
    load();
    const page = fixture.componentInstance;
    page.openBulkAdd();
    const value = {
      fenceCode: "F-42",
      rows: [
        {
          startLatitude: 7,
          startLongitude: 81,
          endLatitude: 8,
          endLongitude: 81,
          lengthKm: 1,
          installationDate: "",
          notes: "",
        },
      ],
    };
    page.importSections(value);
    const req = http.expectOne("/api/sections/bulk");
    expect(req.request.method).toBe("POST");
    expect(req.request.body.fenceCode).toBe("F-42");
    req.flush([section]);
    http.expectOne("/api/sections?fenceId=42").flush([section]);
    expect(page.isBulkAddOpen).toBe(false);
  });
});
describe("Section CSV validation", () => {
  it("rejects blank coordinates instead of converting them to zero", () => {
    const modal = new SectionBulkAddModal();
    modal.fenceCode = "F-42";
    modal.parseCsv(
      "startLatitude,startLongitude,endLatitude,endLongitude,lengthKm\n,81,7,81,1",
    );
    expect(modal.rows[0].startLatitude).toBeNull();
    expect(modal.canSubmit).toBe(false);
  });
  it("rejects a different column order", () => {
    const modal = new SectionBulkAddModal();
    modal.parseCsv(
      "lengthKm,startLatitude,startLongitude,endLatitude,endLongitude\n1,6,81,7,81",
    );
    expect(modal.fileError).toContain("column order");
  });
});
