export class ParticipantData {

  constructor(public fieldTypeId: string, public data: {} ) {
    this.fieldTypeId = fieldTypeId;
    this.data = data;
  }

  static parse( json ): ParticipantData {
    let data = {};
    if (json.data != null) {
      data = JSON.parse(json.data);
    }
    return new ParticipantData(json.fieldTypeId, data);
  }
}
