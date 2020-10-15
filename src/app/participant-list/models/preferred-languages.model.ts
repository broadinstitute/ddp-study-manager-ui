export class PreferredLanguage {

  constructor(public languageCode: string, public displayName: string, public isDefault: boolean) {
    this.languageCode = languageCode;
    this.displayName = displayName;
    this.isDefault = isDefault;
  }

  static parse( json ): PreferredLanguage {
    return new PreferredLanguage(json.languageCode, json.displayName, json.isDefault);
  }
}
