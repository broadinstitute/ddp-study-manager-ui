export class TissueSmId {
  constructor( public smIdId: string, public smIdType: string, public smIdValue: string, public tissueId: string, public deleted:boolean ) {
    this.smIdId = smIdId;
    this.smIdType = smIdType;
    this.smIdValue = smIdValue;
    this.tissueId = tissueId;
    this.deleted = deleted;
  }

  static parse( json ) {
    return new TissueSmId( json.smIdId, json.smIdType, json.smIdValue, json.tissueId, false );
  }

  static parseArray( jsonArray: any[] ) {
    let arr = [];
    if (jsonArray === undefined || jsonArray === null) {
      return arr;
    }
    jsonArray.forEach( ( val ) => {
      arr.push( this.parse( val ) );
    } );
    console.log(arr);
    return arr;
  }
}
