export class Option {

  constructor( public optionStableId: string, public optionText: string, public nestedOptionText: string, public nestedOptions: Array<Option> ) {
    this.optionStableId = optionStableId;
    this.optionText = optionText;
    this.nestedOptionText = nestedOptionText;
    this.nestedOptions = nestedOptions;
  }

  isSelected( stableId: string) {
    if (stableId === this.optionStableId) {
      return true;
    }
    return false;
  }

  static parse( json ): Option {
    return new Option( json.optionStableId, json.optionText, json.nestedOptionText, json.nestedOptions );
  }
}
