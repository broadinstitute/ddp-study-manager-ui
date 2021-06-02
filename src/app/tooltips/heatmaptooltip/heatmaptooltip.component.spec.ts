import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HeatmaptooltipComponent } from './heatmaptooltip.component';

describe('HeatmaptooltipComponent', () => {
  let component: HeatmaptooltipComponent;
  let fixture: ComponentFixture<HeatmaptooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HeatmaptooltipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeatmaptooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
