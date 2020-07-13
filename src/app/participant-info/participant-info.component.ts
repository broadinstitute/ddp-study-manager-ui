import { Component, OnInit } from '@angular/core';
import {Input} from "@angular/core";
import {ParticipantInfo} from "./participant-info.model";

@Component({
  selector: 'app-participant-info',
  templateUrl: './participant-info.component.html',
  styleUrls: ['./participant-info.component.css']
})
export class ParticipantInfoComponent implements OnInit {
  @Input() participantInfo: ParticipantInfo;
  constructor() {
    this.participantInfo = new ParticipantInfo(null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null,
      null, "Canada", null, null, null , null, null, null, null, null);
  }

  ngOnInit() {
    if(this.participantInfo === undefined){
      this.participantInfo = new ParticipantInfo(null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, "Canada", null, null, null , null, null, null, null, null);

    }

  }

}
