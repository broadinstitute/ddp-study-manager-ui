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
import {Tissue} from "./tissue.model";

@Component({
  selector: "app-tissue",
  templateUrl: "./tissue.component.html",
  styleUrls: [ "./tissue.component.css" ],
})
export class TissueComponent implements OnInit {

  @ViewChild("collaboratorSampleId") collaboratorSampleIdInputField;
  @ViewChild(ModalComponent)
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
  rangeValue: number[];
  ussChanged: boolean = false;
  heChanged: boolean = false;
  scrollsChanged: boolean = false;
  uss = "USS";
  he = "HE";
  scrolls =  "scrolls";

  constructor (private role: RoleService, private dsmService: DSMService, private compService: ComponentService,
               private router: Router) {
  }

  ngOnInit () {
  }

  public getCompService () {
    return this.compService;
  }

  public setTissueSite (object: any) {
    if ( object != null ) {
      if ( event instanceof MouseEvent ) {
        this.tissue.tissueSite = object.field1.value;
      }
      else {
        this.tissue.tissueSite = object;
      }
      this.valueChanged(this.tissue.tissueSite, "tissueSite");
    }
  }

  onAdditionalColChange (evt: any, colName: string) {
    let v;
    if ( typeof evt === "string" ) {
      v = evt;
    }
    else {
      if ( evt.srcElement != null && typeof evt.srcElement.value === "string" ) {
        v = evt.srcElement.value;
      }
      else if ( evt.value != null ) {
        v = evt.value;
      }
      else if ( evt.checked != null ) {
        v = evt.checked;
      }
    }
    if ( v !== null ) {
      if ( this.tissue.additionalValues != null ) {
        this.tissue.additionalValues[colName] = v;
      }
      else {
        let addArray = {};
        addArray[colName] = v;
        this.tissue.additionalValues = addArray;
      }
      this.valueChanged(this.tissue.additionalValues, "additionalValues");
    }
  }

  //display additional value
  getAdditionalValue (colName: string): string {
    if ( this.tissue.additionalValues != null ) {
      if ( this.tissue.additionalValues[colName] != undefined && this.tissue.additionalValues[colName] != null ) {
        return this.tissue.additionalValues[colName];
      }
    }
    return null;
  }

