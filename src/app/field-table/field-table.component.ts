import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from "@angular/core";
import {ModalComponent} from "../modal/modal.component";
import {Value} from "../utils/value.model";

@Component( {
  selector: 'app-field-table',
  templateUrl: './field-table.component.html',
  styleUrls: [ './field-table.component.css' ]
} )
export class FieldTableComponent implements OnInit, OnChanges {

  @ViewChild(ModalComponent)
  public universalModal: ModalComponent;

  @Input() possibleValues: Value[];
  @Input() jsonArray: any;
  @Input() disabled: boolean = false;
  @Input() fieldName: string;
  @Input() drugs: string[];
  @Input() cancers: string[];
  @Input() finished: boolean;
  @Output() changes = new EventEmitter();

  multiTypes = [];
  nope: boolean = false;

  multiOptions: string = "multi_options";
  options: string = "options";
  otherString: string = "other";

  showDelete: boolean = false;
  currentPatchField: string;
  _other: any[] = [];

  constructor() {
    this.setMultiTypes();
  }

  ngOnInit() {
    this.setMultiTypes();
  }

  ngOnChanges( changes: SimpleChanges ) {
//    this.setMultiTypes();
  }

  setMultiTypes() {
    if (this.jsonArray !== "no") {
      if (this.jsonArray != null && this.jsonArray !== "") {
        this.multiTypes = JSON.parse( this.jsonArray );
      }
      else {
        this.multiTypes = [];
        let multiType = {};
        if (this.possibleValues != null) {
          this.possibleValues.forEach( value => {
            multiType[ value.value ] = null;
          } );
          this.multiTypes.push( multiType );
        }
      }
    }
    else {
      this.nope = true;
    }
    this.setOthers();
  }

  valuesChanged( change: any, fieldName: string, index: number ) {
    if (fieldName === "no" && change.checked != null) {
      if (this.nope) {
        //if there is already medication added double check that they want to remove it!
        if (this.jsonArray != null && this.jsonArray !== "no" && this.jsonArray !== "") {
          this.universalModal.show();
        }
        else {
          this.changeToNothing();
        }
      }
      else {
        this.jsonArray = "";
        this.multiTypes = [];
        let multiType = {};
        if (this.possibleValues != null) {
          this.possibleValues.forEach( value => {
            multiType[ value.value ] = null;
          } );
          this.multiTypes.push( multiType );
        }
      }
    }
    else {
      if (change == null) {
        if (this.multiTypes instanceof Array) {
          this.multiTypes.splice( index, 1 );
        }
      }
      else if (typeof change === "string") {
        if (typeof this.multiTypes === "string") {
          this.multiTypes = [];
        }
        this.multiTypes[ index ] = JSON.parse( change );
      }
      if (this.multiTypes instanceof Array && this.multiTypes.length < 1) {
        this.changes.emit( "" );
      }
      else {
        this.jsonArray = JSON.stringify( this.multiTypes );
        this.changes.emit( this.jsonArray );
      }
    }
  }

  addAction() {
    if (this.multiTypes == null || typeof this.multiTypes === "string") {
      this.multiTypes = [];
    }
    let multiType = {};
    if (this.possibleValues != null) {
      this.possibleValues.forEach( value => {
        multiType[ value.value ] = null;
      } );
      this.multiTypes.push( multiType );
    }
  }

  changeToNothing() {
    this.jsonArray = this.nope ? "no" : "";
    this.changes.emit( this.jsonArray );
    this.universalModal.hide();
  }

  abort() {
    this.nope = false;
  }

  isPatchedCurrently( field: string, row: number ): boolean {
    if (this.currentPatchField === field + row) {
      return true;
    }
    return false;
  }

  multiTypeValueChanged( event: any, multiType: {}, displayName: string, field: Value, i: number ) {
    let v;
    if (typeof event === "string") {
      v = event;
    }
    else {
      if (event.srcElement != null && typeof event.srcElement.value === "string") {
        v = event.srcElement.value;
      }
      else if (event.value != null) {
        v = event.value;
      }
      else if (event.checked != null) {
        v = event.checked;
      }
      else if (event.source.value != null && event.source.selected) {
        v = event.source.value;
      }
    }
    multiType[ displayName ] = v;
    this.currentPatchField = displayName + i;

    if (displayName === this.otherString) {
      this._other[ i ][ field.value ] = v;
      multiType[ this.otherString ] = this._other[ i ];
      this.currentPatchField = this.otherString + "_" + displayName + i;
    }
    else if (field.type === this.multiOptions || field.type2 === this.multiOptions || field.type === this.options || field.type2 === this.options) {
      if (multiType[ displayName ] === this.otherString) {
        this._other[ i ][ displayName ] = v;
      }
      else {
        this._other[ i ][ displayName ] = null;
      }
      multiType[ this.otherString ] = this._other[ i ];
    }
    this.valuesChanged( multiType, null, i );
  }

  currentField( field: string, row: number ) {
    if (field != null || ( field == null )) {
      this.currentPatchField = field + row;
    }
  }

  private setOthers() {
    for (let i = 0; i < this.multiTypes.length; i += 1) {
      this._other[ i ] = {};
      this.possibleValues.forEach( value => {
        let val = null;
        if (this.multiTypes[ i ][ this.otherString ] !== undefined) {
          val = this.multiTypes[ i ][ this.otherString ][ value.value ];
        }
        this._other[ i ][ value.value ] = val;
      } );
    }
  }
}
