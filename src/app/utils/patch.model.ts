export class PatchUtil {

  constructor( public id: string, public user: string, public nameValue: {}, public nameValues: any[],
               public parent: string, public parentId: string, public tableAlias: string, public isUnique: Boolean, public realm: string, public ddpParticipantId: string ) {
    this.id = id;
    this.user = user;
    this.nameValue = nameValue;
    this.nameValues = nameValues;
    this.parent = parent;
    this.parentId = parentId;
    this.tableAlias = tableAlias;
    this.isUnique = isUnique == undefined ? false : isUnique;
    this.realm = realm;
    this.ddpParticipantId = ddpParticipantId;
  }

  public getPatch() {
    let patch = {
      id: this.id,
      user: this.user,
      nameValue: this.nameValue,
      ddpParticipantId: this.ddpParticipantId,
    };
    if (this.parent !== null) {
      patch[ "parent" ] = this.parent;
    }
    if (this.parentId !== null) {
      patch[ "parentId" ] = this.parentId;
    }
    if (this.nameValues !== null) {
      patch[ "nameValues" ] = this.nameValues;
    }
    if (this.tableAlias !== undefined && this.tableAlias !== null) {
      patch[ "tableAlias" ] = this.tableAlias;
      if (this.nameValue != null) {
        this.nameValue[ "name" ] = this.tableAlias + "." + this.nameValue[ "name" ];
      }
    }
    if (this.isUnique !== undefined) {
      patch[ "isUnique" ] = true;
    }
    else {
      patch[ "isUnique" ] = false;
    }
    if (this.getPatch) {
      patch[ "realm" ] = this.realm;
    }
    return patch;
  }
}
