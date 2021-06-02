import { TestBed, inject } from '@angular/core/testing';

import { HeatmaptooltipserviceService } from './heatmaptooltipservice.service';

describe('HeatmaptooltipserviceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HeatmaptooltipserviceService]
    });
  });

  it('should be created', inject([HeatmaptooltipserviceService], (service: HeatmaptooltipserviceService) => {
    expect(service).toBeTruthy();
  }));
});
