export class ParticipantData {

  constructor(public dataId: string, public fieldTypeId: string, public data: {} ) {
    this.dataId = dataId;
    this.fieldTypeId = fieldTypeId;
    this.data = data;
  }

  static parse( json ): ParticipantData {
    let data = {};
    if (json.data != null) {
      data = JSON.parse(json.data);
    }
    return new ParticipantData(json.participantDataId, json.fieldTypeId, data);
  }
}
