import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantUpdateResultDialogComponent } from './participant-update-result-dialog.component';

describe('ParticipantUpdateResultDialogComponent', () => {
  let component: ParticipantUpdateResultDialogComponent;
  let fixture: ComponentFixture<ParticipantUpdateResultDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantUpdateResultDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantUpdateResultDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
