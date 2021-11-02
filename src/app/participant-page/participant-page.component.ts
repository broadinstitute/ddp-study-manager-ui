import {Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import {TabDirective} from "ngx-bootstrap/tabs";
import {ActivatedRoute, Router} from "@angular/router";
import {ActivityDefinition} from "../activity-data/models/activity-definition.model";
import {FieldSettings} from "../field-settings/field-settings.model";
import {ParticipantData} from "../participant-list/models/participant-data.model";
import {PreferredLanguage} from "../participant-list/models/preferred-languages.model";
import {Participant} from "../participant-list/participant-list.model";
import {PDFModel} from "../pdf-download/pdf-download.model";

import {ComponentService} from "../services/component.service";
import {Auth} from "../services/auth.service";
import {DSMService} from "../services/dsm.service";
import {MedicalRecord} from "../medical-record/medical-record.model";
import {RoleService} from "../services/role.service";
import {Statics} from "../utils/statics";
import {Utils} from "../utils/utils";
import {OncHistoryDetail} from "../onc-history-detail/onc-history-detail.model";
import {ModalComponent} from "../modal/modal.component";
import {Tissue} from "../tissue/tissue.model";
import {Value} from "../utils/value.model";
import {Result} from "../utils/result.model";
import {NameValue} from "../utils/name-value.model";
import {Abstraction} from "../medical-record-abstraction/medical-record-abstraction.model";
import {AbstractionGroup, AbstractionWrapper} from "../abstraction-group/abstraction-group.model";
import {PatchUtil} from "../utils/patch.model";
import { ParticipantUpdateResultDialogComponent } from "../dialogs/participant-update-result-dialog.component";
import { AddFamilyMemberComponent } from "../popups/add-family-member/add-family-member.component";
import { Sample } from "../participant-list/models/sample.model";
import { ParticipantDSMInformation } from "../participant-list/models/participant.model";

var fileSaver = require( "file-saver" );

@Component( {
  selector: "app-participant-page",
  templateUrl: "./participant-page.component.html",
  styleUrls: [ "./participant-page.component.css" ]
} )
export class ParticipantPageComponent implements OnInit, OnDestroy {

  @ViewChild(ModalComponent)
  public universalModal: ModalComponent;

  @Input() parentList: string;
  @Input() participant: Participant;
  @Input() drugs: string[];
  @Input() cancers: string[];
  @Input() preferredLanguage: Array<PreferredLanguage>;
  @Input() hideMRTissueWorkflow: boolean;
  @Input() activeTab: string;
  @Input() activityDefinitions: Array<ActivityDefinition>;
  @Input() settings: {};
  @Input() mrCoverPdfSettings: Value[];
  @Input() oncHistoryId: string;
  @Input() mrId: string;
  @Input() isAddFamilyMember: boolean;
  @Input() showGroupFields: boolean;
  @Input() hideSamplesTab: boolean;
  @Input() showContactInformation: boolean;
  @Input() showComputedObject: boolean;
  @Output() leaveParticipant = new EventEmitter();
  @Output('ngModelChange') update = new EventEmitter();

  participantExited: boolean = true;
  participantNotConsented: boolean = true;

  medicalRecord: MedicalRecord;
  oncHistoryDetail: OncHistoryDetail;

  errorMessage: string;
  additionalMessage: string;

  source = 'normal';

  loadingParticipantPage: boolean = false;

  noteMedicalRecord: MedicalRecord;

  showParticipantRecord: boolean = false;
  showMedicalRecord: boolean = false;
  showTissue: boolean = false;
  isOncHistoryDetailChanged: boolean = false;
  disableTissueRequestButton: boolean = true;

  facilityName: string;

  warning: string;

  currentPatchField: string;
  patchFinished: boolean = true;

  fileListUsed: string[] = [];

  abstractionFields: Array<AbstractionGroup>;
  reviewFields: Array<AbstractionGroup>;
  qcFields: Array<AbstractionGroup>;
  finalFields: Array<AbstractionGroup>;

  gender: string;
  counterReceived: number = 0;
  pdfs: Array<PDFModel> = [];
  selectedPDF: string;
  disableDownload: boolean = false;

  updatedFirstName: string;
  updatedLastName: string;
  updatedEmail: string;
  updatingParticipant: boolean = false;
  private taskType: string;
  private checkParticipantStatusInterval: any;
  isEmailValid: boolean;

  accordionOpenedPanel: string = "";

  private payload = {};

  downloading: boolean = false;
  message: string = null;
  bundle: boolean = false;
  constructor( private auth: Auth, private compService: ComponentService, private dsmService: DSMService, private router: Router,
               private role: RoleService, private util: Utils, private route: ActivatedRoute, public dialog: MatDialog) {
    if (!auth.authenticated()) {
      auth.logout();
    }
    this.route.queryParams.subscribe( params => {
      let realm = params[ DSMService.REALM ] || null;
      if (realm != null) {
        //        this.compService.realmMenu = realm;
        this.leaveParticipant.emit( null );
      }
    } );
  }

  ngOnInit() {
    this.setDefaultProfileValues();
    this.payload = {
      participantGuid: this.participant.data.profile[ "guid" ],
      instanceName: this.compService.getRealm(),
      data: {}
    };
    this.checkParticipantStatusInterval = setInterval(() => {
      if (this.updatingParticipant) {
        this.dsmService.checkUpdatingParticipantStatus().subscribe(
          data => {
            let parsedData = JSON.parse(data.body);
            if (parsedData[ "resultType" ] === "SUCCESS"
                && this.isReturnedUserAndParticipantTheSame(parsedData)) {
              this.updateParticipantObjectOnSuccess();
              this.openResultDialog("Participant successfully updated");
            }
            else if (parsedData[ "resultType" ] === "ERROR"
                && this.isReturnedUserAndParticipantTheSame(parsedData)){
              this.openResultDialog(parsedData[ "errorMessage" ]);
            }
         },
         err => {
            this.openResultDialog("Error - Failed to update participant");
         }
        );
      };
    }, 5000);
    this.loadInstitutions();
    window.scrollTo( 0, 0 );
  }

  ngOnDestroy() {
    clearInterval(this.checkParticipantStatusInterval);
  }

  showFamilyMemberPopUpOnClick() {
    this.dialog.open(AddFamilyMemberComponent, {
      data: {participant : this.participant},
      disableClose : true,
    });
  }

  private setDefaultProfileValues() {
    this.updatedFirstName = this.participant.data.profile[ "firstName" ];
    this.updatedLastName = this.participant.data.profile[ "lastName" ];
    this.updatedEmail = this.participant.data.profile[ "email" ];
  }

  private isReturnedUserAndParticipantTheSame(parsedData: any) {
    return parsedData[ "participantGuid" ] === this.participant.data.profile[ "guid" ]
    && parsedData[ "userId"] === this.role.userID();
  }

  private updateParticipantObjectOnSuccess() {
    switch (this.taskType) {
      case "UPDATE_FIRSTNAME": {
        this.participant.data.profile[ "firstName" ] = this.updatedFirstName;
        break;
      }
      case "UPDATE_LASTNAME": {
        this.participant.data.profile[ "lastName" ] = this.updatedLastName;
        break;
      }
      case "UPDATE_EMAIL": {
        this.participant.data.profile[ "email" ] = this.updatedEmail;
        break;
      }
    }
    this.taskType = "";
  }

  private openResultDialog(text: string) {
    this.updatingParticipant = false;
    this.dialog.open(ParticipantUpdateResultDialogComponent, {
      data: { message: text },
    });
  }

  hasRole(): RoleService {
    return this.role;
  }

  getUtil(): Utils {
    return this.util;
  }

  updateFirstName() {
    this.updatingParticipant = true;
    this.taskType = "UPDATE_FIRSTNAME";
    this.payload[ "data" ][ "firstName" ] = this.updatedFirstName;
    this.dsmService.updateParticipant(JSON.stringify(this.payload)).subscribe(
      data => {

      },
      err => {
        this.openResultDialog("Error - Failed to update participant");
      }
    );
    delete this.payload[ "data" ][ "firstName" ];
  }

  updateLastName() {
    this.updatingParticipant = true;
    this.taskType = "UPDATE_LASTNAME";
    this.payload[ "data" ][ "lastName" ] = this.updatedLastName;
    this.dsmService.updateParticipant(JSON.stringify(this.payload)).subscribe(
      data => {

      },
      err => {
        this.openResultDialog("Error - Failed to update participant");
      }
    );
    delete this.payload[ "data" ][ "lastName" ];
  }

  updateEmail() {
    this.updatingParticipant = true;
    this.taskType = "UPDATE_EMAIL";
    this.payload[ "data" ][ "email" ] = this.updatedEmail;
    this.dsmService.updateParticipant(JSON.stringify(this.payload)).subscribe(
      data => {

      },
      err => {
        this.openResultDialog("Error - Failed to update participant");
      }
    );
    delete this.payload[ "data" ][ "email" ];
  }

  validateEmailInput( changedValue ) {
    const regexToValidateEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let isValid = regexToValidateEmail.test(changedValue);
    if (isValid) {
      this.isEmailValid = true;
      this.updatedEmail = changedValue;
      this.update.emit(changedValue);
    } else {
      this.isEmailValid = false;
    }
  }

  getLanguageName(languageCode: string): string {
    if (this.preferredLanguage != null && this.preferredLanguage.length > 0) {
      let language = this.preferredLanguage.find( obj => {
        return obj.languageCode === languageCode;
      } );
      if (language != null) {
        return language.displayName;
      }
    }
    return "";
  }

  getGroupHref( group: string ): string {
    return "#" + group;
  }

  onOpenChangeAccordionPanel(event: boolean) {
    if (!event) {
      this.accordionOpenedPanel = "";
    }
  }

  openAccordionPanel(columnName: string) {
    this.accordionOpenedPanel = columnName;
  }

  isAccordionPanelOpen(columnName: string) {
    return this.showGroupFields || this.accordionOpenedPanel === columnName;
  }

  private loadInstitutions() {
    if (this.participant.data != null) {
      if (this.participant.data.status === undefined || this.participant.data.status.indexOf( Statics.EXITED ) == -1) {
        this.participantExited = false;
      }
      if (this.participant.data.status === undefined || this.participant.data.status.indexOf( Statics.CONSENT_SUSPENDED ) == -1) {
        this.participantNotConsented = false;
      }
      this.pdfs = new Array<PDFModel>();
      if (this.participant.data != null && this.participant.data.dsm != null && this.participant.data.dsm[ "pdfs" ] != null && this.participant.data.dsm[ "pdfs" ].length > 0) {
        let tmp = this.participant.data.dsm[ "pdfs" ];
        if (tmp != null && tmp.length > 0) {
          let pos = 1;
          if (this.participant.oncHistoryDetails != null && this.participant.oncHistoryDetails.length > 0) {
            this.pdfs.push( new PDFModel( "request", "Tissue Request PDF", pos ) );
            pos += 1;
          }
          tmp.forEach( (pdf, index) => {
            pdf.order = index + pos;// +2 because 1 is cover pdf
            this.pdfs.push(pdf);
          })
          this.pdfs.push(new PDFModel('irb','IRB Letter', tmp.length + pos));
        }
      }
      this.counterReceived = 0;
      let medicalRecords = this.participant.medicalRecords;
      for (let mr of medicalRecords) {
        if (mr.mrDocumentFileNames != null) {
          let files = mr.mrDocumentFileNames.split( /[\s,|;]+/ );
          for (let file of files) {
            if (this.fileListUsed.indexOf( file ) == -1) {
              this.fileListUsed.push( file );
            }
          }
        }
        if (mr.crRequired) {
          this.showParticipantRecord = true;
        }
        //add that here in case a mr was received but participant object does not know it
        if (mr.mrReceived) {
          this.counterReceived = this.counterReceived + 1;
        }
        if (this.counterReceived > 0) {
          if (this.hasRole().isAbstracter() || this.hasRole().isQC()) {
            this.loadAbstractionValues();
          }
        }
      }
      if (this.participant.participant != null) {
        this.addEmptyOncHistoryRow();
      }
    }
  }

  addEmptyOncHistoryRow() {
    if (this.participant.data.dsm[ "hasConsentedToTissueSample" ]) {
      let hasEmptyOncHis = false;
      for (let oncHis of this.participant.oncHistoryDetails) {
        if (oncHis.oncHistoryDetailId === null) {
          hasEmptyOncHis = true;
        } else {
          //get gender information
          if (this.gender === null || this.gender == undefined) {
            this.gender = oncHis.gender;
          } else {
            if (this.gender != oncHis.gender && oncHis.gender != undefined && oncHis.gender != null) {
              // console.log( this.gender );
              // console.log( oncHis.gender );
              this.gender = "Discrepancy in gender between the different oncHistories";
            }
          }
        }
        if (oncHis.tissues == null) {
          let tissues: Array<Tissue> = [];
          tissues.push( new Tissue( null, oncHis.oncHistoryDetailId, null, null, null, null,
            null, null, null, null, null, null, null, null
            , null, null, null, null, null, null, null, null, null,
            null, null, null, null ) );
          oncHis.tissues = tissues;
        } else if (oncHis.tissues.length < 1) {
          oncHis.tissues.push( new Tissue( null, oncHis.oncHistoryDetailId, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null
            , null, null, null, null, null, null, null,
            null, null, null, null ) );
        }
      }
      if (!hasEmptyOncHis) {
        let tissues: Array<Tissue> = [];
        tissues.push( new Tissue( null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null,
          null, null, null, null ) );

        let oncHis = new OncHistoryDetail( this.participant.participant.participantId,
          null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, tissues, null, null, null,
          null );
        this.participant.oncHistoryDetails.push( oncHis );
      }
    }
  }

  openMedicalRecord( medicalRecord: MedicalRecord ) {
    if (medicalRecord != null) {
      this.medicalRecord = medicalRecord;
      this.showMedicalRecord = true;
    }
  }

  valueChanged( value: any, parameterName: string, tableAlias: string ) {
    let v;
    if (parameterName === "additionalValues") {
      v = JSON.stringify( value );
    } else if (typeof value === "string") {
      this.participant.participant[ parameterName ] = value;
      v = value;
    } else {
      if (value.srcElement != null && typeof value.srcElement.value === "string") {
        v = value.srcElement.value;
      } else if (value.checked != null) {
        v = value.checked;
      }
    }
    if (v !== null) {
      let participantId = this.participant.participant.participantId;
      let ddpParticipantId = this.participant.data.profile[ "guid" ];
      if (this.participant.data.profile[ "legacyAltPid" ] != null && this.participant.data.profile[ "legacyAltPid" ] != undefined && this.participant.data.profile[ "legacyAltPid" ] !== '') {
        ddpParticipantId = this.participant.data.profile[ "legacyAltPid" ];
      }
      let patch1 = new PatchUtil( participantId, this.role.userMail(),
        {name: parameterName, value: v}, null, 'ddpParticipantId', ddpParticipantId, tableAlias, null, localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), this.participant.participant.ddpParticipantId );
      patch1.realm = localStorage.getItem( ComponentService.MENU_SELECTED_REALM );
      let patch = patch1.getPatch();
      this.currentPatchField = parameterName;
      this.patchFinished = false;
      // console.log( JSON.stringify( patch ) );
      this.dsmService.patchParticipantRecord( JSON.stringify( patch ) ).subscribe(// need to subscribe, otherwise it will not send!
        data => {
          let result = Result.parse( data );
          if (result.code === 200 && result.body != null) {
            let jsonData: any | any[] = JSON.parse( result.body );
            if (jsonData instanceof Array) {
              jsonData.forEach( ( val ) => {
                let nameValue = NameValue.parse( val );
                this.participant.participant[ nameValue.name ] = nameValue.value;
              } );
            }
            else {
              if (jsonData.participantId != null && jsonData.participantId != undefined) {
                this.participant.participant.participantId = jsonData.participantId;
              }
            }
          }
          this.currentPatchField = null;
          this.patchFinished = true;
          this.additionalMessage = null;
        },
        err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.router.navigate( [Statics.HOME_URL] );
          }
          this.additionalMessage = "Error - Saving changed field \n" + err;
        }
      );
    }
  }

  oncHistoryValueChanged( value: any, parameterName: string, oncHis: OncHistoryDetail ) {
    let v;
    let realm: string = localStorage.getItem( ComponentService.MENU_SELECTED_REALM );
    if (typeof value === "string") {
      oncHis[ parameterName ] = value;
      v = value;
    } else if (value != null) {
      if (value.srcElement != null && typeof value.srcElement.value === "string") {
        v = value.srcElement.value;
      } else if (value.value != null) {
        v = value.value;
      } else if (value.checked != null) {
        v = value.checked;
      }
    }
    if (v !== null) {

      let patch1 = new PatchUtil( oncHis.oncHistoryDetailId, this.role.userMail(),
        {name: parameterName, value: v}, null, "participantId", oncHis.participantId, Statics.ONCDETAIL_ALIAS,  null, realm, this.participant.participant.ddpParticipantId);
      let patch = patch1.getPatch();
      this.patchFinished = false;
      this.currentPatchField = parameterName;
      this.dsmService.patchParticipantRecord( JSON.stringify( patch ) ).subscribe(// need to subscribe, otherwise it will not send!
        data => {
          let result = Result.parse( data );
          if (result.code === 200 && result.body != null) {
            let jsonData: any[] = JSON.parse( result.body );
            if (jsonData instanceof Array) {
              jsonData.forEach( ( val ) => {
                let nameValue = NameValue.parse( val );
                oncHis[ nameValue.name.substr( 3 ) ] = nameValue.value;
              } );
            }
          }
          this.patchFinished = true;
          this.currentPatchField = null;
        },
        err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.router.navigate( [Statics.HOME_URL] );
          }
        }
      );
    }
  }

  public leavePage(): boolean {
    this.medicalRecord = null;
    this.compService.justReturning = true;
    this.leaveParticipant.emit( this.participant );
    this.participant = null;
    return false;
  }

  openTissue( object: any ) {
    if (object != null) {
      this.oncHistoryDetail = object;
      this.showTissue = true;
    }
  }

  onOncHistoryDetailChange() {
    this.isOncHistoryDetailChanged = true;
  }

  doRequest(bundle: boolean) {
    let requestOncHistoryList: Array<OncHistoryDetail> = [];
    for (let oncHis of this.participant.oncHistoryDetails) {
      if (oncHis.selected) {
        requestOncHistoryList.push( oncHis );
      }
    }
    this.downloadRequestPDF( requestOncHistoryList, bundle );
    this.disableTissueRequestButton = true;
    this.source = 'normal';
    this.universalModal.hide();
  }

  requestTissue(bundle: boolean) {
    this.bundle = bundle;
    this.warning = null;
    let doIt: boolean = true;
    let somethingSelected: boolean = false;
    let firstOncHis: OncHistoryDetail = null;
    for (let oncHis of this.participant.oncHistoryDetails) {
      if (oncHis.selected) {
        somethingSelected = true;
        if (firstOncHis == null) {
          firstOncHis = oncHis;
          this.facilityName = firstOncHis.facility;
        }
        if (typeof firstOncHis.facility === "undefined" || firstOncHis.facility == null) {
          this.warning = "Facility is empty";
          doIt = false;
        }
        else if (this.participant.kits != null) {
          //no samples for pt
          let kitReturned: boolean = false;
          for (let kit of this.participant.kits) {
            if (kit.receiveDate != 0) {
              kitReturned = true;
              break;
            }
          }
          if (!kitReturned) {
            doIt = false;
            this.warning = "No samples returned for participant yet";
          }
        }
        else {
          if (firstOncHis.facility !== oncHis.facility ||
            firstOncHis.fPhone !== oncHis.fPhone ||
            firstOncHis.fFax !== oncHis.fFax) {
            doIt = false;
            this.warning = "Tissues are not from the same facility";
          }
        }
      }
    }
    if (doIt && this.facilityName != null) {
      this.doRequest(bundle);
    }
    else {
      this.source = 'warning';
      if (!somethingSelected) {
        this.warning = "No tissue selected for requesting";
      }
      this.universalModal.show();
    }
  }

  onOncHistoryDetailSelectionChange() {
    let oneSelected: boolean = false;
    let oncHistories = this.participant.oncHistoryDetails;
    if (oncHistories != null) {
      for (let oncHis of oncHistories) {
        if (oncHis.selected) {
          oneSelected = true;
          break;
        }
      }
    }
    this.disableTissueRequestButton = !oneSelected;
  }

  openNoteModal( item: MedicalRecord ) {
    this.noteMedicalRecord = item;
  }

  saveNote() {
    let patch1 = new PatchUtil( this.noteMedicalRecord.medicalRecordId, this.role.userMail(),
      {name: "mrNotes", value: this.noteMedicalRecord.mrNotes}, null, null, null, Statics.MR_ALIAS,  null, localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), this.participant.participant.ddpParticipantId );
    let patch = patch1.getPatch();


    this.dsmService.patchParticipantRecord( JSON.stringify( patch ) ).subscribe(// need to subscribe, otherwise it will not send!
      data => {
        // console.info( `response saving data: ${JSON.stringify( data, null, 2 )}` );
      },
      err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.router.navigate( [Statics.HOME_URL] );
        }
        this.additionalMessage = "Error - Saving paper C/R changes \n" + err;
      }
    );
    this.noteMedicalRecord = null;
    this.universalModal.hide();
  }

  downloadRequestPDF( requestOncHistoryList: Array<OncHistoryDetail>, bundle: boolean ) {
    this.downloading = true;
    this.message = "Downloading... This might take a while";
    let configName = null;
    if (!bundle) {
      configName = "tissue";
    }
    this.dsmService.downloadPDF( this.participant.participant.ddpParticipantId, null, null, null, null,
      localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), configName, this.pdfs, requestOncHistoryList).subscribe(
      data => {
        var date = new Date();
        this.downloadFile( data, "_TissueRequest_" + this.facilityName + "_" + Utils.getDateFormatted( date, Utils.DATE_STRING_CVS ) );

        let oncHistories = this.participant.oncHistoryDetails;
        if (oncHistories != null) {
          for (let oncHis of oncHistories) {
            if (oncHis.selected) {
              let date = new Date();
              if (oncHis.tFaxSent == null) {
                oncHis.tFaxSent = Utils.getFormattedDate( date );
                oncHis.tFaxSentBy = this.role.userID();
                this.oncHistoryValueChanged( oncHis.tFaxSent, "tFaxSent", oncHis );
              } else if (oncHis.tFaxSent2 == null) {
                oncHis.tFaxSent2 = Utils.getFormattedDate( date );
                oncHis.tFaxSent2By = this.role.userID();
                this.oncHistoryValueChanged( oncHis.tFaxSent2, "tFaxSent2", oncHis );
              } else {
                oncHis.tFaxSent3 = Utils.getFormattedDate( date );
                oncHis.tFaxSent3By = this.role.userID();
                this.oncHistoryValueChanged( oncHis.tFaxSent3, "tFaxSent3", oncHis );
              }
              oncHis.changedBy = this.role.userMail();
              oncHis.changed = true;
              oncHis.selected = false;
              this.isOncHistoryDetailChanged = true;
            }
          }
          this.facilityName = null;
        }
        this.downloading = false;
        this.message = "Download finished."
      },
      err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.router.navigate( [Statics.HOME_URL] );
        }
        this.disableTissueRequestButton = false;
        this.downloading = false;
        this.message = "Failed to download pdf.";
      }
    );
    window.scrollTo( 0, 0 );
  }

  downloadFile( data: any, type: string ) {
    var blob = new Blob( [data], {type: "application/pdf"} );

    let shortId = this.participant.data.profile[ "hruid" ];

    fileSaver.saveAs( blob, shortId + type + Statics.PDF_FILE_EXTENSION );
  }

  getButtonColorStyle( notes: string ): string {
    if (notes != null && notes !== "") {
      return "primary";
    }
    return "basic";
  }

  onSelect( data: TabDirective, tabName: string ): void {
    if (data instanceof TabDirective) {
      // this.selectedTabTitle = data.heading;
      this.activeTab = tabName;
    }
  }

  tabActive( tab: string ): boolean {
    if (this.activeTab === tab) {
      return true;
    }
    return false;
  }

  displayTab( fieldSetting: FieldSettings ): boolean {
    if (fieldSetting != null && fieldSetting.possibleValues != null) {
      let value: Value[] = fieldSetting.possibleValues;
      if (value.length == 1 && value[0] != null && value[0].value != null) {
        if (this.participant != null && this.participant.data != null && this.participant.data.activities != null) {
          let activity = this.participant.data.activities.find( x => x.activityCode === value[0].value );
          if (activity != null) {
            return true;
          }
          else {
            return false;
          }
        }
      }
    }
    return true;
  }

  isPatchedCurrently( field: string ): boolean {
    if (this.currentPatchField === field) {
      return true;
    }
    return false;
  }

  currentField( field: string ) {
    if (field != null || ( field == null && this.patchFinished )) {
      this.currentPatchField = field;
    }
  }

  getInstitutionCount(): number {
    let counter = 0;
    let medicalRecords = this.participant.medicalRecords;
    for (let med of medicalRecords) {
      if (med.showInstitution()) {
        counter = counter + 1;
      }
    }
    return counter;
  }

  getBloodConsent(): boolean {
    return this.participant.data.dsm[ "hasConsentedToBloodDraw" ];
  }

  getTissueConsent(): boolean {
    return this.participant.data.dsm[ "hasConsentedToTissueSample" ];
  }

  private loadAbstractionValues() {
    if (this.participant.participant != null && this.participant.participant.ddpParticipantId != null) {
      // this.summaryFields = [];
      this.loadingParticipantPage = true;
      let ddpParticipantId = this.participant.participant.ddpParticipantId;
      this.dsmService.getAbstractionValues( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), ddpParticipantId ).subscribe(
        data => {
          let jsonData: any | any[];
          if (data != null) {
            jsonData = AbstractionWrapper.parse( data );
            if (jsonData.finalFields != null) {
              this.finalFields = [];
              jsonData.finalFields.forEach( ( val ) => {
                let abstractionFieldValue = AbstractionGroup.parse( val );
                this.finalFields.push( abstractionFieldValue );
              } );
            } else {
              if (jsonData.abstraction != null) {
                this.abstractionFields = [];
                jsonData.abstraction.forEach( ( val ) => {
                  let abstractionFieldValue = AbstractionGroup.parse( val );
                  this.abstractionFields.push( abstractionFieldValue );
                } );
              }
              if (jsonData.review != null) {
                this.reviewFields = [];
                jsonData.review.forEach( ( val ) => {
                  let abstractionFieldValue = AbstractionGroup.parse( val );
                  this.reviewFields.push( abstractionFieldValue );
                } );
              }
              if (jsonData.qc != null) {
                this.qcFields = [];
                jsonData.qc.forEach( ( val ) => {
                  let abstractionFieldValue = AbstractionGroup.parse( val );
                  this.qcFields.push( abstractionFieldValue );
                } );
              }
            }
          }
          this.loadingParticipantPage = false;
        },
        err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.auth.logout();
          }
        }
      );
    }
  }

  lockParticipant( abstraction: Abstraction ) {
    this.loadingParticipantPage = true;
    let ddpParticipantId = this.participant.participant.ddpParticipantId;
    this.dsmService.changeMedicalRecordAbstractionStatus( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), ddpParticipantId, "in_progress", abstraction ).subscribe(// need to subscribe, otherwise it will not send!
      data => {
        let result = Result.parse( data );
        if (result.code != 200) {
          this.additionalMessage = "Couldn't lock participant";
        } else {
          if (result.code === 200 && result.body != null) {
            let jsonData: any | any[] = JSON.parse( result.body );
            let abstraction: Abstraction = Abstraction.parse( jsonData );
            this.participant[ abstraction.activity ] = abstraction;
            this.activeTab = abstraction.activity;
            if (this.participant.abstractionActivities != null) {
              let activity = this.participant.abstractionActivities.find( activity => activity.activity === abstraction.activity );
              if (activity != null) {
                let index = this.participant.abstractionActivities.indexOf( activity );
                if (index != -1) {
                  activity.aStatus = abstraction.aStatus;
                  this.participant.abstractionActivities[ index ] = activity;
                }
              } else {
                this.participant.abstractionActivities.push( abstraction );
              }
            } else {
              this.participant.abstractionActivities = [];
              this.participant.abstractionActivities.push( abstraction );
            }
            this.additionalMessage = null;
          } else {
            this.additionalMessage = "Error";
          }
        }
        this.loadingParticipantPage = false;
      },
      err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.router.navigate( [Statics.HOME_URL] );
        }
      }
    );
  }

  breakLockParticipant( abstraction: Abstraction ) {
    let ddpParticipantId = this.participant.participant.ddpParticipantId;
    this.dsmService.changeMedicalRecordAbstractionStatus( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), ddpParticipantId, "clear", abstraction ).subscribe(// need to subscribe, otherwise it will not send!
      data => {
        let result = Result.parse( data );
        if (result.code != 200) {
          this.additionalMessage = "Couldn't break lock of participant";
        } else {
          if (result.code === 200 && result.body != null) {
            let jsonData: any | any[] = JSON.parse( result.body );
            let abstraction: Abstraction = Abstraction.parse( jsonData );
            this.participant[ abstraction.activity ] = abstraction;
            let activity = this.participant.abstractionActivities.find( activity => activity.activity === abstraction.activity );
            if (activity != null) {
              let index = this.participant.abstractionActivities.indexOf( activity );
              if (index != -1) {
                activity.aStatus = abstraction.aStatus;
                this.participant.abstractionActivities[ index ] = activity;
              }
            }
            this.additionalMessage = null;
          } else {
            this.additionalMessage = "Error";
          }
        }
      },
      err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.router.navigate( [Statics.HOME_URL] );
        }
      }
    );
  }

  submitParticipant( abstraction: Abstraction ) {
    let ddpParticipantId = this.participant.participant.ddpParticipantId;
    this.dsmService.changeMedicalRecordAbstractionStatus( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), ddpParticipantId, "submit", abstraction ).subscribe(// need to subscribe, otherwise it will not send!
      data => {
        let result = Result.parse( data );
        if (result.code != 200 && result.body != null) {
          this.additionalMessage = result.body;
          abstraction.colorNotFinished = true;
        } else if (result.code === 200 && result.body != null) {
          let jsonData: any | any[] = JSON.parse( result.body );
          let abstraction: Abstraction = Abstraction.parse( jsonData );
          this.participant[ abstraction.activity ] = abstraction;
          let activity = this.participant.abstractionActivities.find( activity => activity.activity === abstraction.activity );
          if (activity != null) {
            let index = this.participant.abstractionActivities.indexOf( activity );
            if (index != -1) {
              activity.aStatus = abstraction.aStatus;
              this.participant.abstractionActivities[ index ] = activity;
            }
          }
          this.additionalMessage = null;
          abstraction.colorNotFinished = false;
        } else {
          this.errorMessage = "Something went wrong! Please contact your DSM developer";
        }

        window.scrollTo( 0, 0 );
      },
      err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.router.navigate( [Statics.HOME_URL] );
        }
      }
    );
  }

  abstractionFilesUsedChanged( abstraction: Abstraction ) {
    this.currentPatchField = "filesUsed";
    this.patchFinished = false;
    let ddpParticipantId = this.participant.participant.ddpParticipantId;
    this.dsmService.changeMedicalRecordAbstractionStatus( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), ddpParticipantId, null, abstraction ).subscribe(// need to subscribe, otherwise it will not send!
      data => {
        let result = Result.parse( data );
        if (result.code != 200 && result.body != null) {
          this.additionalMessage = result.body;
        } else if (result.code === 200 && result.body != null) {
          let jsonData: any | any[] = JSON.parse( result.body );
          let abstraction: Abstraction = Abstraction.parse( jsonData );
          this.participant[ abstraction.activity ] = abstraction;
          this.getFileList( abstraction );
          this.additionalMessage = null;
          this.currentPatchField = null;
          this.patchFinished = true;
        } else {
          this.errorMessage = "Something went wrong! Please contact your DSM developer";
        }
      },
      err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.router.navigate( [Statics.HOME_URL] );
        }
      }
    );
  }

  addFileToParticipant( fileName: string, abstraction: Abstraction ) {
    if (abstraction.filesUsed != null && abstraction.filesUsed !== "") {
      let found: boolean = false;
      let files = abstraction.filesUsed.split( /[\s,|;]+/ );
      for (let file of files) {
        if (file === fileName) {
          found = true;
          break;
        }
      }
      if (!found) {
        abstraction.filesUsed = abstraction.filesUsed.concat( ", " + fileName );
        this.abstractionFilesUsedChanged( abstraction );
      }
    } else {
      abstraction.filesUsed = fileName;
      this.abstractionFilesUsedChanged( abstraction );
    }
    return false;
  }

  getFileList( abstraction: Abstraction ) {
    if (abstraction.filesUsed != null && abstraction.filesUsed !== "") {
      let files = abstraction.filesUsed.split( /[\s,|;]+/ );
      for (let file of files) {
        if (this.fileListUsed.indexOf( file ) == -1) {
          this.fileListUsed.push( file );
        }
      }
    }
    this.fileListUsed.sort( ( one, two ) => ( one > two ? 1 : -1 ) );
  }

  getMedicalRecordName( name: string, ddpInstitutionId: string ) {
    if (this.participant.data != null && this.participant.data.profile != null && this.participant.data.medicalProviders != null) {
      let medicalProvider = this.participant.data.medicalProviders.find( medicalProvider => {
        let tmpId = medicalProvider.legacyGuid != null && medicalProvider.legacyGuid !== 0 ? medicalProvider.legacyGuid : medicalProvider.guid;
        return tmpId === ddpInstitutionId;
      } );
      if (name != undefined && name != null && name !== "") {
        return name;
      } else {
        if (medicalProvider != null) {
          if ("PHYSICIAN" === medicalProvider.type) {
            return medicalProvider.physicianName;
          } else {
            return medicalProvider.institutionName;
          }
        }
      }
    }
  }

  getActivityDefinition( code: string, version: string ) {
    if (this.activityDefinitions != null) {
      return this.activityDefinitions.find( x => x.activityCode === code && x.activityVersion === version );
    }
    return null;
  }

  onAdditionalValueChange( evt: any, colName: string ) {
    let v;
    if (typeof evt === "string") {
      v = evt;
    } else {
      if (evt.srcElement != null && typeof evt.srcElement.value === "string") {
        v = evt.srcElement.value;
      } else if (evt.value != null) {
        v = evt.value;
      } else if (evt.checked != null) {
        v = evt.checked;
      }
    }
    if (v !== null) {
      if (this.participant.participant != null && this.participant.participant.additionalValues != null) {
        this.participant.participant.additionalValues[ colName ] = v;
      } else {
        let participantId = this.participant.data.profile[ "guid" ];
        if (this.participant.data.profile[ "legacyAltPid" ] != null && this.participant.data.profile[ "legacyAltPid" ] != undefined && this.participant.data.profile[ "legacyAltPid" ] !== '') {
          participantId = this.participant.data.profile[ "legacyAltPid" ];
        }
        this.participant.participant = new ParticipantDSMInformation(null, participantId, localStorage.getItem( ComponentService.MENU_SELECTED_REALM ),
          null, null, null, null, null, null, null,
          false, false, false, false, 0, null);
        let addArray = {};
        addArray[ colName ] = v;
        this.participant.participant.additionalValues = addArray;
      }
      this.valueChanged( this.participant.participant.additionalValues, "additionalValues", "r" );
    }
  }

  //display additional value
  getAdditionalValue( colName: string ): string {
    if (this.participant.participant != null && this.participant.participant.additionalValues != null) {
      if (this.participant.participant.additionalValues[ colName ] != undefined && this.participant.participant.additionalValues[ colName ] != null) {
        return this.participant.participant.additionalValues[ colName ];
      }
    }
    return "";
  }

  downloadPDFs( configName: string ) {
    this.disableDownload = true;
    this.dsmService.downloadPDF( this.participant.data.profile[ 'guid' ], null, null, null,null,
      this.compService.getRealm(), configName, null, null).subscribe(
      data => {
        this.downloadFile( data, "_" + configName );
        this.disableDownload = false;
      },
      err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.router.navigate( [Statics.HOME_URL] );
        }
        this.additionalMessage = "Error - Downloading consent pdf file\nPlease contact your DSM developer";
        this.disableDownload = false;
      },
    );
  }

  getParticipantData(fieldSetting: FieldSettings, personsParticipantData: ParticipantData) {
    if (this.participant && this.participant.participantData && personsParticipantData && fieldSetting.columnName) {
      if (personsParticipantData && personsParticipantData.data) {
        if (personsParticipantData.data[fieldSetting.columnName]) {
          return personsParticipantData.data[fieldSetting.columnName];
        } else if (fieldSetting.actions && fieldSetting.actions[0]) {
          if (fieldSetting.actions[0].type === 'CALC' && fieldSetting.actions[0].value && personsParticipantData.data[fieldSetting.actions[0].value]) {
            return this.countYears(personsParticipantData.data[fieldSetting.actions[0].value]);
          } else if (fieldSetting.actions[0].type === 'SAMPLE' && fieldSetting.actions[0].type2 === 'MAP_TO_KIT') {
            return this.getSampleFieldValue(fieldSetting, personsParticipantData);
          }
        }
      }
    }
    return "";
  }

  getParticipantDataFromSingleParticipant(fieldSetting: FieldSettings) {
    if (this.participant && this.participant.participantData && fieldSetting.columnName) {
      for (let participantData of this.participant.participantData) {
        if (participantData != null && participantData.data != null && participantData.data[fieldSetting.columnName] != null) {
          return participantData.data[fieldSetting.columnName];
        }
      }
    }
    return "";
  }

  dynamicFormType(settings: FieldSettings[]): boolean {
    return settings['TAB_GROUPED'];
  }

  getDisplayName(displayName: string, columnName: string) {
    if (displayName.indexOf('#') > -1) {
      let replacements: string[] = displayName.split('#');
      if (replacements != null && replacements.length > 0 && this.participant != null && this.participant.participantData != null) {
        let tmp = displayName;
        let participantData = this.participant.participantData.find(participantData => participantData.fieldTypeId === columnName);
        if (participantData != null && participantData.data != null) {
          replacements.forEach( replace => {
            let value = participantData.data[ replace.trim() ];
            if (value != null && value != undefined) {
              tmp = tmp.replace( '#' + replace.trim(), value );
            }
          } )
        }
        return tmp;
      }
      return displayName;
    }
    else {
      return displayName;
    }
  }

  getActivityData(fieldSetting: FieldSettings) {
    //type was activity or activity_staff and no saved staff answer. therefore lookup the activity answer
    return Utils.getActivityDataValues(fieldSetting, this.participant, this.activityDefinitions);
  }

  getActivityOptions(fieldSetting: FieldSettings) {
    if (fieldSetting.displayType === 'ACTIVITY' || fieldSetting.displayType === 'ACTIVITY_STAFF') {
      if (fieldSetting.possibleValues != null && fieldSetting.possibleValues[0] != null && fieldSetting.possibleValues[0].value != null
        && fieldSetting.possibleValues[0].type != null) {
        let tmp: string[] = fieldSetting.possibleValues[ 0 ].value.split( '.' );
        if (tmp != null && tmp.length > 1) {
          if (tmp.length == 2) {
            if (this.activityDefinitions != null) {
              let definition: ActivityDefinition = this.activityDefinitions.find( definition => definition.activityCode === tmp[ 0 ] );
              if (definition != null && definition.questions != null) {
                let question = definition.questions.find( question => question.stableId === tmp[ 1 ] );
                if (question != null) {// && question.options != null) {
                  if (question.questionType !== 'BOOLEAN' && question.options != null) {
                    let options: NameValue[] = [];
                    for (let i = 0; i < question.options.length; i++) {
                      options.push( new NameValue( question.options[ i ].optionText, question.options[ i ].optionStableId ));
                    }
                    return options;
                  }
                  else {
                    let options: string[] = [];
                    options.push( "Yes" );
                    options.push( "No" );
                    return options;
                  }
                }
              }
            }
          }
          else if (tmp.length === 3) {
            let options: string[] = [];
            options.push( "Yes" );
            options.push( "No" );
            return options;
          }
        }
      }
    }
    return [];
  }

  formPatch(value: any, fieldSetting: FieldSettings, groupSetting: FieldSettings, dataId?: string) {
    if (fieldSetting == null || fieldSetting.fieldType == null) {
      this.errorMessage = "Didn't save change";
      return;
    }
    let fieldTypeId = fieldSetting.fieldType;
    if (groupSetting != null) {
      fieldTypeId = groupSetting.fieldType;
    }
    if (this.participant != null && this.participant.participantData != null && fieldTypeId != null && fieldSetting.columnName != null && dataId != null) {
      let participantData: ParticipantData = this.participant.participantData.find(participantData => participantData.dataId === dataId);
      if (participantData == null) {
        let data: { [ k: string ]: any } = {};
        data[fieldSetting.columnName] = value;
        participantData = new ParticipantData (null, fieldTypeId, data );
        this.participant.participantData.push(participantData);
      }
      if (participantData != null && participantData.data != null) {
        participantData.data[fieldSetting.columnName] = value;

        let nameValue: { name: string, value: any }[] = [];
        nameValue.push({name: "d.data", value: JSON.stringify(participantData.data)});
        let participantDataSec: ParticipantData = null;
        let actionPatch: Value[] = null;
        if (fieldSetting.actions != null) {
          fieldSetting.actions.forEach(( action ) => {
            if (action != null && action.name != null && action.name != undefined && action.type != null && action.type != undefined) {
              participantDataSec = this.participant.participantData.find(participantData => participantData.fieldTypeId === action.type);
              if (participantDataSec == null) {
                if (action.type !== 'ELASTIC_EXPORT.workflows' && action.type !== "PARTICIPANT_EVENT") {
                  let data: { [ k: string ]: any } = {};
                  data[ action.name ] = action.value;
                  participantDataSec = new ParticipantData( null, action.type, data );
                }
                else {
                  //all others studies we do the actions for everyone
                  if (actionPatch === null) {
                    actionPatch = [];
                  }
                  actionPatch.push( action );
                }
              }
              if (participantDataSec != null && participantDataSec.data != null) {
                participantDataSec.data[ action.name ] = action.value;
                nameValue.unshift({name: "d.data", value: JSON.stringify(participantDataSec.data)});
              }
            }
          });
        }
        if (fieldSetting.fieldType === "RADIO" && fieldSetting.possibleValues != null) {
          let possibleValues = fieldSetting.possibleValues;
          let possibleValue = possibleValues.find(value => value.name === fieldSetting.columnName && value.values != null)
        }

        let participantId = this.participant.data.profile[ "guid" ];
        if (this.participant.data.profile[ "legacyAltPid" ] != null && this.participant.data.profile[ "legacyAltPid" ] != undefined && this.participant.data.profile[ "legacyAltPid" ] !== '') {
          participantId = this.participant.data.profile[ "legacyAltPid" ];
        }
        let patch = {
          id: participantData.dataId,
          parent: "participantDataId",
          parentId: participantId,
          user: this.role.userMail(),
          fieldId: fieldTypeId,
          realm:  localStorage.getItem( ComponentService.MENU_SELECTED_REALM ),
          nameValues: nameValue,
          actions: actionPatch,
          ddpParticipantId: participantId
        };

        this.dsmService.patchParticipantRecord( JSON.stringify( patch ) ).subscribe(// need to subscribe, otherwise it will not send!
          data => {
            let result = Result.parse( data );
            if (result.code === 200) {
              if (result.body != null && result.body !== "") {
                let jsonData: any | any[] = JSON.parse( result.body );
                if (jsonData.participantDataId !== undefined && jsonData.participantDataId !== "") {
                  if (participantData != null) {
                    participantData.dataId = jsonData.participantDataId;
                  }
                }
              }
            }
            this.patchFinished = true;
          },
          err => {
            if (err._body === Auth.AUTHENTICATION_ERROR) {
              this.router.navigate( [ Statics.HOME_URL ] );
            }
          }
        );
      }
    }
  }

  createRelativeTabHeading(data: any): string {
    if (data) {
      if (!data.FIRSTNAME) {
        data.FIRSTNAME = '';
      }
      if (!data.COLLABORATOR_PARTICIPANT_ID) {
        data.COLLABORATOR_PARTICIPANT_ID = '';
      }
      return data.FIRSTNAME + " - " + data.COLLABORATOR_PARTICIPANT_ID;
    }
    return "";
  }

  getSampleFieldValue(fieldSetting: FieldSettings, personsParticipantData: ParticipantData): string {
    let sample: Sample = this.participant.kits.find(kit => kit.bspCollaboratorSampleId === personsParticipantData.data['COLLABORATOR_PARTICIPANT_ID']);
    if (sample && fieldSetting.actions[0].value && sample[fieldSetting.actions[0].value] && fieldSetting.displayType) {
      if (fieldSetting.displayType === 'DATE') {
        return new Date(sample[fieldSetting.actions[0].value]).toISOString().split('T')[0];
      }
      return sample[fieldSetting.actions[0].value];
    }
    return "";
  }

  countYears(startDate: string): number {
    let diff = Date.now() - Date.parse(startDate);
    let diffDate = new Date(diff);
    return Math.abs(diffDate.getUTCFullYear() - 1970);
  }

  findDataId(fieldSetting: FieldSettings): string {
    if (this.participant && this.participant.participantData) {
      let participantDataOfFieldSetting = this.participant.participantData.find(participantData => participantData.fieldTypeId === fieldSetting.fieldType);
      if (participantDataOfFieldSetting) {
        return participantDataOfFieldSetting.dataId;
      }
    }
    return "";
  }

  doNothing(source: string) { //needed for the menu, otherwise page will refresh!
    this.source = source;
    this.universalModal.show();
    return false;
  }
}
