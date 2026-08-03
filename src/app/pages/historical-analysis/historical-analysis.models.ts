export type AnalysisPeriod='1h'|'24h'|'7d'|'30d'|'custom';
export interface AnalysisFilters{province:string;district:string;fence:string;section:string;device:string;period:AnalysisPeriod;startDate?:string;endDate?:string;}
export interface AnalysisMetric{label:string;value:string;unit?:string;tone:'green'|'amber'|'red'|'neutral';}
export interface HistoricalChartData {
  voltage: number[];
  battery: number[];
  voltageDrop: number[];
  alerts: number[];
  labels: string[];
}
