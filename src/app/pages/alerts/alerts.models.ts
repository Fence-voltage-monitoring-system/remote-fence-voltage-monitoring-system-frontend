export type AlertSeverity='CRITICAL'|'WARNING';
export type AlertStatus='UNACKNOWLEDGED'|'ACKNOWLEDGED'|'ASSIGNED'|'IN_PROGRESS'|'UNDER_MAINTENANCE'|'RESOLVED';
export type AssignmentStatus='UNASSIGNED'|'AWAITING_ACCEPTANCE'|'ACCEPTED'|'DECLINED'|'ESCALATED'|'REASSIGNED'|'COMPLETED';
export type AssignmentSource='AUTO_PRIMARY'|'ADMIN_ASSIGNMENT'|'BACKUP_CLAIM'|'NONE';
export type AlertEventType='ALERT_CREATED'|'NOTIFICATION_SENT'|'ACKNOWLEDGED'|'AUTO_ASSIGNED'|'ASSIGNMENT_ACCEPTED'|'ASSIGNMENT_DECLINED'|'REASSIGNED'|'ESCALATED'|'WORK_STARTED'|'COMMENT_ADDED'|'WORK_COMPLETED'|'RECOVERY_READING'|'AUTO_RESOLVED'|'MANUALLY_RESOLVED';
export interface MaintenanceStaffOption{id:number;name:string;email:string;responsibility:'PRIMARY'|'BACKUP'|'DISTRICT';available:boolean;}
export interface AlertEvent{id:number;type:AlertEventType;label:string;timestamp:string;actor?:string;details?:string;}
export interface AlertRecord{
  id:number;code:string;title:string;type:string;severity:AlertSeverity;province:string;district:string;
  fence:string;section:string;value:string;threshold:string;detected:string;status:AlertStatus;
  assignee:string;assigneeId?:number|null;assignmentStatus?:AssignmentStatus;assignmentSource?:AssignmentSource;
  assignedAt?:string;acceptanceDeadline?:string;backupUsers?:MaintenanceStaffOption[];
  eligibleMaintenanceStaff?:MaintenanceStaffOption[];device:string;comments:string[];timeline?:AlertEvent[];
  acknowledgedBy?:string;acknowledgedAt?:string;resolutionType?:'AUTO_RECOVERY'|'MANUAL'|null;
  healthyReadingsReceived?:number;healthyReadingsRequired?:number;
}
export interface AlertFilters{severity:string;province:string;fence:string;type:string;status:string;date:string;}
export interface AlertStats{activeCritical:number;activeWarnings:number;unacknowledged:number;underMaintenance:number;resolvedToday:number;}
export interface AlertPage{items:AlertRecord[];page:number;pageSize:number;totalItems:number;totalPages:number;}
export interface ReassignAlertRequest{staffId:number;reason:string;}
export interface DeclineAssignmentRequest{reason:string;}
export interface CompleteWorkRequest{summary:string;cause:string;actions:string;}
