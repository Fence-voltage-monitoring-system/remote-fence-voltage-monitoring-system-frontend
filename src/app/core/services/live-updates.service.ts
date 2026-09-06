import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, retry, switchMap, timer } from 'rxjs';
@Injectable({providedIn:'root'})
export class LiveUpdatesService {
  private readonly http=inject(HttpClient);
  connect<T>(channel:'alerts'|'notifications'):Observable<T>{
    return this.http.post<{ticket:string}>(`/api/live/tickets/${channel}`,{}).pipe(
      switchMap(({ticket})=>new Observable<T>(subscriber=>{
        const protocol=location.protocol==='https:'?'wss:':'ws:';
        const socket=new WebSocket(`${protocol}//${location.host}/api/${channel}/ws?ticket=${encodeURIComponent(ticket)}`);
        socket.onmessage=event=>{try{subscriber.next(JSON.parse(event.data) as T);}catch{subscriber.error(new Error('Invalid live message.'));}};
        socket.onerror=()=>subscriber.error(new Error('Live connection unavailable.'));
        socket.onclose=()=>subscriber.error(new Error('Live connection closed.'));
        return()=>{socket.onclose=null;socket.onerror=null;socket.close();};
      })),
      retry({delay:(_error,count)=>timer(Math.min(30000,count*3000))})
    );
  }
}

