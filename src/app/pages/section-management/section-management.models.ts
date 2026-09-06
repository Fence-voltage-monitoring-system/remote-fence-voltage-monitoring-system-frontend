export type SectionStatus = "HEALTHY" | "WARNING" | "CRITICAL" | "OFFLINE";
export interface FenceOption {
  id: number;
  code: string;
  name: string;
  province: string;
  district: string;
  totalSections: number;
  totalLengthKm: number;
  operational: number;
  averageVoltageKv: number | null;
}
export interface FenceSection {
  id: number;
  fenceCode: string;
  code: string;
  startGps: string;
  endGps: string;
  lengthKm: number;
  device: string | null;
  voltageKv: number | null;
  battery: number | null;
  maintenance: string;
  status: SectionStatus;
  updated: string;
}
