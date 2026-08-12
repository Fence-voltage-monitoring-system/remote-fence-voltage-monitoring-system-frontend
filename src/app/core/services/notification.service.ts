import{HttpClient,HttpParams}from'@angular/common/http';import{inject,Injectable}from'@angular/core';import{BehaviorSubject,Observable}from'rxjs';import{tap}from'rxjs/operators';import{NotificationPage,NotificationQuery,NotificationStats,SystemNotification}from'../../pages/notifications/notifications.models';

@Injectable({providedIn:'root'})
export class NotificationService{
	private readonly http=inject(HttpClient);
	private readonly endpoint='/api/notifications';
	private readonly statsSubject = new BehaviorSubject<NotificationStats>({ inApp: 0, websocket: 0, smsDelivered: 0, unread: 0 });
	readonly stats$ = this.statsSubject.asObservable();

	getNotifications(query:NotificationQuery):Observable<NotificationPage>{let params=new HttpParams().set('page',query.page).set('pageSize',query.pageSize);if(query.filter!=='ALL')params=params.set(query.filter==='UNREAD'?'read':'category',query.filter==='UNREAD'?'false':query.filter);return this.http.get<NotificationPage>(this.endpoint,{params,withCredentials:true});}

	getStats():Observable<NotificationStats>{return this.http.get<NotificationStats>(`${this.endpoint}/stats`,{withCredentials:true}).pipe(tap(stats=>this.statsSubject.next(stats)));}

	updateStats(stats: NotificationStats): void { this.statsSubject.next(stats); }

	markRead(id:number):Observable<SystemNotification>{return this.http.patch<SystemNotification>(`${this.endpoint}/${id}/read`,{},{withCredentials:true});}

	markAllRead():Observable<{updated:number}>{return this.http.patch<{updated:number}>(`${this.endpoint}/read-all`,{},{withCredentials:true});}

	clearRead():Observable<{deleted:number}>{return this.http.delete<{deleted:number}>(`${this.endpoint}/read`,{withCredentials:true});}

	connectLive():Observable<SystemNotification>{return new Observable(subscriber=>{const protocol=location.protocol==='https:'?'wss:':'ws:';const socket=new WebSocket(`${protocol}//${location.host}/api/notifications/ws`);socket.onmessage=event=>{try{subscriber.next(JSON.parse(event.data)as SystemNotification)}catch{subscriber.error(new Error('Invalid notification message.'))}};socket.onerror=()=>subscriber.error(new Error('Live connection failed.'));socket.onclose=()=>subscriber.complete();return()=>socket.close();});}
}
