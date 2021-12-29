import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {Router} from "@angular/router";
import {FieldSettings} from "../field-settings/field-settings.model";
import {Lookup} from "../lookup/lookup.model";
import {ModalComponent} from "../modal/modal.component";
import {OncHistoryDetail} from "../onc-history-detail/onc-history-detail.model";
import {Participant} from "../participant-list/participant-list.model";
import {Auth} from "../services/auth.service";
import {ComponentService} from "../services/component.service";
import {DSMService} from "../services/dsm.service";
import {RoleService} from "../services/role.service";
import {NameValue} from "../utils/name-value.model";
import {PatchUtil} from "../utils/patch.model";
import {Result} from "../utils/result.model";
import {Statics} from "../utils/statics";
import {TissueSmId} from "./sm-id.model";
import {Tissue} from "./tissue.model";

@Component( {
  selector: "app-tissue",
  templateUrl: "./tissue.component.html",
  styleUrls: [ "./tissue.component.css" ]
} )
export class TissueComponent implements OnInit {

  @ViewChild( "collaboratorSampleId" ) collaboratorSampleIdInputField;
  @ViewChild( ModalComponent )
  public SMIDModal: ModalComponent;

  @Input() participant: Participant;
  @Input() oncHistoryDetail: OncHistoryDetail;
  @Input() additionalColumns: Array<FieldSettings>;
  @Input() tissue: Tissue;
  @Input() tissueId: string;
  @Input() editable: boolean;

  collaboratorS: string;
  currentPatchField: string;
  patchFinished: boolean = true;
  dup: boolean = false;
  currentSMIDField: string;
  uss = "USS";
  he = "HE";
  scrolls = "scrolls";
  selectedSmIds = 0;
  smIdDuplicate = {};

  constructor( private role: RoleService, private dsmService: DSMService, private compService: ComponentService,
               private router: Router ) {
  }

  ngOnInit() {
  }

  public getCompService() {
    return this.compService;
  }

  public setTissueSite( object: any ) {
    if (object != null) {
      if (event instanceof MouseEvent) {
        this.tissue.tissueSite = object.field1.value;
      }
      else {
        this.tissue.tissueSite = object;
      }
      this.valueChanged( this.tissue.tissueSite, "tissueSite" );
    }
  }

  onAdditionalColChange( evt: any, colName: string ) {
    let v;
    if (typeof evt === "string") {
      v = evt;
    }
    else {
      if (evt.srcElement != null && typeof evt.srcElement.value === "string") {
        v = evt.srcElement.value;
      }
      else if (evt.value != null) {
        v = evt.value;
      }
      else if (evt.checked != null) {
        v = evt.checked;
      }
    }
    if (v !== null) {
      if (this.tissue.additionalValues != null) {
        this.tissue.additionalValues[ colName ] = v;
      }
      else {
        let addArray = {};
        addArray[ colName ] = v;
        this.tissue.additionalValues = addArray;
      }
      this.valueChanged( this.tissue.additionalValues, "additionalValues" );
    }
  }

  //display additional value
  getAdditionalValue( colName: string ): string {
    if (this.tissue.additionalValues != null) {
      if (this.tissue.additionalValues[ colName ] != undefined && this.tissue.additionalValues[ colName ] != null) {
        return this.tissue.additionalValues[ colName ];
      }
    }
    return null;
  }

