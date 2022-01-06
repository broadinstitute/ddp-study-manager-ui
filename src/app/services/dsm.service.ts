import {Injectable} from "@angular/core";
import {Headers, Http, RequestOptions, Response, ResponseContentType, URLSearchParams} from "@angular/http";
import {Router} from "@angular/router";
import {JwtHelper} from "angular2-jwt";
import {Observable} from "rxjs";
import {Filter} from "../filter-column/filter-column.model";
import {ViewFilter} from "../filter-column/models/view-filter.model";
import {Abstraction} from "../medical-record-abstraction/medical-record-abstraction.model";
import {OncHistoryDetail} from "../onc-history-detail/onc-history-detail.model";
import {PDFModel} from "../pdf-download/pdf-download.model";
import {Statics} from "../utils/statics";
import {Value} from "../utils/value.model";
import {ComponentService} from "./component.service";
import {LoggingService} from "./logging.service";
import {RoleService} from "./role.service";
import {SessionService} from "./session.service";

declare var DDP_ENV: any;

@Injectable()
export class DSMService {

  public static UI: string = "ui/";

  public static REALM: string = "realm";
  public static TARGET: string = "target";
  public static SCAN_TRACKING: string = "scanTracking";
  public static SCAN_RECEIVED: string = "scanReceived";

  private baseUrl = DDP_ENV.baseUrl;

  constructor( private http: Http, private sessionService: SessionService, private role: RoleService, private router: Router, private logger: LoggingService ) {
  }

