import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import { TabDirective } from "ngx-bootstrap";
import { FieldSettings } from "../field-settings/field-settings.model";
import { ParticipantData } from "../participant-list/models/participant-data.model";
import { Participant } from "../participant-list/participant-list.model";
import {NameValue} from "../utils/name-value.model";
import { Value } from "../utils/value.model";

@Component({
  selector: 'app-form-data',
  templateUrl: './form-data.component.html',
  styleUrls: ['./form-data.component.css']
})
export class FormDataComponent implements OnInit {

  @Input() localFieldSetting: FieldSettings;
  @Input() settings: any;
  @Input() activeTab: string;
  @Input() participant: Participant;
  @Input() participantData: String;
  @Input() activityData: String;
  @Input() activityOptions: String[];
  @Input() patchFinished: boolean;
  @Input() patchDataFunction: (value: any, fieldSetting: FieldSettings, groupSetting: FieldSettings, dataId?: string) => void;
  @Input() getParticipantDataFunction: (fieldSetting: FieldSettings, relative: ParticipantData) => String;
  @Input() getActivityDataFunction: (fieldSetting: FieldSettings) => String;
  @Input() getActivityOptionsFunction: (fieldSetting: FieldSettings) => String[];
  @Output() patchData = new EventEmitter();

  defaultValuesToSave: FieldSettings[] = [];

  currentPatchField: string;

  constructor() { }

  ngOnInit() {
    console.log("---------------------", this.settings);
  }

  getActivityAnswer(fieldSetting: FieldSettings, participantData: ParticipantData) {
    let pData = this.getParticipantDataFunction(fieldSetting, participantData);
    if (fieldSetting.displayType !== 'ACTIVITY')  {
      //get data from dsm db if it is not type activity
      if (fieldSetting.displayType !== 'ACTIVITY_STAFF') {
        //return savedAnswer if it is not type activity_staff
        if (pData) {
          return pData;
        }
        if (fieldSetting.possibleValues != null) {
          let value = "";
          fieldSetting.possibleValues.forEach(v => {
            if (v['default']) {
              value = v.value;
              this.defaultValuesToSave.push(fieldSetting);
            };
          });
          return value;
        }
      }
      else {
        //if it is type activity_staff only return if it is not empty, otherwise return answer from the activity
        if (pData != null && pData !== '') {
          return pData;
        }
      }
    }
    return this.getActivityDataFunction(fieldSetting);
  }

  displayTab( fieldSetting: FieldSettings ): boolean {
    if (fieldSetting != null && fieldSetting.possibleValues != null) {
      let value: Value[] = fieldSetting.possibleValues;
      if (value.length == 1 && value[0] != null && value[0].value != null) {
        if (this.participant != null && this.participant.data != null && this.participant.data.activities != null) {
          let activity = this.participant.data.activities.find( x => x.activityCode === value[0].value );
          if (activity != null) {
            return true;
          }
          else {
            return false;
          }
        }
      }
    }
    return true;
  }

  createRelativeTabHeading(data: any): string {
    if (data) {
      return data.MEMBER_TYPE + " - " + data.DATSTAT_FIRSTNAME + " " + data.DATSTAT_LASTNAME;
    }
    return "";
  }

  getParticipantData(fieldSetting: FieldSettings, relative: ParticipantData) {
    return this.getParticipantDataFunction(fieldSetting, relative);
  }

  tabActive( tab: string ): boolean {
    if (this.activeTab === tab) {
      return true;
    }
    return false;
  }


  onSelect( data: TabDirective, tabName: string ): void {
    if (data instanceof TabDirective) {
      // this.selectedTabTitle = data.heading;
      this.activeTab = tabName;
    }
  }


  getOptions(fieldSetting: FieldSettings) {
    if (fieldSetting.displayType !== 'ACTIVITY' && fieldSetting.displayType !== 'ACTIVITY_STAFF') {
      return fieldSetting.possibleValues;
    }
    else {
      return this.getActivityOptionsFunction(fieldSetting);
    }
  }

  valueChanged( value: any, fieldSetting: FieldSettings, groupSetting: FieldSettings, dataId: any ) {
    this.patchFinished = false;
    let v;
    if (typeof value === "string") {
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
      else if (value.source.value != null && value.source.selected) {
        v = value.source.value;
      }
    }
    this.participantData = v;
    this.patchData.emit({value: v, fieldSetting: fieldSetting, groupSetting: groupSetting, dataId: dataId});
  }

  isPatchedCurrently( field: string ): boolean {
    if (this.currentPatchField === field) {
      return true;
    }
    return false;
  }

  isCheckboxPatchedCurrently( field: string ): string {
    if (this.currentPatchField === field) {
      return "warn";
    }
    return "primary";
  }
}
