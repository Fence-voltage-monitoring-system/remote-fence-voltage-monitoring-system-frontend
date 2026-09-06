import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SectionStatus } from "../../pages/section-management/section-management.models";
export interface SectionResponse {
  id: number;
  fenceId: number;
  code: string;
  startGps: string | null;
  endGps: string | null;
  lengthKm: number;
  voltageKv: number | null;
  battery: number | null;
  status: SectionStatus | null;
  updatedAt: string | null;
}
export interface SectionCreateRequest {
  fenceId: number;
  code: string;
  startGps: string;
  endGps: string;
  lengthKm: number;
}
export type SectionUpdateRequest = Omit<SectionCreateRequest, "fenceId">;
export interface SectionBulkRequest {
  fenceCode: string;
  rows: {
    startLatitude: number | null;
    startLongitude: number | null;
    endLatitude: number | null;
    endLongitude: number | null;
    lengthKm: number | null;
  }[];
}
@Injectable({ providedIn: "root" })
export class SectionService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = "/api/sections";
  private readonly options = { withCredentials: true } as const;
  getSectionsByFence(fenceId: number): Observable<SectionResponse[]> {
    return this.http.get<SectionResponse[]>(this.endpoint, {
      params: { fenceId },
      ...this.options,
    });
  }
  getById(id: number): Observable<SectionResponse> {
    return this.http.get<SectionResponse>(
      `${this.endpoint}/${id}`,
      this.options,
    );
  }
  create(value: SectionCreateRequest): Observable<SectionResponse> {
    return this.http.post<SectionResponse>(this.endpoint, value, this.options);
  }
  update(id: number, value: SectionUpdateRequest): Observable<SectionResponse> {
    return this.http.put<SectionResponse>(
      `${this.endpoint}/${id}`,
      value,
      this.options,
    );
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`, this.options);
  }
  bulkCreate(value: SectionBulkRequest): Observable<SectionResponse[]> {
    return this.http.post<SectionResponse[]>(
      `${this.endpoint}/bulk`,
      value,
      this.options,
    );
  }
}
