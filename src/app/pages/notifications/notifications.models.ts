export type NotificationCategory='CRITICAL'|'WARNING'|'MAINTENANCE'|'SYSTEM';
export type DeliveryChannel='IN_APP'|'WEBSOCKET'|'SMS';
export interface SystemNotification{id:number;code:string;title:string;message:string;category:NotificationCategory;province?:string;district?:string;fence:string;section:string;time:string;read:boolean;channels:DeliveryChannel[];relatedAlert?:string;}
export type NotificationFilter='ALL'|NotificationCategory|'UNREAD';
export interface NotificationStats{inApp:number;websocket:number;smsDelivered:number;unread:number;}
export interface NotificationPage{items:SystemNotification[];page:number;pageSize:number;totalItems:number;totalPages:number;}
export interface NotificationQuery{filter:NotificationFilter;page:number;pageSize:number;}
