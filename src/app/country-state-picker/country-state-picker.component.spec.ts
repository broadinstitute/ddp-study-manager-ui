import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CountryStatePickerComponent } from './country-state-picker.component';

describe('CountryStatePickerComponent', () => {
  let component: CountryStatePickerComponent;
  let fixture: ComponentFixture<CountryStatePickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CountryStatePickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CountryStatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
