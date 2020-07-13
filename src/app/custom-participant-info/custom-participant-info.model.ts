export class CustomParticipantInfo {
  constructor( public ddpParticipantId: string, public eligibility: string, public drFirstName: string, public drLastName: string, public drSuffix: string,
               public drAddress: string, public drPhoneNumber: string, public drEmail: string, public ageOfDeath: string,
               public dateOfDeath: string, public causeOfDeath: string, public deathNotes: string,
               public careAtBrisbaneAustralia: boolean, public careAtShebaMedicalCenterIsrael: boolean,
               public careAtJohnsHopkins: boolean, public careAtJohannWolfgangGoetheUniversityGermany: boolean,
               public careAtNottinghamCityHospitalUK: boolean,
               public  genomeStudyCollaboratorId: string,
               public  consentedForGenomeStudy: string,
               public  genomeStudyDateOfConsent: string,
               public  ethnicity: string,
               public  hasASibling: string,
               public  genomeStudyShippingAddress: string,
               public  sampleKitStatus: string,
               public  salivaBarCode: string,
               public  sampleKitTrackingNumber: string,
               public  sampleKitShippingDate: string,
               public  participantReceivedDate: string,
               public  sampleKitReceivedBackDate: string,
               public  dateOfCompletingSequencing: string,
               public  dateOfDataReleasedInRepository: string,
               public  genomeStudyNotes: string
  ) {

    this.ddpParticipantId = ddpParticipantId;
    this.eligibility = eligibility;
    this.drFirstName = drFirstName;
    this.drLastName = drLastName;
    this.drSuffix = drSuffix;
    this.drAddress = drAddress;
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
    this.genomeStudyCollaboratorId = genomeStudyCollaboratorId;
    this.consentedForGenomeStudy = consentedForGenomeStudy;
    this.genomeStudyDateOfConsent = genomeStudyDateOfConsent;
    this.ethnicity = ethnicity;
    this.hasASibling = hasASibling;
    this.genomeStudyShippingAddress = genomeStudyShippingAddress;
    this.sampleKitStatus = sampleKitStatus;
    this.salivaBarCode = salivaBarCode;
    this.sampleKitTrackingNumber = sampleKitTrackingNumber;
    this.participantReceivedDate = participantReceivedDate;
    this.sampleKitReceivedBackDate = sampleKitReceivedBackDate;
    this.dateOfCompletingSequencing = dateOfCompletingSequencing;
    this.dateOfDataReleasedInRepository = dateOfDataReleasedInRepository;
    this.genomeStudyNotes = genomeStudyNotes;


  }
}
