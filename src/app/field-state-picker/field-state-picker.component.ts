import {Component, Input, OnInit} from "@angular/core";
import {StatePicker} from "./StatePicker.model";

@Component({
  selector: 'app-field-state-picker',
  templateUrl: './field-state-picker.component.html',
  styleUrls: ['./field-state-picker.component.css']
})
export class FieldStatePickerComponent implements OnInit {
  @Input() selectedCountry:string;
  @Input() selectedState:string;

  statePicker: StatePicker;
  constructor() {
    this.statePicker = new StatePicker(this.selectedCountry, this.selectedState, null);
  }

  ngOnInit() {
    console.log(this.selectedState);
    console.log(this.selectedCountry);

    this.statePicker = new StatePicker(this.selectedCountry, this.selectedState, null);
    console.log(this.statePicker.states);
  }

}
