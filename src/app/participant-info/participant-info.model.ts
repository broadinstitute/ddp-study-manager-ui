export class ParticipantInfo {

  constructor( public ddpParticipantId: string, public firstName: string, public lastName: string, public middleName: string, public suffix: string, public title: string, public gender: string,
               public dateOfBirth: string, public language: string, public timeZone: string, public phoneH: string, public phoneM: string, public phoneW: string, public email: string,
               public altEmail: string, public addressP: string, public cityP: string, public stateP: string, public countryP: string, public zipP: string,
               public addressM: string, public cityM: string, public stateM: string, public countryM: string, public zipM: string, public dnc: string, public dncComment ) {

    this.ddpParticipantId = ddpParticipantId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.middleName = middleName;
    this.suffix = suffix;
    this.title = title;
    this.gender = gender;
    this.dateOfBirth = dateOfBirth;
    this.language = language;
    this.timeZone = timeZone;
    this.phoneH = phoneH;
    this.phoneM = phoneM;
    this.phoneW = phoneW;
    this.email = email;
    this.altEmail = altEmail;
    this.addressP = addressP;
    this.cityP = cityP;
    this.stateP = stateP;
    this.countryP = countryP;
    this.zipP = zipP;
    this.addressM = addressM;
    this.cityM = cityM;
    this.stateM = stateM;
    this.countryM = countryM;
    this.zipM = zipM;
    this.dnc = dnc;
    this.dncComment = dncComment;
  }

}
