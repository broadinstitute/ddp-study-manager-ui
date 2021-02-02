import {TestResult} from "./test-result.model";

export class Sample {

  static DEACTIVATED: string = "deactivated";
  static SENT: string = "shipped";
  static RECEIVED: string = "received";
  static IN_QUEUE: string = "queue";
  static IN_ERROR: string = "error";

  constructor( public bspCollaboratorSampleId: string, public kitType: string, public scanDate: number, public error: boolean, public receiveDate: number, public deactivatedDate: number,
               public trackingNumberTo: string, public trackingNumberReturn: string, public kitLabel: string, public testResult: Array<TestResult>,
               public upsTrackingStatus: string, public upsReturnStatus: string, public externalOrderStatus: string, public externalOrderNumber: string, public externalOrderDate: number,
               public careEvolve: boolean, public uploadReason: string ) {
    this.bspCollaboratorSampleId = bspCollaboratorSampleId;
    this.kitType = kitType;
    this.scanDate = scanDate;
    this.error = error;
    this.receiveDate = receiveDate;
    this.deactivatedDate = deactivatedDate;
    this.trackingNumberTo = trackingNumberTo;
    this.trackingNumberReturn = trackingNumberReturn;
    this.kitLabel = kitLabel;
    this.testResult = testResult;
    this.upsTrackingStatus = upsTrackingStatus;
    this.upsReturnStatus = upsReturnStatus;
    this.externalOrderStatus = externalOrderStatus;
    this.externalOrderNumber = externalOrderNumber;
    this.externalOrderDate = externalOrderDate;
    this.careEvolve = careEvolve;
    this.uploadReason = uploadReason;
    if (this.uploadReason === "" || this.uploadReason === null || this.uploadReason === undefined) {
      this.uploadReason = "NORMAL";
    }
  }

  get sampleQueue() {
    if (this.externalOrderStatus !== null && this.externalOrderStatus !== undefined) {
      return this.externalOrderStatus + " (GBF)";
    }
    if (this.deactivatedDate !== 0) {
      return Sample.DEACTIVATED;
    }
    if (this.receiveDate !== 0) {
      return Sample.RECEIVED;
    }
    if (this.scanDate !== 0) {
      return Sample.SENT;
    }
    if (this.error) {
      return Sample.IN_ERROR;
    }
    return Sample.IN_QUEUE;
  }

  static parse( json ): Sample {
    let jsonData: any[];
    let testResults: Array<TestResult> = null;
    if (json.testResult != null) {
      let tmp: any = JSON.parse( String( json.testResult ) );
      if (tmp != null) {
        testResults = [];
        tmp.forEach( ( val ) => {
          let testResult = TestResult.parse( val );
          testResults.push( testResult );
        } );
      }
    }
    return new Sample( json.bspCollaboratorSampleId, json.kitType, json.scanDate, json.error, json.receiveDate, json.deactivatedDate, json.trackingNumberTo,
      json.trackingNumberReturn, json.kitLabel, testResults, json.upsTrackingStatus, json.upsReturnStatus, json.externalOrderStatus, json.externalOrderNumber, json.externalOrderDate,
      json.careEvolve, json.uploadReason );
  }
}
