import {Component, Input, OnInit} from "@angular/core";
import {Utils} from "../utils/utils";
import {ActivityData} from "./activity-data.model";
import {ActivityDefinition} from "./models/activity-definition.model";
import {QuestionAnswer} from "./models/question-answer.model";

@Component( {
  selector: "app-activity-data",
  templateUrl: "./activity-data.component.html",
  styleUrls: [ "./activity-data.component.css" ]
} )
export class ActivityDataComponent implements OnInit {

  @Input() activity: ActivityData;
  @Input() activityDefinition: ActivityDefinition;

  constructor( private util: Utils ) {
  }

  ngOnInit() {
  }

  getUtil(): Utils {
    return this.util;
  }

    getActivityName(activityDefinition: ActivityDefinition) {
        return activityDefinition.activityName;
    }

  getActivityCode( activity: ActivityData ) {
    return activity.activityCode;
  }

}
