export class PDFModel {
  configName: string;
  displayName: string;
  order: number;

  constructor( configName: string, displayName: string, order: number ) {
    this.configName = configName;
    this.displayName = displayName;
    this.order = order;
  }

  static parse( json ): PDFModel {
    return new PDFModel( json.configName, json.displayName, json.order );
  }
}
