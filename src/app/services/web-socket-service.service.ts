import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

declare var DDP_ENV: any;

@Injectable()
export class WebSocketService{

  private static WEBSOCKET: string = "ui/websocket/";

  private baseUrl = DDP_ENV.baseWebSocketUrl;

  socket: any;

  constructor() { 
  }

  setupSocketConnection(path: string, params: any) {
    let url = new URL(this.baseUrl + WebSocketService.WEBSOCKET + path);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    this.socket = new WebSocket(url.toString());
  }

  sendMessage(json: any) {
    this.socket.send(JSON.stringify(json));
  }

  onListen() {
    return new Observable(subscriber => {
      this.socket.onmessage = function(event) {
        subscriber.next(JSON.parse(event.data));
      };
    })
  }



}