  public transferScan( scanTracking: boolean, json: string ) {
    let url = this.baseUrl + DSMService.UI;
    if (scanTracking) {
      url += "trackingScan";
    }
    else {
      url += "finalScan";
    }
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.post( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public setKitReceivedRequest( json: string ) {
    let url = this.baseUrl + DSMService.UI + "receivedKits";
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.post( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public updateParticipant( json: string ) {
    let url = this.baseUrl + DSMService.UI + "editParticipant";
    return this.http.put( url, json, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  sendAnalyticsMetric( realm: string, passed: number ) {
    let url = this.baseUrl + DSMService.UI + "googleAnalytics";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "timer", value: passed} );
    return this.http.patch( url, null, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public checkUpdatingParticipantStatus() {
    let url = this.baseUrl + DSMService.UI + "editParticipantMessageStatus";
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public setKitSentRequest( json: string ) {
    let url = this.baseUrl + DSMService.UI + "sentKits";
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.post( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public addFamilyMemberRequest( json: string ) {
    let url = this.baseUrl + DSMService.UI + "familyMember";
    return this.http.post( url, json, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getKitRequests( realm: string, target: string, name: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "kitRequests";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: DSMService.TARGET, value: target} );
    map.push( {name: "kitType", value: name} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getFiltersForUserForRealm( realm: string, parent: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "getFilters";
    let map: { name: string, value: any }[] = [];
    let userId = this.role.userID();
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "userId", value: userId} );
    map.push( {name: "parent", value: parent} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public setDefaultFilter( json: string, filterName: string, parent: string, realm ) {
    let url = this.baseUrl + DSMService.UI + "defaultFilter";
    let map: { name: string, value: any }[] = [];
    map.push( {name: "filterName", value: filterName} );
    map.push( {name: "parent", value: parent} );
    map.push( {name: "userId", value: this.role.userID()} );
    map.push( {name: "userMail", value: this.role.userMail()} );
    map.push( {name: DSMService.REALM, value: realm} );
    return this.http.patch( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }


  public filterData( realm: string, json: string, parent: string, defaultFilter: boolean ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "filterList";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "parent", value: parent} );
    map.push( {name: "userId", value: this.role.userID()} );
    map.push( {name: "userMail", value: this.role.userMail()} );
    map.push( {name: "defaultFilter", value: defaultFilter == true ? "1" : defaultFilter != null ? "0" : ""} );
    return this.http.patch( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public saveCurrentFilter( json: string, realm: string, parent: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "saveFilter";
    let userId = this.role.userID();
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "parent", value: parent} );
    map.push( {name: "userId", value: userId} );
    return this.http.patch( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public applyFilter( json: ViewFilter, realm: string, parent: string, filterQuery: string ): Observable<any> {
    let viewFilterCopy = null;
    if (json != null) {
      if (json != null && json.filters != null) {
        viewFilterCopy = json.copy();
        for (let filter of json.filters) {
          if (filter.type === Filter.OPTION_TYPE && filter.participantColumn.tableAlias !== 'participantData') {
            filter.selectedOptions = filter.getSelectedOptionsName();
          }
        }
      }
      if (viewFilterCopy != null && viewFilterCopy.filters != null) {
        for (let filter of viewFilterCopy.filters) {
          if (filter.type === Filter.OPTION_TYPE && filter.participantColumn.tableAlias !== 'participantData') {
            filter.selectedOptions = filter.getSelectedOptionsName();
            filter.options = null;
          }
        }
      }
    }
    let url = this.baseUrl + DSMService.UI + "applyFilter";
    let userId = this.role.userID();
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "userId", value: userId} );
    map.push( {name: "parent", value: parent} );
    if (filterQuery != null) {
      map.push( {name: "filterQuery", value: filterQuery} );
    }
    else if (json == null || json.filters == undefined || json.filters == null) {
      map.push( {name: "filterName", value: json == null ? null : json.filterName} );
    }
    else if (viewFilterCopy != null) {
      map.push( {name: "filters", value: JSON.stringify( viewFilterCopy.filters )} );
    }
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getParticipantData( realm: string, ddpParticipantId: string, parent: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "getParticipant";
    let map: { name: string, value: any }[] = [];
    let userId = this.role.userID();
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "ddpParticipantId", value: ddpParticipantId} );
    map.push( {name: "userId", value: userId} );
    map.push( {name: "parent", value: parent} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getParticipantDsmData( realm: string, ddpParticipantId: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "getParticipantData";
    let map: { name: string, value: any }[] = [];
    let userId = this.role.userID();
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "ddpParticipantId", value: ddpParticipantId} );
    map.push( {name: "userId", value: userId} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getSettings( realm: string, parent: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "displaySettings/" + realm;
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    map.push( {name: "parent", value: parent} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  // returns drug list entries with all fields
  public getDrugs(): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "drugList";
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getAssignees(realm: string): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "assignees";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    return this.http.get(url, this.buildQueryHeader(map)).map(( res: Response ) => res.json() ).catch( this.handleError.bind( this )) ;
  }

  public saveDrug( json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "drugList";
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.patch( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getMedicalRecordData( realm: string, ddpParticipantId: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "institutions";
    let json = {
      ddpParticipantId: ddpParticipantId,
      realm: realm,
      userId: this.role.userID()
    };
    return this.http.post( url, JSON.stringify( json ), this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public assignParticipant( realm: string, assignMR: boolean, assignTissue: boolean, json: string ) {
    let url = this.baseUrl + DSMService.UI + "assignParticipant";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    if (assignMR) {
      map.push( {name: "assignMR", value: assignMR} );
    }
    if (assignTissue) {
      map.push( {name: "assignTissue", value: assignTissue} );
    }
    return this.http.patch( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public patchParticipantRecord( json: string ) {
    let url = this.baseUrl + DSMService.UI + "patch";
    return this.http.patch( url, json, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public downloadPDF( ddpParticipantId: string, medicalRecordId: string, startDate: string, endDate: string, mrCoverPdfSettings: Value[],
                      realm: string, configName: string, pdfs: PDFModel[], requestOncHistoryList: Array<OncHistoryDetail> ) {
    let url = this.baseUrl + DSMService.UI + "downloadPDF/pdf";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    let json: { [ k: string ]: any } = {};
    json = {
      ddpParticipantId: ddpParticipantId,
      userId: this.role.userID()
    };
    if (startDate != null) {
      json[ "startDate" ] = startDate;
    }
    if (endDate != null) {
      json[ "endDate" ] = endDate;
    }
    if (configName != null) {
      json[ "configName" ] = configName;
    }
    if (medicalRecordId != null) {
      json[ "medicalRecordId" ] = medicalRecordId;
    }
    if (requestOncHistoryList != null) {
      let listOfOncHistories = [];
      for (let onc of requestOncHistoryList) {
        listOfOncHistories.push( onc.oncHistoryDetailId );
      }
      json[ "requestId" ] = listOfOncHistories;
    }
    if (pdfs != null) {
      json[ "pdfs" ] = JSON.stringify( pdfs );
    }
    if (mrCoverPdfSettings != null) {
      for (let mrSetting of mrCoverPdfSettings) {
        json[ mrSetting.value ] = mrSetting.selected;
      }
    }
    return this.http.post( url, JSON.stringify( json ), this.buildQueryPDFHeader( map ) ).map( ( res: Response ) => res.blob() ).catch( err => this.handleError( err ) );
  }

  public getParticipant( participantId: string, realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "participant/" + participantId;
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getMedicalRecord( participantId: string, institutionId: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "participant/" + participantId + "/institution/" + institutionId;
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getMedicalRecordLog( medicalRecordId: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "medicalRecord/" + medicalRecordId + "/log";
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public saveMedicalRecordLog( medicalRecordId: string, json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "medicalRecord/" + medicalRecordId + "/log";
    return this.http.patch( url, json, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getMedicalRecordDashboard( realm: string, startDate: string, endDate: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "ddpInformation/" + startDate + "/" + endDate;
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getShippingReportOverview(): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "sampleReport";
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getShippingReport( startDate: string, endDate: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "sampleReport/" + startDate + "/" + endDate;
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getShippingOverview(): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "ddpInformation";
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getShippingDashboard( realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "ddpInformation";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getKit( field: string, value: string, realms: string[] ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "searchKit";
    let map: { name: string, value: any }[] = [];
    map.push( {name: "field", value: field} );
    map.push( {name: "value", value: value} );
    for (var i of realms) {
      map.push( {name: "realm", value: i} );
    }
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public lookupValue( lookupType: string, lookupValue: string, realm: string ): Observable<any> {
    if (lookupType === "mrContact" || lookupType === "tSite") {
      return this.lookup( lookupType, lookupValue, null, null );
    }
    else if (lookupType === "tHistology" || lookupType === "tFacility" || lookupType === "tType") {
      return this.lookup( lookupType, lookupValue, realm, null );
    }
  }

  public lookupCollaboratorId( lookupType: string, participantId: string, shortId: string, realm: string ): Observable<any> {
    return this.lookup( lookupType, participantId, realm, shortId );
  }

  public lookup( field: string, lookupValue: string, realm: string, shortId: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "lookup";
    let map: { name: string, value: any }[] = [];
    map.push( {name: "field", value: field} );
    map.push( {name: "value", value: lookupValue} );
    if (realm != null) {
      map.push( {name: "realm", value: realm} );
    }
    if (shortId != null) {
      map.push( {name: "shortId", value: shortId} );
    }
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getMailingList( realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "mailingList/" + realm;
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getRealmsAllowed( menu: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "realmsAllowed";
    let map: { name: string, value: any }[] = [];
    if (menu != null) {
      map.push( {name: "menu", value: menu} );
    }
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getStudies(): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "studies";
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getKitTypes( realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "kitTypes/" + realm;
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getUploadReasons( realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "uploadReasons/" + realm;
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getShippingCarriers( realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "carriers/" + realm;
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public uploadTxtFile( realm: string, kitType: string, file: File, reason: string, carrier: string, skipAddressValidation: boolean ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "kitUpload";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "kitType", value: kitType} );
    map.push( {name: "userId", value: this.role.userID()} );
    map.push( {name: "reason", value: reason} );
    map.push( {name: "carrier", value: carrier} );
    map.push( {name: "skipAddressValidation", value: skipAddressValidation} );

    return this.http.post( url, file, this.buildQueryUploadHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public uploadNdiFile( file: File ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "ndiRequest";
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.post( url, file, this.buildQueryUploadHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public uploadDuplicateParticipant( realm: string, kitType: string, jsonParticipants: string, reason: string, carrier: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "kitUpload";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "kitType", value: kitType} );
    map.push( {name: "userId", value: this.role.userID()} );
    map.push( {name: "uploadAnyway", value: true} );
    map.push( {name: "Content-Type", value: "application/json; charset=utf-8"} );
    map.push( {name: "reason", value: reason} );
    map.push( {name: "carrier", value: carrier} );

    return this.http.post( url, jsonParticipants, this.buildQueryUploadHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public kitLabel( realm: string, kitType: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "kitLabel";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "kitType", value: kitType} );
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.post( url, null, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public singleKitLabel( kitJson: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "kitLabel";
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.post( url, kitJson, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getLabelCreationStatus(): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "kitLabel";
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public exitParticipant( json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "exitParticipant";
    return this.http.post( url, json, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getPossibleSurveys( realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "triggerSurvey/" + realm;
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getSurveyStatus( realm: string, survey: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "triggerSurvey/" + realm;
    let map: { name: string, value: any }[] = [];
    map.push( {name: "surveyName", value: survey} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public triggerSurvey( realm: string, surveyName: string, surveyType: string, comment: string, isFileUpload: boolean, payload: any ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "triggerSurvey";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "surveyName", value: surveyName} );
    map.push( {name: "surveyType", value: surveyType} );
    map.push( {name: "userId", value: this.role.userID()} );
    map.push( {name: "comment", value: comment} );
    map.push( {name: "isFileUpload", value: isFileUpload} );
    return this.http.post( url, payload, this.buildQueryUploadHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public triggerAgain( realm: string, surveyName: string, surveyType: string, comment: string, jsonParticipants: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "triggerSurvey";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "surveyName", value: surveyName} );
    map.push( {name: "surveyType", value: surveyType} );
    map.push( {name: "userId", value: this.role.userID()} );
    map.push( {name: "comment", value: comment} );
    map.push( {name: "triggerAgain", value: true} );
    map.push( {name: "isFileUpload", value: false} );
    return this.http.post( url, jsonParticipants, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getPossibleEventTypes( realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "eventTypes/" + realm;
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getPossiblePDFs( realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "pdf";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getParticipantsPDFs( realm: string, ddpParticipantId: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "pdf";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "ddpParticipantId", value: ddpParticipantId} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getSkippedParticipantEvents( realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "participantEvents/" + realm;
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public skipEvent( json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "skipEvent";
    return this.http.post( url, json, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getExitedParticipants( realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "exitParticipant/" + realm;
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getKitExitedParticipants( realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "discardSamples";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public setKitDiscardAction( realm: string, json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "discardSamples";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    return this.http.patch( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public showUpload( realm: string, json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "showUpload";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    return this.http.patch( url, json, this.buildQueryPDFHeader( map ) ).map( ( res: Response ) => res.blob() ).catch( this.handleError.bind( this ) );
  }

  public setKitDiscarded( realm: string, json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "discardSamples";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.patch( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public uploadFile( realm: string, kitDiscardId: string, pathName: string, payload: File ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "discardUpload";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "kitDiscardId", value: kitDiscardId} );
    map.push( {name: pathName, value: payload.name} );
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.post( url, payload, this.buildQueryUploadHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public deleteFile( realm: string, kitDiscardId: string, pathName: string, path: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "discardUpload";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "kitDiscardId", value: kitDiscardId} );
    map.push( {name: "delete", value: true} );
    map.push( {name: pathName, value: path} );
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.post( url, null, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public saveNote( realm: string, kitDiscardId: string, note: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "discardUpload";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    map.push( {name: "kitDiscardId", value: kitDiscardId} );
    map.push( {name: "note", value: note} );
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.post( url, null, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public confirm( realm: string, payload: String ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "discardConfirm";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    return this.http.post( url, payload, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public deactivateKitRequest( kitRequestId: string, json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "deactivateKit/" + kitRequestId;
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.patch( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public expressLabel( kitRequestId: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "expressKit/" + kitRequestId;
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.patch( url, null, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public rateOfExpressLabel( kitRequestId: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "expressKit/" + kitRequestId;
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public activateKitRequest( kitRequestId: string, activate: boolean ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "activateKit/" + kitRequestId;
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    map.push( {name: "activate", value: activate} );
    return this.http.patch( url, null, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public saveUserSettings( json: string ) {
    let url = this.baseUrl + DSMService.UI + "userSettings";
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.patch( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getEmailEventData( source: string, target: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "emailEvent/" + source;
    let map: { name: string, value: any }[] = [];
    if (target != null && target !== "") {
      map.push( {name: DSMService.TARGET, value: target} );
    }
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getEmailSettings( source: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "emailSettings/" + source;
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public saveEmailSettings( source: string, json: string ) {
    let url = this.baseUrl + DSMService.UI + "emailSettings/" + source;
    return this.http.patch( url, json, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public followUpEmailEvent( source: string, json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "followUpEmailEvent/" + source;
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.patch( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getFieldSettings( source: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "fieldSettings/" + source;
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public saveFieldSettings( source: string, json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "fieldSettings/" + source;
    let map: { name: string, value: any }[] = [];
    map.push( {name: "userId", value: this.role.userID()} );
    return this.http.patch( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public applyDestructionPolicyToAll( source: string, json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "institutions";
    return this.http.patch( url, json, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getMedicalRecordAbstractionFormControls( realm: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "abstractionformcontrols";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    return this.http.get( url, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public saveMedicalRecordAbstractionFormControls( realm: string, json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "abstractionformcontrols";
    let map: { name: string, value: any }[] = [];
    map.push( {name: DSMService.REALM, value: realm} );
    return this.http.patch( url, json, this.buildQueryHeader( map ) ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getAbstractionValues( realm: string, ddpParticipantId: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "abstraction";
    let json = {
      ddpParticipantId: ddpParticipantId,
      realm: realm
    };
    return this.http.post( url, JSON.stringify( json ), this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public changeMedicalRecordAbstractionStatus( realm: string, ddpParticipantId: string, status: string, abstraction: Abstraction ) {
    let url = this.baseUrl + DSMService.UI + "abstraction";
    let json = {
      ddpParticipantId: ddpParticipantId,
      realm: realm,
      status: status,
      userId: this.role.userID(),
      abstraction: abstraction
    };
    return this.http.post( url, JSON.stringify( json ), this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public getLabelSettings(): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "labelSettings";
    return this.http.get( url, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  public saveLabelSettings( json: string ): Observable<any> {
    let url = this.baseUrl + DSMService.UI + "labelSettings";
    return this.http.patch( url, json, this.buildHeader() ).map( ( res: Response ) => res.json() ).catch( this.handleError.bind( this ) );
  }

  private handleError( error: any ) {
    if (DDP_ENV.reportError) {
      this.logger.logError( "ERROR: " + JSON.stringify( error ) );
    }
    return Observable.throw( error );
  }

  private buildHeader(): RequestOptions {
    return new RequestOptions( {headers: this.buildJsonAuthHeader(), withCredentials: true} );
  }

  private buildPDFHeader(): RequestOptions {
    return new RequestOptions( {
      headers: this.buildJsonAuthHeader(),
      withCredentials: true,
      responseType: ResponseContentType.Blob
    } );
  }

  private buildQueryPDFHeader( map: any[] ): RequestOptions {
    let params: URLSearchParams = new URLSearchParams();
    for (let i in map) {
      params.append( map[ i ].name, map[ i ].value );
    }
    return new RequestOptions( {
      headers: this.buildJsonAuthHeader(),
      withCredentials: true,
      responseType: ResponseContentType.Blob,
      search: params
    } );
  }

  private buildQueryHeader( map: any[] ): RequestOptions {
    let params: URLSearchParams = new URLSearchParams();
    for (let i in map) {
      params.append( map[ i ].name, map[ i ].value );
    }
    return new RequestOptions( {headers: this.buildJsonAuthHeader(), withCredentials: true, search: params} );
  }

  private buildQueryUploadHeader( map: any[] ): RequestOptions {
    let params: URLSearchParams = new URLSearchParams();
    for (let i in map) {
      params.append( map[ i ].name, map[ i ].value );
    }
    return new RequestOptions( {headers: this.uploadHeader(), withCredentials: true, search: params} );
  }

  private buildJsonAuthHeader(): Headers {
    if (this.checkCookieBeforeCall()) {
      let headers = new Headers( {"Content-Type": "application/json", "Accept": "application/json"} );
      headers.append( "Authorization", this.sessionService.getAuthBearerHeaderValue() );
      return headers;
    }
  }

  private uploadHeader(): Headers {
    if (this.checkCookieBeforeCall()) {
      let headers = new Headers( {"Content-Type": "multipart/form-data", "Accept": "application/json"} );
      headers.append( "Authorization", this.sessionService.getAuthBearerHeaderValue() );
      return headers;
    }
  }

  private checkCookieBeforeCall(): boolean {
    if (this.sessionService.getDSMToken() == null || this.sessionService.getDSMToken() == undefined) {
      this.sessionService.logout();
      this.router.navigate( [ Statics.HOME_URL ] );
      return false;
    }
    else {
      let jwtHelper: JwtHelper = new JwtHelper();
      let expirationDate: Date = jwtHelper.getTokenExpirationDate( this.sessionService.getDSMToken() );
      let myDate = new Date();
      if (expirationDate <= myDate) {
        // Remove token from localStorage
        // console.log("log out user and remove all items from local storage");
        localStorage.removeItem( "auth_token" );
        localStorage.removeItem( SessionService.DSM_TOKEN_NAME );
        localStorage.removeItem( Statics.PERMALINK );
        localStorage.removeItem( ComponentService.MENU_SELECTED_REALM );
        this.sessionService.logout();
        this.router.navigate( [ Statics.HOME_URL ] );
        return false;
      }
      return true;
    }
  }


}
