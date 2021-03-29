import { Component, OnInit, Inject } from '@angular/core';
import { MD_DIALOG_DATA, MdDialog, MdDialogRef } from '@angular/material';

import { ParticipantUpdateResultDialogComponent } from "../../dialogs/participant-update-result-dialog.component";
import { ParticipantData } from '../../participant-list/models/participant-data.model';

import {ComponentService} from "../../services/component.service";
import {DSMService} from "../../services/dsm.service";
import {RoleService} from "../../services/role.service";
import { Statics } from '../../utils/statics';

@Component({
  selector: 'app-add-family-member',
  templateUrl: './add-family-member.component.html',
  styleUrls: ['./add-family-member.component.css']
})
export class AddFamilyMemberComponent implements OnInit {

  familyMemberFirstName: string;
  familyMemberLastName: string;
  familyMemberSubjectId: string;
  chosenRelation: string;
  isCopyProbandInfo: boolean = false;
  probandDataId: number = this.getProbandDataId(this.data.participant.participantData);
  isParticipantProbandEmpty: boolean = this.getProbandDataId(this.data.participant.participantData) == null;
  staticRelations = Statics.RELATIONS;

  constructor(@Inject(MD_DIALOG_DATA) public data: {participant: any}, private dsmService: DSMService, 
              private compService: ComponentService, private role: RoleService, public dialog: MdDialog,
              private dialogRef: MdDialogRef<AddFamilyMemberComponent>) { }

  ngOnInit() {
    this.dsmService.getParticipantDsmData(this.compService.getRealm(), this.data.participant.data.profile["guid"]).subscribe(
      data => {
        if (data != null) {
          let participantData = data;
          this.isParticipantProbandEmpty = this.getProbandDataId(participantData) == null;
          if (!this.isParticipantProbandEmpty) {
            this.probandDataId = this.getProbandDataId(participantData);
          }
        }
      }
    );
  }
  
  isFamilyMemberFieldsEmpty() {
    return !this.familyMemberFirstName || !this.familyMemberLastName || !this.familyMemberSubjectId || !this.chosenRelation;
  }
  
  submitFamilyMember() {
    let shortId = this.data.participant.data.profile["hruid"];
    let payload = {
      participantGuid: this.data.participant.data.profile["guid"],
      realm: this.compService.getRealm(),
      data: {
        firstName: this.familyMemberFirstName,
        lastName: this.familyMemberLastName,
        memberType: this.chosenRelation,
        familyId: shortId,
        collaboratorParticipantId: shortId + "_" + this.familyMemberSubjectId
      },
      copyProbandInfo: this.isCopyProbandInfo,
      probandDataId: this.probandDataId,
      userId: this.role.userID()
    }
    this.dsmService.addFamilyMemberRequest(JSON.stringify(payload)).subscribe(
      data => {
        this.openResultDialog("Successfully added family member");
        this.close();
        this.data.participant.participantData = data;
      },
      err => {
        if (err.status === 400) {
          let result = JSON.parse(err._body);
          this.openResultDialog(result.body);
        } else {
          this.openResultDialog("Error - Adding family member \nPlease contact your DSM Developer");
        }
        this.close();
      }
    )
  }

  private openResultDialog(text: string) {
    this.dialog.open(ParticipantUpdateResultDialogComponent, {
      data: { message: text },
    });
  }

  close() {
    this.dialogRef.close()
  }

  getRelations() {
    let relations = Object.keys(Statics.RELATIONS);
    if (!this.isParticipantProbandEmpty) {
      relations = relations.filter(rel => rel !== Statics.PARTICIPANT_PROBAND);
    }
    return relations;
  }

  getProbandDataId(pData: Array<ParticipantData>) : number {
    let ddpParticipantDataId;
    let probandData = pData
          .filter(p => p.data['MEMBER_TYPE'] === Statics.PARTICIPANT_PROBAND)
          .shift();
    if (probandData != null && probandData.hasOwnProperty("dataId")) {
      ddpParticipantDataId = probandData["dataId"]
    }
    return ddpParticipantDataId;
  }
}
