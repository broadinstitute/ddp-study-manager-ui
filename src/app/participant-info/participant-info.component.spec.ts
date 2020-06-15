import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantInfoComponent } from './participant-info.component';

describe('ParticipantInfoComponent', () => {
  let component: ParticipantInfoComponent;
  let fixture: ComponentFixture<ParticipantInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
