import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldCountryStatePickerComponent } from './field-country-state-picker.component';

describe('FieldCountryStatePickerComponent', () => {
  let component: FieldCountryStatePickerComponent;
  let fixture: ComponentFixture<FieldCountryStatePickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FieldCountryStatePickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldCountryStatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
