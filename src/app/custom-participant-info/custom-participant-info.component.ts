import {Component, Input, OnInit} from "@angular/core";
import {CustomParticipantInfo} from "./custom-participant-info.model";

@Component({
  selector: 'app-custom-participant-info',
  templateUrl: './custom-participant-info.component.html',
  styleUrls: ['./custom-participant-info.component.css']
})
export class CustomParticipantInfoComponent implements OnInit {
  @Input() customParticipantInfo : CustomParticipantInfo;
  country : string = "Canada";
  state : string = "Alberta";
  constructor() {
    this.customParticipantInfo = new CustomParticipantInfo(null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null,null, null, null, null, null, null,
      null, null, null, null, null, null, null);
  }

  ngOnInit() {
    this.country = "Canada";
    this.customParticipantInfo = new CustomParticipantInfo(null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null,null, null, null, null, null, null,
      null, null, null, null, null, null, null);
  }

}
