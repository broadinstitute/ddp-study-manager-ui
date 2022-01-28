import {OncHistoryDetail} from "../onc-history-detail/onc-history-detail.model";
import {ParticipantDSMInformation} from "../participant-list/models/participant.model";
import {Tissue} from "../tissue/tissue.model";

export class TissueList {

  constructor(public oncHistoryDetails: OncHistoryDetail, public tissue: Tissue, public ddpParticipantId: string, public participantId: string,
              public participant: ParticipantDSMInformation) {
    this.oncHistoryDetails = oncHistoryDetails;
    this.ddpParticipantId = ddpParticipantId;
    this.tissue = tissue;
    this.participantId = participantId;
    this.participant = participant;
  }

  static parse(json): TissueList {
    let oncHistory: OncHistoryDetail = OncHistoryDetail.parse(json.oncHistoryDetails);
    let tissue: Tissue;
    if (json.tissue != null && json.tissue != undefined) {
      tissue = Tissue.parse(json.tissue);
    }
    let participant = ParticipantDSMInformation.parse(json.participant);
    return new TissueList(oncHistory, tissue, json.ddpParticipantId, json.participantId, participant);
  }
}
