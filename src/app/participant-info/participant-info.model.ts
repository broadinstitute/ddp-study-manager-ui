export class ParticipantInfo{
  constructor(public eligibility: string, public drFirstName: string, public drLastName: string, public drSuffix: string,
              public drAdrress: string, public drPhoneNumber: string, public drEmail: string, public ageOfDeath: string,
              public dateOfDeath: string, public causeOfDeath: string, public deathNotes: string,
              public careAtBrisbaneAustralia: boolean, public careAtShebaMedicalCenterIsrael: boolean,
              public careAtJohnsHopkins: boolean, public careAtJohannWolfgangGoetheUniversityGermany: boolean,
              public careAtNottinghamCityHospitalUK:boolean) {
    this.eligibility = eligibility;
    this.drFirstName = drFirstName;
    this.drLastName = drLastName;
    this.drSuffix = drSuffix;
    this.drAdrress = drAdrress;
    this.drPhoneNumber = drPhoneNumber;
    this.drEmail = drEmail;
    this.ageOfDeath = ageOfDeath;
    this.dateOfDeath = dateOfDeath;
    this.causeOfDeath = causeOfDeath;
    this.deathNotes = deathNotes;
    this.careAtBrisbaneAustralia = careAtBrisbaneAustralia;
    this.careAtShebaMedicalCenterIsrael = careAtShebaMedicalCenterIsrael;
    this.careAtJohnsHopkins = careAtJohnsHopkins;
    this.careAtJohannWolfgangGoetheUniversityGermany = careAtJohannWolfgangGoetheUniversityGermany;
    this.careAtNottinghamCityHospitalUK = careAtNottinghamCityHospitalUK;
  }
}
