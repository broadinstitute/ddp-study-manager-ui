import { Injectable, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { io } from 'socket.io-client';


declare var DDP_ENV: any;

@Injectable()
export class WebSocketService{

  private baseUrl = DDP_ENV.baseWebSocketUrl;

  socket: any;

  constructor() { 
  }

  setupSocketConnection(path: string, params: any) {
    let url = new URL(this.baseUrl + path);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    debugger
    this.socket = new WebSocket(url.toString());
  }

  sendMessage(json: any) {
    this.socket.send(JSON.stringify(json));
  }

  onListen() {
    return new Observable(subscriber => {
      this.socket.onmessage = function(event) {
        subscriber.next(JSON.parse(event.data));
      }
    })
  }



}
