import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldTableComponent } from './field-table.component';

describe('FieldTableComponent', () => {
  let component: FieldTableComponent;
  let fixture: ComponentFixture<FieldTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FieldTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
