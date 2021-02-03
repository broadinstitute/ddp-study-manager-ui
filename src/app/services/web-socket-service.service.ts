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

  setupSocketConnection(url: string) {
    this.socket = new WebSocket(this.baseUrl + url);
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