  valueChanged (value: any, parameterName: string) {
    let v;
    if ( parameterName === "additionalValues" ) {
      v = JSON.stringify(value);
    }
    else if ( typeof value === "string" ) {
      v = value;
    }
    else {
      if ( value.srcElement != null && typeof value.srcElement.value === "string" ) {
        v = value.srcElement.value;
      }
      else if ( value.value != null ) {
        v = value.value;
      }
      else if ( value.checked != null ) {
        v = value.checked;
      }
    }
    if (v !== null) {
      if (parameterName !== "additionalValues" && parameterName.indexOf("SMId") == -1) {
        for (let oncTissue of this.oncHistoryDetail.tissues) {
          if (oncTissue.tissueId == this.tissue.tissueId) {
            oncTissue[ parameterName ] = v;
          }
        }
      }
      let patch1 = new PatchUtil(this.tissue.tissueId, this.role.userMail(),
        {
          name: parameterName,
          value: v,
        }, null, "oncHistoryDetailId", this.tissue.oncHistoryDetailId, Statics.TISSUE_ALIAS, null, localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), this.participant.participant.ddpParticipantId);
      let patch = patch1.getPatch();
      this.patchFinished = false;
      this.currentPatchField = parameterName;
      this.dsmService.patchParticipantRecord(JSON.stringify(patch)).subscribe(// need to subscribe, otherwise it will not send!
        data => {
          let result = Result.parse(data);
          if ( result.code == 200 && result.body != null && result.body !== "" && this.tissue.tissueId == null ) {
            let jsonData: any | any[] = JSON.parse(result.body);
            this.tissue.tissueId = jsonData.tissueId;
            this.patchFinished = true;
            this.currentPatchField = null;
            this.dup = false;
            if ( jsonData instanceof Array ) {
              jsonData.forEach((val) => {
                let nameValue = NameValue.parse(val);
                this.oncHistoryDetail[nameValue.name] = nameValue.value;
              });
            }

          }
          else if ( result.code === 500 && result.body != null ) {
            this.dup = true;
          }
          else if ( result.code === 200 ) {
            if ( result.body != null && result.body !== "" ) {
              let jsonData: any | any[] = JSON.parse(result.body);
              if ( jsonData instanceof Array ) {
                jsonData.forEach((val) => {
                  let nameValue = NameValue.parse(val);
                  if (nameValue.name && nameValue.name.indexOf( '.' ) != -1) {
                    nameValue.name = nameValue.name.substr( nameValue.name.indexOf( "." ) + 1);
                  }
                  this.oncHistoryDetail[ nameValue.name ] = nameValue.value;
                });
              }
            }
            this.patchFinished = true;
            this.currentPatchField = null;
            this.dup = false;
          }
        },
        err => {
          if ( err._body === Auth.AUTHENTICATION_ERROR ) {
            this.router.navigate([ Statics.HOME_URL ]);
          }
        },
      );
    }
    if (parameterName === 'scrollsCount'){
       this.scrollsChanged = true;
    }
    if (parameterName === 'ussCount'){
      this.ussChanged = true;
    }
    if (parameterName === 'hECount'){
      this.heChanged = true;
    }
  }

  deleteTissue () {
    this.tissue.deleted = true;
  }

  public getStyleDisplay () {
    if ( this.collaboratorS != null ) {
      return Statics.DISPLAY_BLOCK;
    }
    else {
      return Statics.DISPLAY_NONE;
    }
  }

  public checkCollaboratorId () {
    let jsonData: any[];
    if ( this.collaboratorS == null && (this.tissue.collaboratorSampleId == null || this.tissue.collaboratorSampleId === "") ) {
      this.dsmService.lookupCollaboratorId("tCollab", this.participant.participant.ddpParticipantId, this.participant.data.profile["hruid"], localStorage.getItem(ComponentService.MENU_SELECTED_REALM)).subscribe(// need to subscribe, otherwise it will not send!
        data => {
          //          console.log(`received: ${JSON.stringify(data, null, 2)}`);
          jsonData = data;
          jsonData.forEach((val) => {
            let con = Lookup.parse(val);
            this.collaboratorS = con.field1.value + "_";
          });
        },
        err => {
          if ( err._body === Auth.AUTHENTICATION_ERROR ) {
            this.router.navigate([ Statics.HOME_URL ]);
          }
        },
      );
    }
  }

  public setLookup () {
    this.tissue.collaboratorSampleId = this.collaboratorS;
    this.collaboratorS = null;
    this.collaboratorSampleIdInputField.nativeElement.focus();
  }

  isPatchedCurrently (field: string): boolean {
    return this.currentPatchField === field;
  }

  currentField (field: string) {
    if ( field != null || (field == null && this.patchFinished) ) {
      this.currentPatchField = field;
    }
  }

  getRange( start, end ) {
    let a = [ ...Array( end - start ).keys() ];
    return a;
  }

  saveSMId() {
    let parameterName: string;
    let value;
    if(this.currentSMIDField === this.uss){
      parameterName = 'ussSMID';
      value = this.tissue.ussSMId;
    }else if(this.currentSMIDField === this.he){
      parameterName = 'heSMID';
      value = this.tissue.HESMId;
    }else if(this.currentSMIDField === this.scrolls){
      parameterName = 'scrollSMID';
      value = this.tissue.scrollSMId;
    }
    console.log(value);
    let sqlString = JSON.stringify(value);
    sqlString = ','+sqlString.substr(1, sqlString.length - 1)+',';
    console.log(sqlString);
    this.valueChanged(sqlString, parameterName);
  }


      changeSmId( event: any, source: string[], i: number ) {
    let value: string;
    if (typeof event === "string") {
      value = event;
    }
    else {
      if (event.srcElement != null && typeof event.srcElement.value === "string") {
        value = event.srcElement.value;
      }
      else if (event.value != null) {
        value = event.value;
      }
      else {
        console.log( event );
        return;
      }
    }
    if (source.length - 1 > i) {
      source[ i ] = value;
    }
    else {
      while (source.length - 1 < i) {
        source.push( null );
      }
      source[ i ] = value;
    }
  }

  openUSSModal() {
    this.ussChanged = false;
    this.currentSMIDField = this.uss;
    this.rangeValue = this.getRange( 0, this.tissue.ussCount );
    this.SMIDModal.show();
  }

  openHEModal() {
    this.heChanged = false;
    this.currentSMIDField = this.he;
    this.rangeValue = this.getRange( 0, this.tissue.hECount );
    this.SMIDModal.show();
  }

  openScrollsModal() {
    this.scrollsChanged = false;
    this.currentSMIDField = this.scrolls;
    this.rangeValue = this.getRange( 0, this.tissue.scrollsCount );
    this.SMIDModal.show();
  }

  getValue( s: string ) {
    if (!s) {
      return "";
    }
    return s;
  }

  exitModal() {
    let exit = window.confirm( "Are you sure you want to exit? Any unsaved changes will be lost!" );
    if (exit) {
      this.SMIDModal.hide();
    }
  }

  goNext( name: string, i: number ) {
    let nextId = name + ( i + 1 );
    let nextElement = document.getElementById( nextId );
    if (nextElement) {
      nextElement.focus();
    }
  }

}
