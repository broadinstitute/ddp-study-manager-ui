import {Component, Input, OnInit} from "@angular/core";

@Component( {
  selector: "app-field-country-state-picker",
  templateUrl: "./field-country-state-picker.component.html",
  styleUrls: [ "./field-country-state-picker.component.css" ]
} )
export class FieldCountryStatePickerComponent implements OnInit {
  @Input() coutnryLabel: string;
  @Input() stateLabel: string;
  @Input() selectedCountry: string;
  constructor() {
  }

  ngOnInit() {
    console.log(this.coutnryLabel);
    console.log(this.selectedCountry);
    console.log(this.stateLabel);
  }

}
