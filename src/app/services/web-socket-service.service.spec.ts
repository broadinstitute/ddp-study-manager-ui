import { TestBed, inject } from '@angular/core/testing';

import { WebSocketService } from './web-socket-service.service';

describe('WebSocketServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebSocketService]
    });
  });

  it('should be created', inject([WebSocketService], (service: WebSocketService) => {
    expect(service).toBeTruthy();
  }));
});
