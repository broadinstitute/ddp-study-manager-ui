import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomParticipantInfoComponent } from './custom-participant-info.component';

describe('CustomParticipantInfoComponent', () => {
  let component: CustomParticipantInfoComponent;
  let fixture: ComponentFixture<CustomParticipantInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomParticipantInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomParticipantInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