  valueChanged( value: any, parameterName: string, pName?: string, pId?, alias?, smId?, smIdArray?, index?, value2?, parameter2? ) {
    let v;
    let parentName = "oncHistoryDetailId";
    if (pName) {
      parentName = pName;
    }
    let parentId = this.tissue.oncHistoryDetailId;
    if (pId) {
      parentId = pId;
    }
    let tAlias = Statics.TISSUE_ALIAS;
    if (alias) {
      tAlias = alias;
    }
    let id = this.tissue.tissueId;
    if (smId) {
      id = smId;
    }
    if (tAlias === "sm" && !smId) {
      id = null;
    }
    if (parameterName === "additionalValues") {
      v = JSON.stringify( value );
    }
    else if (typeof value === "string") {
      v = value;
    }
    else {
      if (value.srcElement != null && typeof value.srcElement.value === "string") {
        v = value.srcElement.value;
      }
      else if (value.value != null) {
        v = value.value;
      }
      else if (value.checked != null) {
        v = value.checked;
      }
    }
    if (v !== null) {
      let nameValues = null;
      if (tAlias !== "sm") {
        if (parameterName !== "additionalValues") {
          for (let oncTissue of this.oncHistoryDetail.tissues) {
            if (oncTissue.tissueId == this.tissue.tissueId) {
              oncTissue[ parameterName ] = v;
            }
          }
        }
        this.currentPatchField = parameterName;
      }
      if (parameter2 && value2) {
        nameValues = [];
        let nameValueForType = {
          name: parameterName,
          value: v
        };
        let nameValueForValue = {
          name: parameter2,
          value: value2
        };
        nameValues.push( nameValueForType );
        nameValues.push( nameValueForValue );
      }
      let patch1 = new PatchUtil( id, this.role.userMail(),
        {
          name: parameterName,
          value: v
        }, nameValues, parentName, parentId, tAlias, null,
        localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), this.participant.participant.ddpParticipantId );
      let patch = patch1.getPatch();
      this.patchFinished = false;

      this.dsmService.patchParticipantRecord( JSON.stringify( patch ) ).subscribe(// need to subscribe, otherwise it will not send!
        data => {
          let result = Result.parse( data );
          if (result.code == 200 && result.body != null && result.body !== "" && this.tissue.tissueId == null) {
            let jsonData: any | any[] = JSON.parse( result.body );
            this.tissue.tissueId = jsonData.tissueId;
            this.patchFinished = true;
            this.currentPatchField = null;
            this.dup = false;
            if (jsonData instanceof Array) {
              jsonData.forEach( ( val ) => {
                let nameValue = NameValue.parse( val );
                this.oncHistoryDetail[ nameValue.name ] = nameValue.value;
              } );
            }

          }
          else if (result.code === 500 && result.body != null) {
            this.dup = true;
            if (tAlias === "sm") {
              if (smIdArray && index && smId) {
                smIdArray[ index ].smIdPk = smId;//for new sm ids
              }
              this.smIdDuplicate[ this.currentSMIDField ].add(this.createDuplicateIndex( index ) );
            }
          }
          else if (result.code === 200) {
            if (result.body != null && result.body !== "") {
              let jsonData: any | any[] = JSON.parse( result.body );
              if (tAlias === "sm") {
                if (jsonData.smId) {
                  smId = jsonData.smId;
                  if (smIdArray && index) {
                    smIdArray[ index ].smIdPk = smId;
                  }

                }
                this.smIdDuplicate[ this.currentSMIDField ].delete( this.createDuplicateIndex (index));
                this.patchFinished = true;
                this.currentPatchField = null;
                this.dup = false;
                return smId;
              }
              if (jsonData instanceof Array) {
                jsonData.forEach( ( val ) => {
                  let nameValue = NameValue.parse( val );
                  if (nameValue.name && nameValue.name.indexOf( '.' ) != -1) {
                    nameValue.name = nameValue.name.substr( nameValue.name.indexOf( "." ) + 1 );
                  }

                  this.oncHistoryDetail[ nameValue.name ] = nameValue.value;
                } );
              }
            }
            this.patchFinished = true;
            this.currentPatchField = null;
            this.dup = false;
          }
        },
        err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.router.navigate( [ Statics.HOME_URL ] );
          }
        }
      );
    }

  }

  deleteTissue() {
    this.tissue.deleted = true;
  }

  public getStyleDisplay() {
    if (this.collaboratorS != null) {
      return Statics.DISPLAY_BLOCK;
    }
    else {
      return Statics.DISPLAY_NONE;
    }
  }

  public checkCollaboratorId() {
    let jsonData: any[];
    if (this.collaboratorS == null && ( this.tissue.collaboratorSampleId == null || this.tissue.collaboratorSampleId === "" )) {
      this.dsmService.lookupCollaboratorId( "tCollab", this.participant.participant.ddpParticipantId, this.participant.data.profile[ "hruid" ], localStorage.getItem( ComponentService.MENU_SELECTED_REALM ) ).subscribe(// need to subscribe, otherwise it will not send!
        data => {
          //          console.log(`received: ${JSON.stringify(data, null, 2)}`);
          jsonData = data;
          jsonData.forEach( ( val ) => {
            let con = Lookup.parse( val );
            this.collaboratorS = con.field1.value + "_";
          } );
        },
        err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.router.navigate( [ Statics.HOME_URL ] );
          }
        }
      );
    }
  }

  public setLookup() {
    this.tissue.collaboratorSampleId = this.collaboratorS;
    this.collaboratorS = null;
    this.collaboratorSampleIdInputField.nativeElement.focus();
  }

  isPatchedCurrently( field: string ): boolean {
    return this.currentPatchField === field;
  }

  currentField( field: string ) {
    if (field != null || ( field == null && this.patchFinished )) {
      this.currentPatchField = field;
    }
  }

  changeSmId( event: any, parameterName, id, type, smIdArray, index, filedName? ) {
    let value: any;
    if (typeof event === "string") {
      value = event;
    }
    else if (event.srcElement != null && typeof event.srcElement.value === "string") {
      value = event.srcElement.value;
    }
    else if (typeof event === "boolean") {
      value = event;
    }
    else if (event.value != null) {
      value = event.value;
    }
    if (filedName) {
      this.currentPatchField = filedName;
    }
    if (!id) {
      let smIdPk = this.valueChanged( type, "smIdType", "tissueId", this.tissue.tissueId, Statics.SM_ID_ALIAS, id, smIdArray, index, value, parameterName );
      if (smIdPk) {
        smIdArray[ index ].smIdPk = smIdPk;
      }
    }
    else {
      this.valueChanged( value, parameterName, "tissueId", this.tissue.tissueId, Statics.SM_ID_ALIAS, id, smIdArray, index );
    }
  }

  openUSSModal() {
    this.currentSMIDField = this.uss;
    this.SMIDModal.show();
  }

  openHEModal() {
    this.currentSMIDField = this.he;
    this.SMIDModal.show();
  }

  openScrollsModal() {
    this.currentSMIDField = this.scrolls;
    this.SMIDModal.show();
  }

  getValue( s: TissueSmId ) {
    if (!s || !s.smIdValue) {
      return "";
    }
    return s.smIdValue;
  }

  exitModal() {

    this.SMIDModal.hide();
  }

  goNext( name: string, i: number ) {
    let nextId = name + ( i + 1 );
    let nextElement = document.getElementById( nextId );
    if (nextElement) {
      nextElement.focus();
    }
  }

  smIdCountMatch( array: any[], num: number ) {
    if (!array) {
      return num == 0;
    }
    return array.length == num;
  }

  addSMId( name ) {
    if (name === this.uss) {
      if (!this.tissue.ussSMId) {
        this.tissue.ussSMId = new Array();
      }
      this.tissue.ussSMId.push( new TissueSmId( null, this.uss, null, this.tissue.tissueId, false ) );

    }
    else if (name === this.scrolls) {
      if (!this.tissue.scrollSMId) {
        this.tissue.scrollSMId = new Array();
      }
      this.tissue.scrollSMId.push( new TissueSmId( null, this.scrolls, null, this.tissue.tissueId, false ) );
    }
    else if (name === this.he) {
      if (!this.tissue.HESMId) {
        this.tissue.HESMId = new Array();
      }
      this.tissue.HESMId.push( new TissueSmId( null, this.he, null, this.tissue.tissueId, false ) );
    }
  }

  deleteSMID( array: TissueSmId[], i: number ) {
    array[ i ].deleted = true;
    if (array[ i ].smIdPk) {
      this.changeSmId( `1`, 'deleted', array[ i ].smIdPk, array[ i ].smIdType, array, i );
    }
    if (this.smIdDuplicate[ this.currentSMIDField ].has( this.createDuplicateIndex( i ) )) {
      this.smIdDuplicate[ this.currentSMIDField ].delete( this.createDuplicateIndex( i ) );
    }
    array.splice( i, 1 );
  }

  checkboxChecked( event: any, smidArray: TissueSmId[], index: number ) {
    if (event.checked && event.checked === true) {
      smidArray[ index ].isSelected = true;
      this.selectedSmIds += 1;
    }
    else if (event.checked !== undefined && event.checked !== null && event.checked === false) {
      smidArray[ index ].isSelected = false;
      this.selectedSmIds -= 1;
    }
  }

  exitModalAndDeleteRest( name ) {
    if (name === this.uss) {
      for (let i = 0; i < this.tissue.ussSMId.length; i += 1) {
        if (!this.tissue.ussSMId[ i ].isSelected) {
          this.deleteSMID( this.tissue.ussSMId, i );
        }
        else {
          this.tissue.ussSMId[ i ].isSelected = false;
        }
      }

    }
    else if (name === this.scrolls) {
      for (let i = 0; i < this.tissue.scrollSMId.length; i += 1) {
        if (!this.tissue.scrollSMId[ i ].isSelected) {
          this.deleteSMID( this.tissue.scrollSMId, i );
        }
        else {
          this.tissue.scrollSMId[ i ].isSelected = false;
        }
      }
    }
    else if (name === this.he) {
      for (let i = 0; i < this.tissue.HESMId.length; i += 1) {
        if (!this.tissue.HESMId[ i ].isSelected) {
          this.deleteSMID( this.tissue.HESMId, i );
        }
        else {
          this.tissue.HESMId[ i ].isSelected = false;
        }
      }
    }
    this.exitModal();
  }

  checkBoxNeeded( name: string, index ): boolean {
    if (name === this.uss) {
      if (!this.tissue.ussSMId) {
        this.tissue.ussSMId = new Array<TissueSmId>();
      }
      return ( this.tissue.ussCount < this.tissue.ussSMId.length && !this.smIdDuplicate[ this.uss ].has( this.createDuplicateIndex(index, name) ) );
    }
    else if (name === this.scrolls) {
      if (!this.tissue.scrollSMId) {
        this.tissue.scrollSMId = new Array<TissueSmId>();
      }
      return ( this.tissue.scrollsCount < this.tissue.scrollSMId.length && !this.smIdDuplicate[ this.scrolls ].has( this.createDuplicateIndex(index, name)  ) );
    }
    else if (name === this.he) {
      if (!this.tissue.HESMId) {
        this.tissue.HESMId = new Array<TissueSmId>();
      }
      return ( this.tissue.hECount < this.tissue.HESMId.length && !this.smIdDuplicate[ this.he ].has( this.createDuplicateIndex(index, name)  ) );
    }
  }


  isDuplicate( currentSMIDField: string,  index ) {
    return ( this.smIdDuplicate[ currentSMIDField ].has( this.createDuplicateIndex( index, currentSMIDField ) ) );

  }

  createDuplicateIndex( i, name? ) {
    if(!name)
      name = this.currentSMIDField;
    return name + i;
  }

  canChangeThis(i, name){
    let index = this.createDuplicateIndex(i, name);
    return this.editable && (this.smIdDuplicate[name].size === 0 || this.smIdDuplicate[name].has(index));
  }
}
