import {Component, EventEmitter, Input, Output} from "@angular/core";
import {TypeaheadMatch} from "ngx-bootstrap/typeahead";

@Component( {
  selector: "app-field-typeahead",
  templateUrl: "./field-typeahead.component.html",
  styleUrls: [ "./field-typeahead.component.css" ]
} )
export class FieldTypeaheadComponent {

  @Input() dataSource: string[];
  @Input() drug: string;
  @Input() disabled: boolean;
  @Input() fieldName: string;
  @Output() drugSelected = new EventEmitter();

  selectDrug( e: TypeaheadMatch | Event ): void {
    this.drugSelected.emit( this.drug );
  }
}
