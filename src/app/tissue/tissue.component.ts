import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {FieldSettings} from "../field-settings/field-settings.model";
import {OncHistoryDetail} from "../onc-history-detail/onc-history-detail.model";
import {Participant} from "../participant-list/participant-list.model";
import {Tissue} from "./tissue.model";
import {RoleService} from "../services/role.service";
import {DSMService} from "../services/dsm.service";
import {ComponentService} from "../services/component.service";
import {Lookup} from "../lookup/lookup.model";
import {Statics} from "../utils/statics";
import {Result} from "../utils/result.model";
import {Auth} from "../services/auth.service";
import {Router} from "@angular/router";
import {NameValue} from "../utils/name-value.model";
import {PatchUtil} from "../utils/patch.model";

@Component({
  selector: "app-tissue",
  templateUrl: "./tissue.component.html",
  styleUrls: [ "./tissue.component.css" ],
})
export class TissueComponent implements OnInit {

  @ViewChild("collaboratorSampleId") collaboratorSampleIdInputField;

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
      if ( this.tissue.additionalValuesJson != null ) {
        this.tissue.additionalValuesJson[colName] = v;
      }
      else {
        let addArray = {};
        addArray[colName] = v;
        this.tissue.additionalValuesJson = addArray;
      }
      this.valueChanged(this.tissue.additionalValuesJson, "additionalValuesJson");
    }
  }

  //display additional value
  getAdditionalValue (colName: string): string {
    if ( this.tissue.additionalValuesJson != null ) {
      if ( this.tissue.additionalValuesJson[colName] != undefined && this.tissue.additionalValuesJson[colName] != null ) {
        return this.tissue.additionalValuesJson[colName];
      }
    }
    return null;
  }

  valueChanged (value: any, parameterName: string) {
    let v;
    if ( parameterName === "additionalValuesJson" ) {
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
    if ( v !== null ) {
      if ( parameterName !== "additionalValuesJson" ) {
        for ( let oncTissue of this.oncHistoryDetail.tissues ) {
          if ( oncTissue.tissueId == this.tissue.tissueId ) {
            oncTissue[parameterName] = v;
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
          if ( data && this.tissue.tissueId == null ) {
            this.tissue.tissueId = data['tissueId'];
            this.patchFinished = true;
            this.currentPatchField = null;
            this.dup = false;
            if ( data instanceof Array ) {
              data.forEach((val) => {
                let nameValue = NameValue.parse(val);
                this.oncHistoryDetail[nameValue.name] = nameValue.value;
              });
            }
          }
          else if ( data ) {
            if ( data instanceof Array ) {
              data.forEach((val) => {
                let nameValue = NameValue.parse(val);
                if (nameValue.name && nameValue.name.indexOf( '.' ) != -1) {
                  nameValue.name = nameValue.name.substr( nameValue.name.indexOf( "." ) + 1);
                }
                this.oncHistoryDetail[nameValue.name] = nameValue.value;
              });
            }
            this.patchFinished = true;
            this.currentPatchField = null;
            this.dup = false;
          }
        },
        err => {
          this.dup = true;
          if ( err._body === Auth.AUTHENTICATION_ERROR ) {
            this.router.navigate([ Statics.HOME_URL ]);
          }
        },
      );
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
}
