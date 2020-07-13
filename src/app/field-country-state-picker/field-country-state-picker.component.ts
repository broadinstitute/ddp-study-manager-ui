import {Component, Input, OnInit} from "@angular/core";
import {StatePicker} from "../field-state-picker/StatePicker.model";

@Component( {
  selector: "app-field-country-state-picker",
  templateUrl: "./field-country-state-picker.component.html",
  styleUrls: [ "./field-country-state-picker.component.css" ]
} )
export class FieldCountryStatePickerComponent implements OnInit {


  @Input() country;


  constructor() {

  }

  ngOnInit() {
    console.log(this.country);

  }

  public valueChanged(event, c){
    this.country = c;
  }

}
