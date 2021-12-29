export class ParticipantDSMInformation {

  constructor( public participantId: string, public ddpParticipantId: string, public realm: string,
               public assigneeMr: string, public assigneeTissue: string, public createdOncHistory: string, public reviewedOncHistory: string,
               public paperCRSent: string, public paperCRReceived: string, public notes: string, public minimalMr: boolean, public abstractionReady: boolean,
               public mrNeedsAttention: boolean, public tissueNeedsAttention: boolean, public exitDate: number, public additionalValuesJson: {} ) {
    this.participantId = participantId;
    this.ddpParticipantId = ddpParticipantId;
    this.realm = realm;
    this.assigneeMr = assigneeMr;
    this.assigneeTissue = assigneeTissue;
    this.createdOncHistory = createdOncHistory;
    this.reviewedOncHistory = reviewedOncHistory;
    this.paperCRSent = paperCRSent;
    this.paperCRReceived = paperCRReceived;
    this.notes = notes;
    this.minimalMr = minimalMr;
    this.abstractionReady = abstractionReady;
    this.mrNeedsAttention = mrNeedsAttention;
    this.tissueNeedsAttention = tissueNeedsAttention;
    this.exitDate = exitDate;
    this.additionalValuesJson = additionalValuesJson;
  }

  static parse( json ): ParticipantDSMInformation {
    let data = json.dynamicFields;
    let additionalValuesJson = {};
    if (data != null) {
      data = "{" + data.substring(1, data.length - 1) + "}";
      additionalValuesJson = JSON.parse(data);
    }
    return new ParticipantDSMInformation( json.participantId, json.ddpParticipantId, json.realm, json.assigneeMr, json.assigneeTissue,
      json.createdOncHistory, json.reviewedOncHistory, json.paperCRSent, json.paperCRReceived,
      json.notes, json.minimalMR, json.abstractionReady, json.mrNeedsAttention, json.tissueNeedsAttention, json.exitDate, additionalValuesJson );
  }


}
