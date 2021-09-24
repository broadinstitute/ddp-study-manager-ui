import {MedicalProvider} from "./medical-providers.model";

export class Computed {

  constructor( public meqScore?: number, public meqChronotype?: string,) {
    this.meqScore = meqScore;
    this.meqChronotype = meqChronotype;
  }

}
