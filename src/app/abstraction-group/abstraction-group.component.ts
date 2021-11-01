import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {Router} from "@angular/router";
import {Subscription} from "rxjs";
import {DragulaService} from "ng2-dragula";
import {Group} from "ng2-dragula/dist/Group";

import {AbstractionFieldComponent} from "../abstraction-field/abstraction-field.component";
import {AbstractionField, AbstractionFieldValue} from "../medical-record-abstraction/medical-record-abstraction-field.model";
import {ModalComponent} from "../modal/modal.component";
import {Participant} from "../participant-list/participant-list.model";
import {Value} from "../utils/value.model";
import {ComponentService} from "../services/component.service";
import {RoleService} from "../services/role.service";
import {DSMService} from "../services/dsm.service";

@Component( {
  selector: "app-abstraction-group",
  templateUrl: "./abstraction-group.component.html",
  styleUrls: [ "./abstraction-group.component.css" ]
} )
export class AbstractionGroupComponent implements OnInit, OnDestroy {

  @ViewChild(ModalComponent)
  public noteModal: ModalComponent;

  @ViewChild(AbstractionFieldComponent)
  public abstractionField: AbstractionFieldComponent;

  @Input() participant: Participant;
  @Input() displayName: string;
  @Input() fields: Array<AbstractionField> = [];
  @Input() setupForm: boolean = false;
  @Input() fileNames: string[] = [];
  @Input() drugNames: string[] = [];
  @Input() cancerNames: string[] = [];
  @Input() currentFile: string;
  @Input() activity: string;
  @Input() activityStatus: string;
  @Output() emitFile = new EventEmitter();

  newField: string;
  newType: string;

  subs = new Subscription();

  currentPatchField: string;

  constructor( private compService: ComponentService, private role: RoleService, private dsmService: DSMService, private router: Router,
               private dragulaService: DragulaService ) {
  }

  ngOnInit() {
    if (this.setupForm) {
      const groupName = this.getDisplayNameWithoutSpace() + "-list-group";

      if (this.fields != null && this.fields.length > 0) {
        const group: Group = this.dragulaService.find(groupName);
        if (group !== undefined) {
          this.dragulaService.destroy(groupName);
        }
        this.dragulaService.createGroup(groupName, {
          revertOnSpill: true
        } );
      }

      this.subs.add(
        this.dragulaService.dropModel(groupName)
          .subscribe(({sourceModel}) => {
            // updated model
            this.fields = sourceModel;
            for (let i = 0; i < this.fields.length; i++) {
              this.fields[i].orderNumber = i + 1;
              this.fields[i].changed = true;
            }
          })
      );
    }
  }

  isPatchedCurrently( field: string ): boolean {
    return this.currentPatchField === field;
  }

  ngOnDestroy() {
    // destroy all the subscriptions at once
    this.subs.unsubscribe();
  }

  getDisplayNameWithoutSpace() {
    if (this.displayName != null) {
      return this.activity + "_" + this.displayName.replace( /\s/g, "" );
    }
    return "";
  }

  deleteField( field: AbstractionField ) {
    field.deleted = true;
    field.changed = true;
  }

  addField() {
    let values = null;
    if (this.newType === "options" || this.newType === "button_select" || this.newType === "multi_options" || this.newType === "multi_type" || this.newType === "multi_type_array") {
      values = [];
      let value = new Value( null );
      values.push( value );
    }
    let newAbstractionField = new AbstractionField( null, this.newField.trim(), this.newType, null, this.fields.length + 1, values, null, false,
      null, null, false );
    newAbstractionField.newAdded = true;
    newAbstractionField.changed = true;
    this.fields.push( newAbstractionField );
    this.newField = null;
    this.newType = null;
  }

  addMultiType( field: AbstractionField ) {
    let multiValue = new Value( null );
    field.possibleValues.push( multiValue );
    field.changed = true;
  }

  addValue( field: AbstractionField ) {
    let value = new Value( null );
    field.possibleValues.push( value );
    field.changed = true;
  }

  createMultiValue( value: Value ) {
    if (value.type === "options" || value.type === "button_select" || value.type === "multi_options") {
      value.values = [];
      let multiValue = new Value( null );
      multiValue.newAdded = true;
      value.values.push( multiValue );
    }
  }

  addMultiValue( value: Value ) {
    if (value.values == null) {
      value.values = [];
    }
    let multiValue = new Value( null );
    multiValue.newAdded = true;
    value.values.push( multiValue );
  }

  formChanged( field: AbstractionField ) {
    field.changed = true;
  }

  doNothing() { //needed for the menu, otherwise page will refresh!
    return false;
  }

  addFileName( fileName: string ) {
    this.emitFile.emit( fileName );
  }

  isActivityDone() {
    return this.activityStatus === "done";
  }

  applyAbstraction( field: AbstractionField, type: string ) {
    if (!field.qcWrapper.equals && field.copiedActivity !== type) {
      let selectedVersion: AbstractionFieldValue = field.qcWrapper[ type ];
      field.copiedActivity = type;
      field.fieldValue.value = selectedVersion.value;
      field.fieldValue.noData = selectedVersion.noData;
      field.fieldValue.fileName = selectedVersion.fileName;
      field.fieldValue.filePage = selectedVersion.filePage;
      field.fieldValue.matchPhrase = selectedVersion.matchPhrase;
      this.abstractionField.saveSelectedQc( field );
    }
  }
}
