import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HeatmapgraphComponent } from './heatmapgraph.component';

describe('HeatmapgraphComponent', () => {
  let component: HeatmapgraphComponent;
  let fixture: ComponentFixture<HeatmapgraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HeatmapgraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeatmapgraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
