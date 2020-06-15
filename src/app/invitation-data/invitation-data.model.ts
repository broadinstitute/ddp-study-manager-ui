export class InvitationData {

  constructor( public acceptedAt: number, public createdAt: number, public verifiedAt: number,  public voidedAt: number,
               public notes: string, public contactEmail: string, public guid: string, public type: string ) {
    this.acceptedAt = acceptedAt;
    this.createdAt = createdAt;
    this.verifiedAt = verifiedAt;
    this.voidedAt = voidedAt;
    this.notes = notes;
    this.contactEmail = contactEmail;
    this.guid = guid;
    this.type = type;
  }

  static parse( json ): InvitationData {
    return new InvitationData( json.acceptedAt, json.createdAt, json.verifiedAt, json.voidedAt,
        json.notes, json.contactEmail, json.guid, json.type );
  }
}
