import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldStatePickerComponent } from './field-state-picker.component';

describe('FieldStatePickerComponent', () => {
  let component: FieldStatePickerComponent;
  let fixture: ComponentFixture<FieldStatePickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FieldStatePickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldStatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
