import {Component, ContentChildren, EventEmitter, Input, OnInit, Output, QueryList, ViewChild} from "@angular/core";
import { Router } from "@angular/router";
import { TabDirective } from "ngx-bootstrap";
import { ActivityData } from "../activity-data/activity-data.model";
import { ActivityDefinition } from "../activity-data/models/activity-definition.model";
import { FieldSettings } from "../field-settings/field-settings.model";
import { ParticipantData } from "../participant-list/models/participant-data.model";
import { Sample } from "../participant-list/models/sample.model";
import { Participant } from "../participant-list/participant-list.model";
import { Auth } from "../services/auth.service";
import { ComponentService } from "../services/component.service";
import { DSMService } from "../services/dsm.service";
import { RoleService } from "../services/role.service";
import { TabComponent } from "../tabs/tab.component";
import {NameValue} from "../utils/name-value.model";
import { Result } from "../utils/result.model";
import { Statics } from "../utils/statics";
import { Value } from "../utils/value.model";

@Component({
  selector: 'app-form-data',
  templateUrl: './form-data.component.html',
  styleUrls: ['./form-data.component.css']
})
export class FormDataComponent implements OnInit {

  @Input() settings: any;
  @Input() doRender: boolean;
  @Input() participant: Participant;
  @Input() activityDefinitions: Array<ActivityDefinition>;
  @Input() currentActiveTab: String;
  @Output() putTab = new EventEmitter();

  currentPatchField: string;

  constructor(private dsmService: DSMService, private router: Router, private role: RoleService) { }

  ngOnInit() {
  }

  ngOnChanges() {
  }

  formDataPutTab(tab: TabComponent) {
    this.putTab.emit(tab);
  }

  getActivityAnswer(fieldSetting: FieldSettings, participantData: ParticipantData) {
    let parsedParticipantData = this.getParticipantData(fieldSetting, participantData);
    if (fieldSetting.displayType !== 'ACTIVITY')  {
      //get data from dsm db if it is not type activity
      if (fieldSetting.displayType !== 'ACTIVITY_STAFF') {
        //return savedAnswer if it is not type activity_staff
        return parsedParticipantData;
      }
      else {
        //if it is type activity_staff only return if it is not empty, otherwise return answer from the activity
        if (parsedParticipantData != null && parsedParticipantData !== '') {
          return parsedParticipantData;
        }
      }
    }
    return this.getActivityData(fieldSetting);
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
    if (this.participant != null && this.participant.participantData != null && relative.dataId != null && fieldSetting.columnName != null) {
      let kitFieldsDict = {'DATE_KIT_RECEIVED': 'receiveDate', 'DATE_KIT_SENT': 'scanDate', 'KIT_TYPE_TO_REQUEST': 'kitType'};
      if (fieldSetting.displayType === 'SAMPLE') {
        let sample: Sample = this.participant.kits.find(kit => kit.bspCollaboratorSampleId === relative.data[fieldSetting.columnName]);
        if (sample && kitFieldsDict[fieldSetting.columnName] && sample[kitFieldsDict[fieldSetting.columnName]]) {
          return sample[kitFieldsDict[fieldSetting.columnName]];
        } else {
          return "";
        }
      }
      if (relative != null && relative.data != null && relative.data[fieldSetting.columnName] != null) {
        return relative.data[fieldSetting.columnName];
      }
    }
    return "";
  }

