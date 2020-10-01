export class TestResult {

  constructor(public result: string, public isCorrected: boolean, public timeCompleted: string) {
    this.result = result;
    this.isCorrected = isCorrected;
    this.timeCompleted = timeCompleted;
  }

  static parse( json ): TestResult {
    return new TestResult(json.result, json.isCorrected, json.timeCompleted);
  }
}
