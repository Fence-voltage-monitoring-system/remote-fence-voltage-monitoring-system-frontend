export type AlertSeverity='CRITICAL'|'WARNING';
export type AlertStatus='UNACKNOWLEDGED'|'ACKNOWLEDGED'|'UNDER_MAINTENANCE'|'RESOLVED';
export interface AlertRecord{id:number;code:string;title:string;type:string;severity:AlertSeverity;province:string;district:string;fence:string;section:string;value:string;threshold:string;detected:string;status:AlertStatus;assignee:string;device:string;comments:string[];}
export interface AlertFilters{severity:string;province:string;fence:string;type:string;status:string;date:string;}
export interface AlertStats{activeCritical:number;activeWarnings:number;unacknowledged:number;underMaintenance:number;resolvedToday:number;}
export interface AlertPage{items:AlertRecord[];page:number;pageSize:number;totalItems:number;totalPages:number;}
