import {Component, Input, OnInit} from "@angular/core";
import {ActivityData} from "../activity-data/activity-data.model";
import {ActivityDefinition} from "../activity-data/models/activity-definition.model";
import {FieldSettings} from "../field-settings/field-settings.model";
import {ParticipantData} from "../participant-list/models/participant-data.model";
import {Value} from "../utils/value.model";

@Component({
  selector: 'app-form-data',
  templateUrl: './form-data.component.html',
  styleUrls: ['./form-data.component.css']
})
export class FormDataComponent implements OnInit {

  @Input() fieldTypeId: String;
  @Input() fieldSetting: FieldSettings;
  @Input() participantData: Array<ParticipantData>;
  @Input() activities: Array<ActivityData>;
  @Input() activityDefinitions: Array<ActivityDefinition>;

  constructor() { }

  ngOnInit() {
  }

  getParticipantData() {
    if (this.participantData != null && this.fieldTypeId != null && this.fieldSetting.columnName != null) {
      let participantData = this.participantData.find(participantData => participantData.fieldTypeId === this.fieldTypeId);
      if (participantData != null) {
        return participantData.data[this.fieldSetting.columnName];
      }
    }
    return "";
  }

  getActivityAnswer() {
    if (this.fieldSetting.possibleValues != null && this.fieldSetting.possibleValues[0] != null && this.fieldSetting.possibleValues[0].value != null) {
      let tmp: string[] = this.fieldSetting.possibleValues[ 0 ].value.split( '.' );
      if (tmp != null && tmp.length > 1) {
        if (this.activities != null) {
          let activity: ActivityData = this.activities.find( activity => activity.activityCode === tmp[0]);
          if (activity != null && activity.questionsAnswers != null) {
            let questionAnswer = activity.questionsAnswers.find( questionAnswer => questionAnswer.stableId === tmp[ 1 ] );
            if (questionAnswer != null) {
              if (tmp.length == 2) {
                return questionAnswer.answer;
              }
              else if (tmp.length === 3) {
                if (this.fieldSetting.possibleValues != null && this.fieldSetting.possibleValues[0] != null && this.fieldSetting.possibleValues[0].type != null && this.fieldSetting.possibleValues[0].type ==="RADIO"){
                  if (questionAnswer.answer != null) {
                    let found = questionAnswer.answer.find( answer => answer === tmp[2])
                    if (found != null) {
                      return "Yes";
                    }
                    return "No";
                  }
                }
                else if (this.activityDefinitions != null) {
                  let definition: ActivityDefinition = this.activityDefinitions.find(definition => definition.activityCode === tmp[0]);
                  if (definition != null && definition.questions != null) {
                    let question = definition.questions.find(question => question.stableId === tmp[1]);
                    if (question != null && question.childQuestions != null) {
                      for (let i = 0; i < question.childQuestions.length; i++) {
                        if (question.childQuestions[i] != null && question.childQuestions[i].stableId === tmp[2] && questionAnswer.answer[0][i] != null) {
                          return questionAnswer.answer[0][i];
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
    return "";
  }

  getOptions() {
    if (this.fieldSetting.possibleValues != null && this.fieldSetting.possibleValues[0] != null && this.fieldSetting.possibleValues[0].value != null
      && this.fieldSetting.possibleValues[0].type != null) {
      let tmp: string[] = this.fieldSetting.possibleValues[ 0 ].value.split( '.' );
      if (tmp != null && tmp.length > 1) {
        if (tmp.length == 2) {
          if (this.activityDefinitions != null) {
            let definition: ActivityDefinition = this.activityDefinitions.find(definition => definition.activityCode === tmp[0]);
            if (definition != null && definition.questions != null) {
              let question = definition.questions.find(question => question.stableId === tmp[1]);
              if (question != null && question.options != null) {
                let options: string[] = [];
                for (let i = 0; i < question.options.length; i++) {
                  options.push(question.options[i].optionText);
                }
                return options;
              }
            }
          }
        }
        else if (tmp.length === 3) {
          let options: string[] = [];
          options.push("Yes");
          options.push("No");
          return options;
        }
      }
    }
    return [];
  }
}
