import {
  Component,
  ChangeDetectorRef,
  Optional,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FenceOption } from "../../section-management.models";

export interface BulkSectionRow {
  startLatitude: number | null;
  startLongitude: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
  lengthKm: number | null;
  installationDate: string;
  notes: string;
}
@Component({
  selector: "app-section-bulk-add-modal",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./section-bulk-add-modal.html",
  styleUrl: "./section-bulk-add-modal.css",
})
export class SectionBulkAddModal {
  constructor(@Optional() private readonly cdr: ChangeDetectorRef | null = null) {}
  @Input() fences: FenceOption[] = [];
  @Input() selectedFenceCode = "";
  @Output() closed = new EventEmitter<void>();
  @Output() imported = new EventEmitter<{
    fenceCode: string;
    rows: BulkSectionRow[];
  }>();
  @Input() saving = false;
  @Input() error = "";
  fenceCode = "";
  rows: BulkSectionRow[] = [];
  fileError = "";
  isClosing = false;
  ngOnInit() {
    this.fenceCode = this.selectedFenceCode || this.fences[0]?.code || "";
    this.addRow();
  }
  @HostListener("document:keydown.escape") escape() {
    this.close();
  }
  addRow() {
    const previous = this.rows.at(-1);
    this.rows.push({
      startLatitude: previous?.endLatitude ?? null,
      startLongitude: previous?.endLongitude ?? null,
      endLatitude: null,
      endLongitude: null,
      lengthKm: null,
      installationDate: "",
      notes: "",
    });
  }
  removeRow(index: number) {
    this.rows.splice(index, 1);
    if (!this.rows.length) this.addRow();
  }
  rowErrors(row: BulkSectionRow, index: number): string[] {
    const errors: string[] = [];
    if (!this.validLat(row.startLatitude) || !this.validLat(row.endLatitude))
      errors.push("Invalid latitude");
    if (!this.validLng(row.startLongitude) || !this.validLng(row.endLongitude))
      errors.push("Invalid longitude");
    if (
      row.lengthKm === null ||
      !Number.isFinite(row.lengthKm) ||
      row.lengthKm <= 0
    )
      errors.push("Invalid length");
    const previous = this.rows[index - 1];
    if (
      (previous && previous.endLatitude !== row.startLatitude) ||
      (previous && previous.endLongitude !== row.startLongitude)
    )
      errors.push("Not connected to previous section");
    return errors;
  }
  get validCount() {
    return this.rows.filter((row, index) => !this.rowErrors(row, index).length)
      .length;
  }
  get canSubmit() {
    return (
      !!this.fenceCode &&
      this.rows.length > 0 &&
      this.validCount === this.rows.length
    );
  }
  readCsv(event: Event) {
    const input = event.target as HTMLInputElement,
      file = input.files?.[0];
    if (!file) return;
    this.fileError = "";
    const reader = new FileReader();
    reader.onload = () => {
      this.parseCsv(String(reader.result ?? ""));
      this.cdr?.markForCheck();
    };
    reader.onerror = () => {
      this.fileError = "Unable to read the selected file.";
      this.cdr?.markForCheck();
    };
    reader.readAsText(file);
    input.value = "";
  }
  parseCsv(csv: string) {
    this.fileError = "";
    const lines = csv.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      this.fileError =
        "The CSV must include a header and at least one section.";
      return;
    }
    if (
      lines[0]
        .split(",")
        .map((v) => v.trim())
        .join(",") !==
      "startLatitude,startLongitude,endLatitude,endLongitude,lengthKm"
    ) {
      this.fileError = "CSV headers must match the listed column order.";
      return;
    }
    const parsed: BulkSectionRow[] = [];
    for (const line of lines.slice(1)) {
      const c = line.split(",").map((value) => value.trim());
      if (c.length !== 5) {
        this.fileError = "Each CSV row must contain exactly 5 columns.";
        return;
      }
      parsed.push({
        startLatitude: c[0] === "" ? null : Number(c[0]),
        startLongitude: c[1] === "" ? null : Number(c[1]),
        endLatitude: c[2] === "" ? null : Number(c[2]),
        endLongitude: c[3] === "" ? null : Number(c[3]),
        lengthKm: c[4] === "" ? null : Number(c[4]),
        installationDate: "",
        notes: "",
      });
    }
    this.rows = parsed;
  }
  submit() {
    if (this.saving) return;
    if (!this.canSubmit) return;
    this.imported.emit({ fenceCode: this.fenceCode, rows: this.rows });
  }
  close() {
    if (this.saving) return;
    this.leave(() => this.closed.emit());
  }
  private validLat(v: number | null) {
    return v !== null && Number.isFinite(v) && v >= -90 && v <= 90;
  }
  private validLng(v: number | null) {
    return v !== null && Number.isFinite(v) && v >= -180 && v <= 180;
  }
  private leave(done: () => void) {
    if (this.isClosing) return;
    this.isClosing = true;
    window.setTimeout(done, 280);
  }
}
