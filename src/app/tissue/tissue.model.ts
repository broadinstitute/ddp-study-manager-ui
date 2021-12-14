export class Tissue {

  deleted: boolean = false;

  constructor(public tissueId: string, public oncHistoryDetailId: string, public notes: string, public countReceived: number,
              public tissueType: string, public tissueSite: string, public tumorType: string,
              public hE: string, public pathologyReport: string, public collaboratorSampleId: string, public blockSent: string,
              public scrollsReceived: string, public skId: string, public smId: string, public sentGp: string, public firstSmId: string,
              public additionalValuesJson: {}, public expectedReturn: string, public returnDate: string,
              public returnFedexId: string, public shlWorkNumber: string, public tissueSequence: string, public tumorPercentage: string,
              public scrollsCount: number, public ussCount: number, public blocksCount: number, public hECount: number) {
    this.tissueId = tissueId;
    this.oncHistoryDetailId = oncHistoryDetailId;
    this.notes = notes;
    this.countReceived = countReceived;
    this.tissueType = tissueType;
    this.tissueSite = tissueSite;
    this.tumorType = tumorType;
    this.hE = hE;
    this.pathologyReport = pathologyReport;
    this.collaboratorSampleId = collaboratorSampleId;
    this.blockSent = blockSent;
    this.scrollsReceived = scrollsReceived;
    this.skId = skId;
    this.smId = smId;
    this.sentGp = sentGp;
    this.firstSmId = firstSmId;
    this.additionalValuesJson = additionalValuesJson;
    this.expectedReturn = expectedReturn;
    this.returnDate = returnDate;
    this.returnFedexId = returnFedexId;
    this.shlWorkNumber = shlWorkNumber;
    this.tissueSequence = tissueSequence;
    this.tumorPercentage = tumorPercentage;
    this.scrollsCount = scrollsCount;
    this.ussCount = ussCount;
    this.blocksCount = blocksCount;
    this.hECount = hECount;
  }

  static parse(json): Tissue {
    let additionalValuesJson: {};
    let jsonData = json.additionalValuesJson;
    if (jsonData != null) {
      jsonData = "{" + jsonData.substring(1, jsonData.length - 1) + "}";
      additionalValuesJson = JSON.parse(jsonData);
    }
    return new Tissue(json.tissueId, json.oncHistoryDetailId, json.tNotes, json.countReceived, json.tissueType,
      json.tissueSite, json.tumorType, json.hE, json.pathologyReport, json.collaboratorSampleId, json.blockSent,
      json.scrollsReceived, json.skId, json.smId, json.sentGp, json.firstSmId, additionalValuesJson, json.expectedReturn,
      json.returnDate, json.returnFedexId, json.shlWorkNumber, json.tissueSequence, json.tumorPercentage,
      json.scrollsCount, json.ussCount, json.blocksCount, json.hECount);
  }
}
