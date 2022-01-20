export class TissueSmId {
  isSelected: boolean = false;
  constructor( public smIdPk: string, public smIdType: string, public smIdValue: string, public tissueId: string, public deleted:boolean ) {
    this.smIdPk = smIdPk;
    this.smIdType = smIdType;
    this.smIdValue = smIdValue;
    this.tissueId = tissueId;
    this.deleted = deleted;
  }

  static parse( json ) {
    return new TissueSmId( json.smIdPk, json.smIdType, json.smIdValue, json.tissueId, false );
  }

  static parseArray( jsonArray: any[] ) {
    let arr = new Array();
    if (jsonArray === undefined || jsonArray === null) {
      return arr;
    }
    jsonArray.forEach( ( val ) => {
      arr.push( this.parse( val ) );
    } );
    return arr;
  }
}
