import { TestBed, inject } from '@angular/core/testing';

import { StackdriverErrorReporterService } from './stackdriver-error-reporter.service';

describe('StackdriverErrorReporterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StackdriverErrorReporterService]
    });
  });

  it('should be created', inject([StackdriverErrorReporterService], (service: StackdriverErrorReporterService) => {
    expect(service).toBeTruthy();
  }));
});