  getActivityData(fieldSetting: FieldSettings) {
    //type was activity or activity_staff and no saved staff answer. therefore lookup the activity answer
    if (fieldSetting != null && fieldSetting.possibleValues != null && fieldSetting.possibleValues[0] != null && fieldSetting.possibleValues[0].value != null) {
      let tmp: string[] = fieldSetting.possibleValues[ 0 ].value.split( '.' );
      if (tmp != null && tmp.length > 1) {
        if (tmp[ 0 ] === 'profile') {
          return this.participant.data.profile[tmp[1]];
        }
        else {
          if (this.participant != null && this.participant.data != null && this.participant.data.activities != null) {
            let activity: ActivityData = this.participant.data.activities.find( activity => activity.activityCode === tmp[ 0 ] );
            if (activity != null && activity.questionsAnswers != null) {
              let questionAnswer = activity.questionsAnswers.find( questionAnswer => questionAnswer.stableId === tmp[ 1 ] );
              if (questionAnswer != null) {
                if (tmp.length == 2) {
                  if (typeof questionAnswer.answer === "boolean") {
                    if (questionAnswer.answer) {
                      return "Yes";
                    }
                    return "No";
                  }
                  if (questionAnswer.answer instanceof Array) {
                    return questionAnswer.answer[0];
                  }
                  return questionAnswer.answer;
                }
                else if (tmp.length === 3) {
                  if (fieldSetting.possibleValues != null && fieldSetting.possibleValues[ 0 ] != null && fieldSetting.possibleValues[ 0 ].type != null && fieldSetting.possibleValues[ 0 ].type === "RADIO") {
                    if (questionAnswer.answer != null) {
                      let found = questionAnswer.answer.find( answer => answer === tmp[ 2 ] )
                      if (found != null) {
                        return "Yes";
                      }
                      return "No";
                    }
                  }
                  else if (this.activityDefinitions != null) {
                    let definition: ActivityDefinition = this.activityDefinitions.find( definition => definition.activityCode === tmp[ 0 ] );
                    if (definition != null && definition.questions != null) {
                      let question = definition.questions.find( question => question.stableId === tmp[ 1 ] );
                      if (question != null && question.childQuestions != null) {
                        for (let i = 0; i < question.childQuestions.length; i++) {
                          if (question.childQuestions[ i ] != null && question.childQuestions[ i ].stableId === tmp[ 2 ] && questionAnswer.answer[ 0 ][ i ] != null) {
                            return questionAnswer.answer[ 0 ][ i ];
                          }
                        }
                      }
                      else if (question != null && question.options != null) {

                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return "";
  }

  valueChanged( value: any, fieldSetting: FieldSettings, groupSetting: FieldSettings, dataId: any ) {
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
    this.formPatch(v, fieldSetting, groupSetting, dataId);
  }

  formPatch(value: any, fieldSetting: FieldSettings, groupSetting: FieldSettings, dataId?: string) {
    if (fieldSetting == null || fieldSetting.fieldType == null) {
      // this.errorMessage = "Didn't save change";
      return;
    }
    let fieldTypeId = fieldSetting.fieldType;
    if (groupSetting != null) {
      fieldTypeId = groupSetting.fieldType;
    }
    if (this.participant != null && this.participant.participantData != null && fieldTypeId != null && fieldSetting.columnName != null && dataId != null) {
      let participantData: ParticipantData = this.participant.participantData.find(participantData => participantData.dataId === dataId);
      if (participantData == null) {
        let data: { [ k: string ]: any } = {};
        data[fieldSetting.columnName] = value;
        participantData = new ParticipantData (null, fieldTypeId, data );
        this.participant.participantData.push(participantData);
      }
      if (participantData != null && participantData.data != null) {
        participantData.data[fieldSetting.columnName] = value;

        let nameValue: { name: string, value: any }[] = [];
        nameValue.push({name: "d.data", value: JSON.stringify(participantData.data)});
        let participantDataSec: ParticipantData = null;
        let actionPatch: Value[] = null;
        if (fieldSetting.actions != null) {
          fieldSetting.actions.forEach(( action ) => {
            if (action != null && action.name != null && action.name != undefined && action.type != null && action.type != undefined) {
              participantDataSec = this.participant.participantData.find(participantData => participantData.fieldTypeId === action.type);
              if (participantDataSec == null) {
                if (action.type !== 'ELASTIC_EXPORT') {
                  let data: { [ k: string ]: any } = {};
                  data[ action.name ] = action.value;
                  participantDataSec = new ParticipantData( null, action.type, data );
                }
                else {
                  if (actionPatch === null) {
                    actionPatch = [];
                  }
                  actionPatch.push(action);
                }
              }
              if (participantDataSec != null && participantDataSec.data != null) {
                participantDataSec.data[ action.name ] = action.value;
                nameValue.unshift({name: "d.data", value: JSON.stringify(participantDataSec.data)});
              }
            }
          });
        }
        if (fieldSetting.fieldType === "RADIO" && fieldSetting.possibleValues != null) {
          let possibleValues = fieldSetting.possibleValues;
          let possibleValue = possibleValues.find(value => value.name === fieldSetting.columnName && value.values != null)
        }

        let participantId = this.participant.data.profile[ "guid" ];
        if (this.participant.data.profile[ "legacyAltPid" ] != null && this.participant.data.profile[ "legacyAltPid" ] != undefined && this.participant.data.profile[ "legacyAltPid" ] !== '') {
          participantId = this.participant.data.profile[ "legacyAltPid" ];
        }
        let patch = {
          id: participantData.dataId,
          parent: "participantDataId",
          parentId: participantId,
          user: this.role.userMail(),
          fieldId: fieldTypeId,
          realm:  localStorage.getItem( ComponentService.MENU_SELECTED_REALM ),
          nameValues: nameValue,
          actions: actionPatch,
        };

        this.dsmService.patchParticipantRecord( JSON.stringify( patch ) ).subscribe(// need to subscribe, otherwise it will not send!
          data => {
            let result = Result.parse( data );
            if (result.code === 200) {
              if (result.body != null && result.body !== "") {
                let jsonData: any | any[] = JSON.parse( result.body );
                if (jsonData.participantDataId !== undefined && jsonData.participantDataId !== "") {
                  if (participantData != null) {
                    participantData.dataId = jsonData.participantDataId;
                  }
                }
              }
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
  }

  getActivityOptions(fieldSetting: FieldSettings) {
    if (fieldSetting.displayType === 'ACTIVITY' || fieldSetting.displayType === 'ACTIVITY_STAFF') {
      if (fieldSetting.possibleValues != null && fieldSetting.possibleValues[0] != null && fieldSetting.possibleValues[0].value != null
        && fieldSetting.possibleValues[0].type != null) {
        let tmp: string[] = fieldSetting.possibleValues[ 0 ].value.split( '.' );
        if (tmp != null && tmp.length > 1) {
          if (tmp.length == 2) {
            if (this.activityDefinitions != null) {
              let definition: ActivityDefinition = this.activityDefinitions.find( definition => definition.activityCode === tmp[ 0 ] );
              if (definition != null && definition.questions != null) {
                let question = definition.questions.find( question => question.stableId === tmp[ 1 ] );
                if (question != null) {// && question.options != null) {
                  if (question.questionType !== 'BOOLEAN' && question.options != null) {
                    let options: NameValue[] = [];
                    for (let i = 0; i < question.options.length; i++) {
                      options.push( new NameValue( question.options[ i ].optionText, question.options[ i ].optionStableId ));
                    }
                    return options;
                  }
                  else {
                    let options: string[] = [];
                    options.push( "Yes" );
                    options.push( "No" );
                    return options;
                  }
                }
              }
            }
          }
          else if (tmp.length === 3) {
            let options: string[] = [];
            options.push( "Yes" );
            options.push( "No" );
            return options;
          }
        }
      }
    }
    return [];
  }


  getOptions(fieldSetting: FieldSettings) {
    if (fieldSetting.displayType !== 'ACTIVITY' && fieldSetting.displayType !== 'ACTIVITY_STAFF') {
      return fieldSetting.possibleValues;
    }
    else {
      return this.getActivityOptions(fieldSetting);
    }
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
