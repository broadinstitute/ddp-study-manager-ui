import {Component, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {AbstractionGroup} from "../abstraction-group/abstraction-group.model";
import {ActivityDefinition} from "../activity-data/models/activity-definition.model";
import {Group} from "../activity-data/models/group.model";
import {Option} from "../activity-data/models/option.model";
import {QuestionAnswer} from "../activity-data/models/question-answer.model";
import {QuestionDefinition} from "../activity-data/models/question-definition.model";
import {Assignee} from "../assignee/assignee.model";
import {Filter} from "../filter-column/filter-column.model";
import {ModalComponent} from "../modal/modal.component";
import {ParticipantColumn} from "../filter-column/models/column.model";
import {OncHistoryDetail} from "../onc-history-detail/onc-history-detail.model";
import {Auth} from "../services/auth.service";
import {ComponentService} from "../services/component.service";
import {DSMService} from "../services/dsm.service";
import {RoleService} from "../services/role.service";
import {KitType} from "../utils/kit-type.model";
import {NameValue} from "../utils/name-value.model";
import {PatchUtil} from "../utils/patch.model";
import {Result} from "../utils/result.model";
import {Statics} from "../utils/statics";
import {Utils} from "../utils/utils";
import {ViewFilter} from "../filter-column/models/view-filter.model";
import {Value} from "../utils/value.model";
import {AssigneeParticipant} from "./models/assignee-participant.model";
import {PreferredLanguage} from "./models/preferred-languages.model";
import {Sample} from "./models/sample.model";
import {Participant} from "./participant-list.model";
import {FieldSettings} from "../field-settings/field-settings.model";
import { ParticipantData } from "./models/participant-data.model";

@Component( {
  selector: "app-participant-list",
  templateUrl: "./participant-list.component.html",
  styleUrls: ["./participant-list.component.css"]
} )
export class ParticipantListComponent implements OnInit {

  @ViewChild(ModalComponent)
  public modal: ModalComponent;

  modalAnchor: string;
  assignMR: boolean = false;
  assignTissue: boolean = false;
  isAssignButtonDisabled: boolean = true;
  assignee: Assignee;

  loadedTimeStamp: string;

  errorMessage: string;
  additionalMessage: string;
  loadingParticipants = null;
  parent = "participantList";

  showFilters = false;
  showCustomizeViewTable = false;
  showSavedFilters = false;
  hasESData = false;

  currentFilter: Array<Filter>;
  selectedFilterName: string = "";

  participantList: Participant[] = [];
  copyParticipantList: Participant[] = [];
  originalParticipantList: Participant[] = [];
  activePage: number = 1;
  activityDefinitionList: ActivityDefinition[] = [];
  participant: Participant;
  oncHistoryDetail: OncHistoryDetail;
  assignees: Array<Assignee> = [];
  showParticipantInformation: boolean = false;
  showTissue: boolean = false;
  selectedTab: string;
  selectedMR = "";
  selectedOncOrTissue = "";

  dataSources: Map<string, string> = null;
  sourceColumns = {};
  allFieldNames = new Set();
  dup: boolean = false;
  plus: boolean = false;
  filterName: string = null;
  filterQuery: string = null;
  activityDefinitions = new Map();

  selectedColumns = {};
  defaultColumns = [];

  selectedFilter: Filter = null;
  savedFilters: ViewFilter[] = [];
  quickFilters: ViewFilter[] = [];

  settings = {};
  drugs: string[] = [];
  cancers: string[] = [];
  mrCoverPdfSettings: Value[] = [];

  sortField: string = null;
  sortDir: string = null;
  sortParent: string = null;
  currentView: string = null;
  showHelp: boolean = false;
  filtered: boolean = false;
  rowsPerPage: number;
  preferredLanguages: PreferredLanguage[] = [];
  savedSelectedColumns = {};
  isAddFamilyMember: boolean = false;
  showGroupFields: boolean = false;
  hideSamplesTab: boolean = false;
  showContactInformation: boolean = false;
  showComputedObject: boolean = false;
  participantsSize: number = 0;
  jsonPatch: any;
  viewFilter: any;


  constructor( private role: RoleService, private dsmService: DSMService, private compService: ComponentService,
               private router: Router, private auth: Auth, private route: ActivatedRoute, private util: Utils ) {
    if (!auth.authenticated()) {
      auth.logout();
    }
    this.route.queryParams.subscribe( params => {
      let realm = params[ DSMService.REALM ] || null;
      if (realm != null) {
        //        this.compService.realmMenu = realm;
        this.additionalMessage = null;
        this.checkRight();
        // this.saveSelectedColumns(); commented out, because we don't need it as
        //                             we don't renew selected columns anymore, as we are going to have defaultColumns for each study
      }
    } );
  }

  ngOnInit() {
    this.additionalMessage = null;
    if (localStorage.getItem( ComponentService.MENU_SELECTED_REALM ) == null || localStorage.getItem( ComponentService.MENU_SELECTED_REALM ) === undefined) {
      this.additionalMessage = "Please select a realm";
    } else {
      this.checkRight();
    }
    window.scrollTo( 0, 0 );
  }

  public getPaginationParticipantListSize(): number {
    return this.participantsSize;
  }

  public pageChanged(pageNumber: number, rPerPage?: number) {
    this.loadingParticipants = true;
    let rowsPerPage = rPerPage ? rPerPage : this.role.getUserSetting().getRowsPerPage();
    let from = (pageNumber - 1) * rowsPerPage;
    let to = pageNumber * rowsPerPage;
    if (this.viewFilter) {
       this.applyFilter(this.viewFilter, from, to);
    } else {
      if (this.jsonPatch) {
        this.dsmService.filterData( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), this.jsonPatch, this.parent, null, from, to ).subscribe(
        data => {
          this.setFilterDataOnSuccess(data);
        }, err => {
          this.participantList = [];
          this.originalParticipantList = [];
          this.copyParticipantList = [];
          this.loadingParticipants = null;
          this.additionalMessage = "Error - Filtering Participant List, Please contact your DSM developer";
        } );

      } else {
        this.dsmService.filterData( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), null, this.parent, true, from, to ).subscribe(
          data => {
            this.setFilterDataOnSuccess(data);
          },
          err => {
            if (err._body === Auth.AUTHENTICATION_ERROR) {
              this.auth.logout();
            }
            this.loadingParticipants = null;
            this.errorMessage = "Error - Loading Participant List, Please contact your DSM developer";
          }
        );
      }
    }


    this.activePage = pageNumber;
  }

  private setFilterDataOnSuccess(data: any) {
    this.participantList = [];
    this.additionalMessage = "";
    this.originalParticipantList = [];
    this.copyParticipantList = [];
    if (data != null) {
      let jsonData: {};
      jsonData = data;
      jsonData['participants'].forEach((val) => {
        let participant = Participant.parse(val);
        this.participantList.push(participant);
      });
      this.originalParticipantList = this.participantList;
      this.participantsSize = jsonData['totalCount'];
      let date = new Date();
      this.loadedTimeStamp = Utils.getDateFormatted(date, Utils.DATE_STRING_IN_EVENT_CVS);
      this.additionalMessage = null;
    }
    this.loadingParticipants = null;
  }

  private checkRight() {
    //assumption for now: profile parameters are always the same, only survey will be dynamic per ddp
    this.loadingParticipants = localStorage.getItem( ComponentService.MENU_SELECTED_REALM );
    this.setSelectedFilterName( "" );
    this.currentFilter = null;
    this.filterQuery = null;
    let allowedToSeeInformation = false;
    this.errorMessage = null;
    this.participantList = null;
    let jsonData: any[];
    this.dsmService.getRealmsAllowed( Statics.MEDICALRECORD ).subscribe(
      data => {
        jsonData = data;
        jsonData.forEach( ( val ) => {
          if (localStorage.getItem( ComponentService.MENU_SELECTED_REALM ) === val) {
            allowedToSeeInformation = true;
            this.loadSettings();
          }
        } );
        if (!allowedToSeeInformation) {
          this.loadingParticipants = null;
          this.compService.customViews = null;
          this.errorMessage = "You are not allowed to see information of the selected realm at that category";
        }
      },
      err => {
        this.loadingParticipants = null;
        return null;
      }
    );
  }

  loadSettings() {
    this.rowsPerPage = this.role.getUserSetting().getRowsPerPage();
    let jsonData: any;
    this.dsmService.getSettings( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), this.parent ).subscribe(
      data => {
        this.assignees = [];
        this.drugs = [];
        this.cancers = [];
        this.activityDefinitionList = [];
        this.quickFilters = [];
        this.savedFilters = [];
        this.mrCoverPdfSettings = [];
        this.defaultColumns = [Filter.REALM, Filter.SHORT_ID, Filter.FIRST_NAME, Filter.LAST_NAME, Filter.ENROLLMENT_STATUS];
        this.assignees.push( new Assignee( "-1", "Remove Assignee", "" ) );
        jsonData = data;
        this.dataSources = new Map( [
          ["data", "Participant"],
          ["p", "Participant - DSM"],
          ["m", "Medical Record"],
          ["oD", "Onc History"],
          ["t", "Tissue"],
          ["k", "Sample"],
          ["a", "Abstraction"]]);
        this.sourceColumns = {};
        this.selectedColumns = {};
        this.settings = {};
        this.dataSources.forEach( ( value: string, key: string ) => {
          this.selectedColumns[ key ] = [];
          this.sourceColumns[ key ] = [];
        } );
        if (jsonData.assignees != null) {
          jsonData.assignees.forEach( ( val ) => {
            this.assignees.push( Assignee.parse( val ) );
          } );
        }
        if (jsonData.drugs != null) {
          jsonData.drugs.forEach( ( val ) => {
            this.drugs.push( val );
          } );
        }
        if (jsonData.cancers != null) {
          jsonData.cancers.forEach( ( val ) => {
            this.cancers.push( val );
          } );
        }
        if (jsonData.fieldSettings != null) {
          Object.keys( jsonData.fieldSettings ).forEach( ( key ) => {
            jsonData.fieldSettings[ key ].forEach( ( fieldSetting: FieldSettings ) => {
              let options: Array<NameValue> = null;
              if (fieldSetting.displayType === "OPTIONS") {
                options = new Array<NameValue>();
                if (fieldSetting.possibleValues != null) {
                  fieldSetting.possibleValues.forEach( ( value: Value ) => {
                    options.push( new NameValue( value.value, value.value ) );
                  } );
                }
              }
              let filter = new Filter( new ParticipantColumn( fieldSetting.columnDisplay, fieldSetting.columnName, key ), Filter.ADDITIONAL_VALUE_TYPE, options, new NameValue( fieldSetting.columnName, null ),
                false, true, null, null, null, null, false, false, false, false, fieldSetting.displayType );
              if (this.settings[ key ] == null || this.settings[ key ] == undefined) {
                this.settings[ key ] = [];
              }
              if (key === "r") {
                if (this.sourceColumns[ "p" ] == null || this.sourceColumns[ "p" ] == undefined) {
                  this.sourceColumns[ "p" ] = [];
                }
                this.sourceColumns[ "p" ].push( filter );
              } else {
                if (this.sourceColumns[ fieldSetting.fieldType ] == null || this.sourceColumns[ fieldSetting.fieldType ] == undefined) {
                  this.sourceColumns[ fieldSetting.fieldType ] = [];
                }
                if (key === null || key === "null") {
                  if (fieldSetting.displayType === "TAB" && !this.dataSources.has(fieldSetting.columnName)) {
                    this.dataSources.set(fieldSetting.columnName, fieldSetting.columnDisplay);
                  }
                }
                if (fieldSetting.displayType == null || fieldSetting.displayType == undefined || fieldSetting.displayType !== "GROUP") {
                  this.sourceColumns[ fieldSetting.fieldType ].push( filter );
                }
              }
              this.settings[ key ].push( fieldSetting );
              if (fieldSetting.displayType == null || fieldSetting.displayType == undefined || fieldSetting.displayType !== "GROUP") {
                this.allFieldNames.add( filter.participantColumn.tableAlias + "." + filter.participantColumn.name );
              }
            } );
          } );
        }
        this.hasESData = false;
        if (jsonData.activityDefinitions != null) {
          Object.keys( jsonData.activityDefinitions ).forEach( ( key ) => {
            this.hasESData = true;
            let activityDefinition: ActivityDefinition = ActivityDefinition.parse( jsonData.activityDefinitions[ key ] );
            let possibleColumns: Array<Filter> = [];
            if (this.sourceColumns[activityDefinition.activityCode] != null) {
              possibleColumns = this.sourceColumns[activityDefinition.activityCode];
            }
            else {
              possibleColumns.push( new Filter( new ParticipantColumn( activityDefinition.activityCode + " Survey Created", "createdAt", activityDefinition.activityCode, null, true ), Filter.DATE_TYPE ) );
              possibleColumns.push( new Filter( new ParticipantColumn( activityDefinition.activityCode + " Survey Completed", "completedAt", activityDefinition.activityCode, null, true ), Filter.DATE_TYPE ) );
              possibleColumns.push( new Filter( new ParticipantColumn( activityDefinition.activityCode + " Survey Last Updated", "lastUpdatedAt", activityDefinition.activityCode, null, true ), Filter.DATE_TYPE ) );
              possibleColumns.push( new Filter( new ParticipantColumn( activityDefinition.activityCode + " Survey Status", "status", activityDefinition.activityCode, null, true ), Filter.OPTION_TYPE, [
                new NameValue( "COMPLETE", "Completed" ),
                new NameValue( "CREATED", "Created" ),
                new NameValue( "IN_PROGRESS", "In Progress" )] ) );
            }
            if (activityDefinition != null && activityDefinition.questions != null) {
              for (let question of activityDefinition.questions) {
                if (question.stableId != null) {
                  let options: Array<NameValue> = null;
                  let type: string = question.questionType;
                  if (question.questionType === "PICKLIST") {
                    options = new Array<NameValue>();
                    type = Filter.OPTION_TYPE;
                    if (question.options != null) {
                      question.options.forEach( ( option: Option ) => {
                        options.push( new NameValue( option.optionStableId, option.optionText ) );
                        if (option != null && option.nestedOptions != null) {
                          option.nestedOptions.forEach( ( nOption: Option ) => {
                            options.push( new NameValue( option.optionStableId + "." + nOption.optionStableId, nOption.optionText ) );
                          } )
                        }
                      } );
                    }
                    if (question.groups != null) {
                      question.groups.forEach( ( group: Group ) => {
                        options.push( new NameValue( group.groupStableId, group.groupText ) );
                        if (group.options != null) {
                          group.options.forEach( ( gOption: Option ) => {
                            options.push( new NameValue( group.groupStableId + "." + gOption.optionStableId, gOption.optionText ) );
                          } )
                        }
                      } );
                    }
                  } else if (question.questionType === "NUMERIC") {
                    type = Filter.NUMBER_TYPE;
                  }
                  let filterInPossibleColumns = possibleColumns.find(filter => {
                    return filter.participantColumn.name === question.stableId
                  });
                  if (filterInPossibleColumns == null) {
                    let displayName = this.getQuestionOrStableId( question );
                    let filter = new Filter( new ParticipantColumn( displayName, question.stableId, activityDefinition.activityCode, null, true ), type, options );
                    possibleColumns.push( filter );
                  }
                }
              }
              let name = activityDefinition.activityName == undefined || activityDefinition.activityName === "" ? activityDefinition.activityCode : activityDefinition.activityName;
              this.dataSources.set( activityDefinition.activityCode, name );
              this.sourceColumns[ activityDefinition.activityCode ] = possibleColumns;
              this.selectedColumns[ activityDefinition.activityCode ] = [];
              //add now all these columns to allFieldsName for the search-bar
              possibleColumns.forEach( filter => {
                let tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
                this.allFieldNames.add( tmp + "." + filter.participantColumn.name );
              } );
            }
            this.activityDefinitionList.push( activityDefinition );
          } );
        }
        if (this.settings && this.settings["TAB_GROUPED"]) {
          this.addTabGroupedColumns();
        }
        if (this.settings && this.settings["TAB"]) {
          this.addTabColumns();
        }
        if (data.defaultColumns && data.defaultColumns.length > 0) {
          this.defaultColumns = [];
          for (let defaultColumn of data.defaultColumns) {
            let filterToAdd: Filter = Filter[defaultColumn.value];
            if (filterToAdd) {
              this.defaultColumns.push(Filter[defaultColumn.value]);
            } else {
              this.addDynamicFieldDefaultColumns(defaultColumn);
            }
          }
        }
        this.getSourceColumnsFromFilterClass();
        if (jsonData.abstractionFields != null && jsonData.abstractionFields.length > 0) {
          //only add abstraction columns if there is a abstraction form setup
          jsonData.abstractionFields.forEach( ( key ) => {
            let abstractionGroup = AbstractionGroup.parse( key );
            abstractionGroup.fields.forEach( ( field ) => {
              let tmp: string = field.medicalRecordAbstractionFieldId.toString();
              let tmpValues: NameValue[] = [];
              let tmpType = Filter.TEXT_TYPE;
              if (( field.type === "button_select" || field.type === "options" || field.type === "multi_options" )
                && field.possibleValues != null) {
                tmpType = Filter.OPTION_TYPE;
                field.possibleValues.forEach( ( value ) => {
                  tmpValues.push( new NameValue( value.value, value.value ) );
                } );
              } else if (field.type === "multi_type" || field.type === "multi_type_array") {
                tmpType = field.type;
              }
              this.sourceColumns[ "a" ].push( new Filter( new ParticipantColumn( field.displayName, tmp, abstractionGroup.abstractionGroupId.toString(), "final" ), tmpType, tmpValues, new NameValue( tmp, null ) ) );
            } );
          } );
          //add now all these columns to allFieldsName for the search-bar
          this.sourceColumns[ "a" ].forEach( filter => {
            let tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
            //add when abstraction is searchable
            // this.allFieldNames.add( tmp + "." + filter.participantColumn.name );
          } );
        }
        else {
          this.dataSources.delete( "a" );
        }
        if (jsonData.filters != null) {
          jsonData.filters.forEach( ( val ) => {
            let view: ViewFilter = ViewFilter.parseFilter( val, this.sourceColumns );
            if (val.userId.includes( "System" )) {
              this.quickFilters.push( view );
            } else {
              this.savedFilters.push( view );
            }
          } );
          this.savedFilters.sort( ( a, b ) => a.filterName.localeCompare( b.filterName ) );
          // console.log(this.savedFilters);
        }
        if (jsonData.mrCoverPDF != null) {
          jsonData.mrCoverPDF.forEach( ( val ) => {
            let value: Value = Value.parse( val );
            this.mrCoverPdfSettings.push( value );
          } );
        }
        if (jsonData.kitTypes != null) {
          let hasExternalShipper = false;
          let options = new Array<NameValue>();
          let optionsUpload = new Array<NameValue>();
          jsonData.kitTypes.forEach( ( val ) => {
            let kitType = KitType.parse( val );
            if ( kitType.uploadReasons != null && kitType.uploadReasons != undefined) {
              kitType.uploadReasons.forEach( (val) => {
                let found = optionsUpload.find(option => {
                  return option.value === val;
                } );
                if (found == null) {
                  optionsUpload.push( new NameValue( val, val ) );
                }
              })
            }
            options.push( new NameValue( kitType.name, kitType.displayName ) );
            if ( kitType.externalShipper ) {
              hasExternalShipper = true;
            }
          });
          if (optionsUpload.length > 0) {
            optionsUpload.push( new NameValue( "SAMPLE_UPLOAD_EMPTY", "NORMAL" ) );
            this.sourceColumns[ "k" ].push( new Filter( ParticipantColumn.UPLOAD_REASON, Filter.OPTION_TYPE, optionsUpload ) );
            this.allFieldNames.add( "k" + "." + ParticipantColumn.UPLOAD_REASON.name );
          }
          this.sourceColumns[ "k" ].push( new Filter( ParticipantColumn.SAMPLE_TYPE, Filter.OPTION_TYPE, options ) );
          if (hasExternalShipper) {
            this.sourceColumns[ "k" ].push( new Filter( ParticipantColumn.EXTERNAL_ORDER_NUMBER, Filter.TEXT_TYPE ) );
            this.sourceColumns[ "k" ].push( new Filter( ParticipantColumn.EXTERNAL_ORDER_DATE, Filter.DATE_TYPE ) );
            this.allFieldNames.add( "k" + "." + ParticipantColumn.EXTERNAL_ORDER_NUMBER.name );
            this.allFieldNames.add( "k" + "." + ParticipantColumn.EXTERNAL_ORDER_DATE.name );
          }
        }
        else {
          this.dataSources.delete( "k" );
        }
        if (jsonData.preferredLanguages != null) {
          this.preferredLanguages = new Array<PreferredLanguage>();
          let options = new Array<NameValue>();
          jsonData.preferredLanguages.forEach( ( val ) => {
            let language = PreferredLanguage.parse( val );
            this.preferredLanguages.push(language);
            options.push( new NameValue( language.languageCode, language.displayName ) );
          });
          this.sourceColumns[ "data" ].push( new Filter( ParticipantColumn.PREFERRED_LANGUAGE, Filter.OPTION_TYPE, options ) );
        }

        if (jsonData.hideMRTissueWorkflow != null) {
          this.dataSources.delete( "m" );
          this.dataSources.delete( "oD" );
          this.dataSources.delete( "t" );
          this.removeColumnFromSourceColumns("p", Filter.ONC_HISTORY_CREATED);
          this.removeColumnFromSourceColumns("p", Filter.ONC_HISTORY_REVIEWED);
          this.removeColumnFromSourceColumns("p", Filter.PAPER_CR_SENT);
          this.removeColumnFromSourceColumns("p", Filter.PAPER_CR_RECEIVED);
          this.removeColumnFromSourceColumns("p", Filter.MINIMAL_RECORDS);
          this.removeColumnFromSourceColumns("p", Filter.ABSTRACTION_READY);
          this.removeColumnFromSourceColumns("p", Filter.ASSIGNEE_MR);
          this.removeColumnFromSourceColumns("p", Filter.ASSIGNEE_TISSUE);
          this.assignees = null;
        }
        if (jsonData.hasInvitations != null) {
          this.dataSources.set( "invitations", "Invitation" );

          let possibleColumns: Array<Filter> = [];
          possibleColumns.push( new Filter( new ParticipantColumn( "Created", "createdAt", "invitations", null, true ), Filter.DATE_TYPE ) );
          possibleColumns.push( new Filter( new ParticipantColumn( "Accepted", "acceptedAt", "invitations", null, true ), Filter.DATE_TYPE ) );
          possibleColumns.push( new Filter( new ParticipantColumn( "Verified", "verifiedAt", "invitations", null, true ), Filter.DATE_TYPE ) );
          possibleColumns.push( new Filter( new ParticipantColumn( "Voided", "voidedAt", "invitations", null, true ), Filter.DATE_TYPE ) );
          possibleColumns.push( new Filter( new ParticipantColumn( "Contact Email", "contactEmail", "invitations", null, true ), Filter.TEXT_TYPE ) );
          possibleColumns.push( new Filter( new ParticipantColumn( "Invitation Code", "guid", "invitations", null, true ), Filter.TEXT_TYPE ) );
          possibleColumns.push( new Filter( new ParticipantColumn( "Notes", "notes", "invitations", null, true ), Filter.TEXT_TYPE ) );
          possibleColumns.push( new Filter( new ParticipantColumn( "Type", "type", "invitations", null, true ), Filter.TEXT_TYPE ) );

          this.sourceColumns[ "invitations" ] = possibleColumns;
          this.selectedColumns[ "invitations" ] = [];
          possibleColumns.forEach( filter => {
            let tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
            this.allFieldNames.add( tmp + "." + filter.participantColumn.name );
          } );
          this.orderColumns();
        }
        if (jsonData.hasAddressTab) {
          this.addContactInformationColumns();
        }else{
          this.showContactInformation = false;
        }
        if (jsonData.hasComputedObject) {
          this.addAutomatedScoringColumns();
        }
        if (jsonData.hasProxyData != null) {
          this.dataSources.set( "proxy", "Proxy" );
          let possibleColumns: Array<Filter> = [];
          possibleColumns.push( new Filter( new ParticipantColumn( "First Name", "firstName", "proxy", null, true ), Filter.TEXT_TYPE ) );
          possibleColumns.push( new Filter( new ParticipantColumn( "Last Name", "lastName", "proxy", null, true ), Filter.TEXT_TYPE ) );
          possibleColumns.push( new Filter( new ParticipantColumn( "Email", "email", "proxy", null, true ), Filter.TEXT_TYPE ) );

          this.sourceColumns[ "proxy" ] = possibleColumns;
          this.selectedColumns[ "proxy" ] = [];
          possibleColumns.forEach( filter => {
            let tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
            this.allFieldNames.add( tmp + "." + filter.participantColumn.name );
          } );
          this.orderColumns();
        }
        if (jsonData.hideESFields != null) {
          let hideESFields: Value[] = [];
          jsonData.hideESFields.forEach( ( val ) => {
            let value: Value = Value.parse( val );
            hideESFields.push( value );
          } );
          if (hideESFields != null && hideESFields.length > 0) {
            hideESFields.forEach( (field) => {
              let esField = field.value.split(".");
              if (esField != null) {
                this.sourceColumns[ "data" ].forEach( source => {
                  if (source.participantColumn.object === esField[0] && source.participantColumn.name === esField[1]) {
                    //remove the ES columns
                    this.removeColumnFromSourceColumns("data", source);
                  }
                } );
              }
            })
          }
        }
        this.updateStudySpecificStatuses(jsonData.studySpecificStatuses);
        if (jsonData.addFamilyMember === true) {
          this.isAddFamilyMember = true;
        } else {
          this.isAddFamilyMember = false;
        }
        if (jsonData.showGroupFields === true) {
          this.showGroupFields = true;
        } else {
          this.showGroupFields = false;
        }
        if (jsonData.hideSamplesTab === true) {
          this.hideSamplesTab = true;
          this.dataSources.delete( "k" );
        } else {
          this.hideSamplesTab = false;
        }
        this.orderColumns();
        this.getData();
        },
        // this.renewSelectedColumns(); commented out becasue if we have defaultColumns for all the studies we won't need it anymore
      err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.auth.logout();
        }
        throw "Error - Loading display settings" + err;
      }
    );
  }

  private addDynamicFieldDefaultColumns(defaultColumn: any) {
    let defaultColumnName: string;
    if (defaultColumn.value.split('.').length === 2) {
      defaultColumnName = defaultColumn.value.split('.')[1];
    }
    if (!defaultColumnName) {
      return;
    }
    for (let sourceColumnGroup of Object.values(this.sourceColumns)) {
      for (let currentFilter of sourceColumnGroup as Array<Filter>) {
        const isOurDefaultColumnTabGrouped = (currentFilter['participantColumn'] && currentFilter['participantColumn']['name']
          && currentFilter['participantColumn']['name'] === defaultColumnName
          && currentFilter['participantColumn']['tableAlias'] === 'participantData');
        if (isOurDefaultColumnTabGrouped) {
          let groupName = currentFilter['participantColumn']['object'];
          if (groupName) {
            this.defaultColumns.push(currentFilter);
            return;
          }
        }
      }
    }
  }

  getQuestionOrStableId( question: QuestionDefinition ): string {
    return question.questionText != null && question.questionText !== "" && question.questionText.length < 45 ? question.questionText : question.stableId;
  }

  orderColumns() {
    this.dataSources.forEach( ( value: string, key: string ) => {
      this.sourceColumns[ key ].sort( ( a: Filter, b: Filter ) => this.sort( a.participantColumn.display, b.participantColumn.display, 1 ) );
    } );
  }

  getSourceColumnsFromFilterClass() {
    for (let filter of Filter.ALL_COLUMNS) {
      if (filter.participantColumn.tableAlias === "o" || filter.participantColumn.tableAlias === "ex" || filter.participantColumn.tableAlias === "r") {
        this.sourceColumns[ "p" ].push( filter );
      } else if (filter.participantColumn.tableAlias === "inst") {
        this.sourceColumns[ "m" ].push( filter );
      } else if (this.sourceColumns[ filter.participantColumn.tableAlias ] != null && this.sourceColumns[ filter.participantColumn.tableAlias ] != undefined) {
        //TODO - can be changed to add all after all DDPs are migrated
        if (this.hasESData) {
          this.sourceColumns[ filter.participantColumn.tableAlias ].push( filter );
          let tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
          this.allFieldNames.add( tmp + "." + filter.participantColumn.name );
        } else {
          if (filter.participantColumn.tableAlias === "data" && ( filter.participantColumn.object === "profile" || filter.participantColumn.object === "address" )) {
            if (filter.participantColumn.name !== "doNotContact" && filter.participantColumn.name !== "email" && filter.participantColumn.name !== "legacyShortId"
              && filter.participantColumn.name !== "legacyAltPid" && filter.participantColumn.name !== "createdAt") {
              this.sourceColumns[ filter.participantColumn.tableAlias ].push( filter );
              let tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
              this.allFieldNames.add( tmp + "." + filter.participantColumn.name );
            }
          } else if (filter.participantColumn.tableAlias === "data" && filter.participantColumn.object == null) {
            this.sourceColumns[ filter.participantColumn.tableAlias ].push( filter );
            let tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
            this.allFieldNames.add( tmp + "." + filter.participantColumn.name );
          } else if (filter.participantColumn.tableAlias !== "data") {
            this.sourceColumns[ filter.participantColumn.tableAlias ].push( filter );
            let tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
            this.allFieldNames.add( tmp + "." + filter.participantColumn.name );
          }
        }
      }
    }
  }

  private getData() {
    //find viewFilter by filterName
    let defaultFilter: ViewFilter = null;
    if (this.role.getUserSetting().defaultParticipantFilter) {
      defaultFilter = this.savedFilters.find( filter => {
        return filter.filterName === this.role.getUserSetting().defaultParticipantFilter;
      } );
      if (defaultFilter == null) {
        defaultFilter = this.quickFilters.find( filter => {
          return filter.filterName === this.role.getUserSetting().defaultParticipantFilter;
        } );
      }
      if (defaultFilter != null && defaultFilter != undefined) {
        this.selectFilter( defaultFilter );
      } else if (this.role.getUserSetting().defaultParticipantFilter !== "" && this.role.getUserSetting().defaultParticipantFilter !== null && this.role.getUserSetting().defaultParticipantFilter !== undefined) {
        this.additionalMessage = "The default filter seems to be deleted, however it is still the default filter as long as not changed in the user settings.";
        this.loadingParticipants = localStorage.getItem( ComponentService.MENU_SELECTED_REALM );
        this.dsmService.filterData( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), null, this.parent, true ).subscribe(
          data => {
            if (data != null) {
              this.additionalMessage = "";
              this.participantList = [];
              this.originalParticipantList = [];
              this.copyParticipantList = [];
              let jsonData: {};
              jsonData = data;
              jsonData['participants'].forEach( ( val ) => {
                let participant = Participant.parse( val );
                this.participantList.push( participant );
              } );
              this.originalParticipantList = this.participantList;
              this.participantsSize = jsonData['totalCount'];
              let date = new Date();
              this.loadedTimeStamp = Utils.getDateFormatted( date, Utils.DATE_STRING_IN_EVENT_CVS);
            }
            this.loadingParticipants = null;
            this.dataSources.forEach( ( value: string, key: string ) => {
              this.selectedColumns[ key ] = [];
            } );
            this.refillWithDefaultColumns();
          },
          err => {
            if (err._body === Auth.AUTHENTICATION_ERROR) {
              this.auth.logout();
            }
            this.loadingParticipants = null;
            this.errorMessage = "Error - Loading Participant List, Please contact your DSM developer";
          }
        );
      }
    } else {
      this.selectFilter( null );
    }
  }

  private refillWithDefaultColumns() {
    this.selectedColumns["data"] = [];
    for (let defaultColumn of this.defaultColumns) {
      if (defaultColumn.participantColumn && defaultColumn.participantColumn.object && defaultColumn.participantColumn.tableAlias === 'participantData') {
        if (!this.selectedColumns[defaultColumn.participantColumn.object]) {
          this.selectedColumns[defaultColumn.participantColumn.object] = [];
        }
        this.selectedColumns[defaultColumn.participantColumn.object].push(defaultColumn);
      } else if (defaultColumn.participantColumn.tableAlias) {
        if (!this.selectedColumns[defaultColumn.participantColumn.tableAlias]) {
          this.selectedColumns[defaultColumn.participantColumn.tableAlias] = [];
        }
        this.selectedColumns[defaultColumn.participantColumn.tableAlias].push(defaultColumn);
      }
    }
  }

  private removeColumnFromSourceColumns (source: string, filter: Filter) {
    let index = this.sourceColumns[ source ].indexOf( filter );
    if (index !== -1) {
      this.sourceColumns[ source ].splice( index, 1 );
    }
  }

  public selectFilter( viewFilter: ViewFilter ) {
    this.resetPagination();
    this.loadingParticipants = localStorage.getItem( ComponentService.MENU_SELECTED_REALM );
    this.currentView = JSON.stringify( viewFilter );
    if (viewFilter != null) {
      this.filtered = true;
      this.viewFilter = viewFilter;
      // console.log(viewFilter.filters);
    } else {
      this.filtered = false;
    }
    // console.log(viewFilter);
    this.applyFilter(viewFilter);
  }

  private applyFilter(viewFilter: ViewFilter, from : number = 0, to : number = this.role.getUserSetting().getRowsPerPage()) {
    this.dsmService.applyFilter(viewFilter, localStorage.getItem(ComponentService.MENU_SELECTED_REALM), this.parent, null, from, to).subscribe(
      data => {
        if (data != null) {
          if (viewFilter != null && viewFilter.filters != null) {
            for (let filter of viewFilter.filters) {
              let t = filter.participantColumn.tableAlias;
              if (t === "r" || t === "o" || t === "ex") {
                t = "p";
              } else if (t === "inst") {
                t = "m";
              } else if (t === 'participantData') {
                t = filter.participantColumn.object;
              }
              for (let f of this.sourceColumns[t]) {
                if (f.participantColumn.name === filter.participantColumn.name) {
                  let index = this.sourceColumns[t].indexOf(f);
                  if (index !== -1) {
                    this.sourceColumns[t].splice(index, 1);
                    this.sourceColumns[t].push(filter);
                    break;
                  }
                }
              }
            }
          }
          this.participantList = [];
          this.additionalMessage = "";
          this.originalParticipantList = [];
          this.copyParticipantList = [];
          let jsonData: {};
          jsonData = data;
          jsonData['participants'].forEach((val) => {
            let participant = Participant.parse(val);
            this.participantList.push(participant);
          });
          this.originalParticipantList = this.participantList;
          this.participantsSize = jsonData['totalCount'];
          if (viewFilter != null) {
            this.filterQuery = viewFilter.queryItems;
            viewFilter.selected = true;
            for (let f of this.quickFilters) {
              if (viewFilter.filterName !== f.filterName) {
                f.selected = false;
              }
            }
            if (viewFilter.filters != null) {
              for (let filter of viewFilter.filters) {
                if (filter.type === Filter.OPTION_TYPE) {
                  filter.selectedOptions = filter.getSelectedOptionsBoolean();
                }
              }
            }
            this.selectedFilterName = viewFilter.filterName;
            this.filterQuery = viewFilter.queryItems.replace(",", "");
            // this.selectedColumns = viewFilter.columns;
            let c = {};
            for (let key of Object.keys(viewFilter.columns)) {
              c[key] = [];
              for (let column of viewFilter.columns[key]) {
                if (key == 'participantData' && column.participantColumn && column.participantColumn.object) {
                  if (!c[column.participantColumn.object]) {
                    c[column.participantColumn.object] = [];
                  }
                  c[column.participantColumn.object].push(column.copy());
                } else {
                  c[key].push(column.copy());
                }
              }
            }
            this.selectedColumns = c;
            if (!this.hasESData) {
              this.filterClientSide(viewFilter);
            }
          } else {
            //if selected columns are not set, set to default columns
            if ((this.selectedColumns["data"] && this.selectedColumns["data"].length == 0)
              || (!this.selectedColumns["data"] && this.isSelectedColumnsNotEmpty())) {
              this.dataSources.forEach((value: string, key: string) => {
                this.selectedColumns[key] = [];
              });
              this.refillWithDefaultColumns();
            }
          }
          let date = new Date();
          this.loadedTimeStamp = Utils.getDateFormatted(date, Utils.DATE_STRING_IN_EVENT_CVS);
        }
        this.loadingParticipants = null;
      },
      err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.auth.logout();
        }
        this.loadingParticipants = null;
        this.errorMessage = "Error - Loading Participant List, Please contact your DSM developer";
      }
    );
  }

  isSelectedColumnsNotEmpty(): boolean {
    return Object.values(this.selectedColumns).find(value => value != null && (value as Array<any>).length > 0) !== null;
  }

  getColSpan() {
    let columnCount = 1; //1 = checkbox column
    this.dataSources.forEach( ( value: string, key: string ) => {
      if (this.selectedColumns[ key ] != null) {
        this.selectedColumns[ key ].forEach( col => columnCount = columnCount + 1 );
      }
    } );
    return columnCount;
  }

  getFilters() {
    this.dsmService.getFiltersForUserForRealm( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), this.parent ).subscribe(
      data => {
        this.savedFilters = [];
        let jsonData = data;
        jsonData.forEach( ( val ) => {
          let view: ViewFilter;
          if (!val.userId.includes( "System" )) {
            view = ViewFilter.parseFilter( val, this.sourceColumns );
            this.savedFilters.push( view );
          }
        } );
        this.savedFilters.sort( ( f1, f2 ) => f1.filterName.localeCompare( f2.filterName ) );
        // console.log(this.savedFilters);
      },
      err => {
        this.showSavedFilters = false;
        this.errorMessage = "Error - Loading Filter List, Please contact your DSM developer";
      } );
  }

  public onclickDropDown( e ) {
    e.stopPropagation();
  }

  showCustomizeView() {
    // this.loadSettings();
    this.showFilters = false;
    this.showSavedFilters = false;
    this.showCustomizeViewTable = !this.showCustomizeViewTable;

  }

  showFiltersTable() {
    let assigneesMap = [];
    if (this.assignees) {
      this.assignees.forEach( assignee => {
        if (assignee.assigneeId !== "-1") {
          assigneesMap.push( new NameValue( assignee.assigneeId, assignee.name ) );
        }
      } );
    }
    //fixing assignee filters
    if (this.selectedColumns[ "p" ] != null) {
      this.selectedColumns[ "p" ].forEach( ( col, i ) => {
        if (col.participantColumn.name === Filter.ASSIGNEE_MR.participantColumn.name) {
          this.selectedColumns[ "p" ][ i ] = new Filter( ParticipantColumn.ASSIGNEE_MR, Filter.OPTION_TYPE, assigneesMap );
        }
      } );
      this.selectedColumns[ "p" ].forEach( ( col, i ) => {
        if (col.participantColumn.name === Filter.ASSIGNEE_TISSUE.participantColumn.name) {
          this.selectedColumns[ "p" ][ i ] = new Filter( ParticipantColumn.ASSIGNEE_TISSUE, Filter.OPTION_TYPE, assigneesMap );
        }
      } );
    }
    this.showCustomizeViewTable = false;
    this.showSavedFilters = false;
    this.showFilters = !this.showFilters;
  }

  showSavedFiltersPanel() {
    this.showCustomizeViewTable = false;
    this.showFilters = false;
    this.showSavedFilters = !this.showSavedFilters;
    if (this.showSavedFilters) {
      this.getFilters();
    }
  }

  public clearFilter() {
    this.filterQuery = null;
    this.deselectQuickFilters();
    this.clearManualFilters();
    this.selectedFilterName = "";
    this.getData();
    this.setDefaultColumns();
  }

  private setDefaultColumns() {
    let filteredColumns = this.extractDefaultColumns(this.selectedColumns);
    Object.assign(this.selectedColumns, filteredColumns);
    if (this.isDataOfViewFilterExists()) {
      this.viewFilter.columns = this.extractDefaultColumns(this.viewFilter.columns);
    }
  }

  private extractDefaultColumns(selectedColumns: {}): {} {
    let filteredColumns = {};
    for (var [key, value] of Object.entries(selectedColumns)) {
      let val = value as Filter[];
      let newVal = [];
      val.forEach(el => {
        this.defaultColumns.forEach(col => {
          if (el['participantColumn']['name'] === col['participantColumn']['name']) {
            newVal.push(el);
          }
        });
      });
      filteredColumns[key] = newVal;
    }
    return filteredColumns;
  }

  public parseMillisToDateString( dateInMillis: number ) : string {
    const date = new Date(dateInMillis);
    const options = {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC'};
    const dateString = date.toLocaleString('en-US', options);
    return dateString;
  }

  public clearManualFilters() {
    this.dataSources.forEach( ( value: string, key: string ) => {
      if (this.selectedColumns[ key ] != null) {
        for (let filter of this.selectedColumns[ key ]) {
          if (filter != null && filter != undefined) {
            filter.clearFilter();
          }
        }
      }
    } );
    this.resetPagination();
    // console.log( this.savedFilters );
  }

  private resetPagination() {
    this.viewFilter = null;
    this.jsonPatch = null;
    this.activePage = 1;
    this.rowsPerPage = this.role.getUserSetting().getRowsPerPage();
  }

  public setSelectedFilterName( filterName ) {
    this.selectedFilterName = filterName;
  }


  addOrRemoveColumn( column: Filter, parent: string ) {
    if (this.selectedColumns[ parent ] == null) {
      this.selectedColumns[ parent ] = [];
    }
    if (this.hasThisColumnSelected( this.selectedColumns[ parent ], column )) {
      // console.log( this.selectedColumns[ parent ] );
      let f = this.selectedColumns[ parent ].find( f => {
        return f.participantColumn.tableAlias === column.participantColumn.tableAlias && f.participantColumn.name === column.participantColumn.name;
      } );
      let index = this.selectedColumns[ parent ].indexOf( f );
      // console.log( index );
      this.selectedColumns[ parent ].splice( index, 1 );
    } else {
      this.selectedColumns[ parent ].push( column );
    }
    if (this.isDataOfViewFilterExists()) {
      this.viewFilter.columns.data.push(column);
    }
  }

  private isDataOfViewFilterExists() {
    return this.viewFilter && this.viewFilter.columns && this.viewFilter.columns.data;
  }

  renewSelectedColumns() {
    if (this.savedSelectedColumns["data"] && this.sourceColumns["data"]) {
      this.selectedColumns["data"] = this.savedSelectedColumns["data"].map(filter => {
        let column = this.sourceColumns["data"].find(f =>
          f.participantColumn.tableAlias === filter.participantColumn.tableAlias && f.participantColumn.name === filter.participantColumn.name
        )
        return column;
      });
    }
  }

  saveSelectedColumns() {
    this.savedSelectedColumns = this.selectedColumns;
  }

  openParticipant( participant: Participant, colSource: string ) {
    if (participant != null) {
      let tabAnchor = "Survey Data";
      if (colSource === "m" || participant.data.activities == null) {
        tabAnchor = "Medical Records";
        this.selectedMR = "";
        this.selectedOncOrTissue = "";
      } else if (colSource === "oD" || colSource === "t") {
        tabAnchor = "Onc History";
        this.selectedMR = "";
        this.selectedOncOrTissue = "";
      }
      if (participant.participantData) {
        let proband = participant.participantData.find( p => p.data[ "MEMBER_TYPE" ] === "SELF" )
        if (!proband) {
          proband = participant.participantData.find( p => p.data[ "COLLABORATOR_PARTICIPANT_ID" ] && p.data[ "COLLABORATOR_PARTICIPANT_ID" ].slice( -2 ) === "_3" )
        }
        if (proband && proband.dataId) {
          tabAnchor = proband.dataId;
        }
      }
      if (this.filtered && participant.participant != null && participant.participant.ddpParticipantId != null) {
        this.loadingParticipants = localStorage.getItem( ComponentService.MENU_SELECTED_REALM );
        this.dsmService.getParticipantData( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), participant.participant.ddpParticipantId, this.parent ).subscribe(
          data => {
            if (data != null && data[ 0 ] != null) {
              let pt: Participant = Participant.parse( data[ 0 ] );
              if (pt == null || pt == undefined) {
                this.errorMessage = "Participant not found";
              } else {
                if (pt.participant != null && pt.participant.ddpParticipantId != null
                  && pt.participant.ddpParticipantId === participant.participant.ddpParticipantId) {
                  this.selectedTab = tabAnchor;
                  this.participant = pt;
                  this.showParticipantInformation = true;
                  this.showTissue = false;
                }
              }
            } else {
              this.errorMessage = "Error - Loading Participant Information, Please contact your DSM developer";
            }
            this.loadingParticipants = null;
          },
          err => {
            this.errorMessage = "Error - Loading Participant Information, Please contact your DSM developer";
          }
        );
      } else {
        this.selectedTab = tabAnchor;
        this.participant = participant;
        this.showParticipantInformation = true;
        this.showTissue = false;
      }
    }
  }

  openTissue( participant: Participant, oncHistory: OncHistoryDetail ) {
    if (participant != null && oncHistory != null) {
      this.participant = participant;
      this.oncHistoryDetail = oncHistory;
      this.showTissue = true;
    }
  }

  getRealm(): string {
    return localStorage.getItem( ComponentService.MENU_SELECTED_REALM );
  }

  getFilterButtonColorStyle( isOpened: boolean ): string {
    if (isOpened) {
      return Statics.COLOR_ACCENT;
    }
    return Statics.COLOR_BASIC;
  }

  getButtonColorStyle( isOpened: boolean ): string {
    if (isOpened) {
      return Statics.COLOR_PRIMARY;
    }
    return Statics.COLOR_BASIC;
  }

  public doFilter() {
    this.resetPagination();
    let json = [];
    this.dataSources.forEach( ( value: string, key: string ) => {
        this.createFilterJson( json, key );
      }
    );
    // console.log(json);
    //nothing to filter on the server
    if (json.length != 0) {
      this.filterQuery = null;
      this.selectedFilterName = null;
      this.deselectQuickFilters();
      let data = {
        "filters": json,
        "parent": this.parent
      };
      let jsonPatch = JSON.stringify( data );
      this.currentFilter = json;
      this.currentView = jsonPatch;
      this.jsonPatch = jsonPatch;
      this.filtered = true;
      this.loadingParticipants = localStorage.getItem( ComponentService.MENU_SELECTED_REALM );
      this.dsmService.filterData( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), jsonPatch, this.parent, null ).subscribe(
        data => {
          if (data != undefined && data != null && data !== "") {
            let jsonData: {};
            this.participantList = [];
            this.additionalMessage = "";
            this.originalParticipantList = [];
            this.copyParticipantList = [];
            this.filterQuery = "";
            jsonData = data;
            jsonData['participants'].forEach( ( val ) => {
              let participant = Participant.parse( val );
              this.participantList.push( participant );
            } );
            this.originalParticipantList = this.participantList;
            this.participantsSize = jsonData['totalCount'];
            if (!this.hasESData) {
              this.filterClientSide( null );
            }
            this.loadingParticipants = null;
            this.errorMessage = null;
            window.scrollTo( 0, 0 );
            let date = new Date();
            this.loadedTimeStamp = Utils.getDateFormatted( date, Utils.DATE_STRING_IN_EVENT_CVS );
            this.additionalMessage = null;
          } else {
            this.additionalMessage = "Something went wrong while filtering - List was not filtered!";
          }
          // console.log(this.savedFilters);
        },
        err => {
          this.loadingParticipants = null;
          this.errorMessage = "Error - Loading Participant List, Please contact your DSM developer\n " + err;
        }
      );
    } else {
      this.filtered = false;
      this.filterQuery = "";
      this.selectedFilterName = null;
      this.deselectQuickFilters();
      //TODO - can be changed later to all using the same - after all studies are migrated!
      //check if it was a tableAlias data filter -> filter client side
      this.selectFilter( null );
    }

  }

  createFilterJson( json, key: string ) {
    if (this.selectedColumns[ key ] != null) {
      for (let filter of this.selectedColumns[ key ]) {
        this.addFilterToJson( filter, json );
      }
    }
  }

  addFilterToJson( filter: Filter, json ) {
    let tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
    let filterText = null;
    // change filter to something backend knows!
    if (filter.participantColumn.name === "sampleQueue") {
      if (filter.type === Filter.OPTION_TYPE) {
        let status = null;
        for (let [key, value] of Object.entries( filter.selectedOptions )) {
          if (value) {
            status = filter.options[ key ].name;
            break;
          }
        }
        if (status != null) {
          if (status === "shipped") {
            let filter1 = new NameValue( "scanDate", null );
            let filter2 = new NameValue( "scanDate", "true" );
            filterText = Filter.getFilterJson( tmp, filter1, filter2, null, false, Filter.DATE_TYPE, false, false, true, filter.participantColumn );
            json.push( filterText );
            filter1 = new NameValue( "receiveDate", "true" );
            filter2 = new NameValue( "receiveDate", null );
            filterText = Filter.getFilterJson( tmp, filter1, filter2, null, false, Filter.DATE_TYPE, false, true, false, filter.participantColumn );
          }
          if (status === "received") {
            let filter1 = new NameValue( "receiveDate", null );
            let filter2 = new NameValue( "receiveDate", "true" );
            filterText = Filter.getFilterJson( tmp, filter1, filter2, null, false, Filter.DATE_TYPE, false, false, true, filter.participantColumn );
          }
          if (status === "deactivated") {
            let filter1 = new NameValue( "deactivatedDate", null );
            let filter2 = new NameValue( "deactivatedDate", "true" );
            filterText = Filter.getFilterJson( tmp, filter1, filter2, null, false, Filter.DATE_TYPE, false, false, true, filter.participantColumn );
          }
          if (status === "error") {
            let filter1 = new NameValue( "error", "true" );
            let filter2 = new NameValue( "error", null );
            filterText = Filter.getFilterJson( tmp, filter1, filter2, null, false, Filter.CHECKBOX_TYPE, false, false, false, filter.participantColumn );
            json.push( filterText );
            filter1 = new NameValue( "scanDate", "true" );
            filter2 = new NameValue( "scanDate", null );
            filterText = Filter.getFilterJson( tmp, filter1, filter2, null, false, Filter.DATE_TYPE, false, true, false, filter.participantColumn );
          }
          if (status === "queue") {
            let filter1 = new NameValue( "scanDate", "true" );
            let filter2 = new NameValue( "scanDate", null );
            filterText = Filter.getFilterJson( tmp, filter1, filter2, null, false, Filter.DATE_TYPE, false, true, false, filter.participantColumn );
          }
        }
      }
    }
    else if (filter.participantColumn.name === "uploadReason") {
      if (filter.type === Filter.OPTION_TYPE) {
        let option = null;
        for (let [key, value] of Object.entries( filter.selectedOptions )) {
          if (value) {
            option = filter.options[ key ].name;
            break;
          }
        }
        if (option === "SAMPLE_UPLOAD_EMPTY") {
          let filter1 = new NameValue( "uploadReason", null );
          let filter2 = new NameValue( "uploadReason", null );
          filterText = Filter.getFilterJson( tmp, filter1, filter2, [], true, Filter.OPTION_TYPE, false, true, false, filter.participantColumn )
        }
        else {
          filterText = Filter.getFilterText( filter, tmp );
        }
      }
    }
    else {
      filterText = Filter.getFilterText( filter, tmp );
    }
    if (filterText != null) {
      json.push( filterText );
    }
  }

  hasRole(): RoleService {
    return this.role;
  }

  public shareFilter( savedFilter: ViewFilter, i ) {
    let value = savedFilter.shared ? "0" : "1";
    let patch1 = new PatchUtil( savedFilter.id, this.role.userMail(),
      {name: "shared", value: value}, null, this.parent, null, null, null, localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), null );
    let patch = patch1.getPatch();
    this.dsmService.patchParticipantRecord( JSON.stringify( patch ) ).subscribe( data => {
      let result = Result.parse( data );
      if (result.code == 200) {
        this.savedFilters[ i ].shared = ( value === "1" );
      }
    }, err => {
      this.additionalMessage = "Error - Sharing Filter, Please contact your DSM developer";
    } );
  }

  public deleteView( savedFilter: ViewFilter ) {
    let patch1 = new PatchUtil( savedFilter.id, this.role.userMail(),
      {name: "fDeleted", value: "1"}, null, this.parent, null, null, null, localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), null );
    let patch = patch1.getPatch();
    this.dsmService.patchParticipantRecord( JSON.stringify( patch ) ).subscribe( data => {
      let result = Result.parse( data );
      if (result.code == 200) {
        this.getFilters();
      }
    }, err => {
      this.additionalMessage = "Error - Deleting Filter, Please contact your DSM developer";
    } );
  }

  saveCurrentFilter() {
    this.dup = false;
    this.plus = false;
    if (this.filterName.includes( "+" )) {
      this.plus = true;
      return;
    }

    let columns = [];
    this.dataSources.forEach( ( value: string, key: string ) => {
      if (this.selectedColumns != null && this.selectedColumns[ key ] != null) {
        for (let col of this.selectedColumns[ key ]) {
          columns.push( col.participantColumn.tableAlias + "." + col.participantColumn.name );
        }
      }
    } );
    let tmpFilterName = this.selectedFilterName;
    let quickFilter = this.quickFilters.find( x => x.filterName === this.selectedFilterName );
    if (quickFilter == null) {
      tmpFilterName = null;
    }

    let jsonData = {
      "columnsToSave": columns,
      "filterName": this.filterName,
      "shared": "0",
      "fDeleted": "0",
      "filters": this.currentFilter,
      "parent": this.parent,
      "quickFilterName": tmpFilterName,
      "queryItems": this.filterQuery
    };
    let jsonPatch = JSON.stringify( jsonData );
    this.currentView = jsonPatch;
    this.dsmService.saveCurrentFilter( jsonPatch, localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), this.parent ).subscribe(
      data => {
        let result = Result.parse( data );
        if (result.code === 500 && result.body != null) {
          this.dup = true;
          return;
        } else if (result.code !== 500) {
          this.dup = false;
          this.plus = false;
          this.filterName = null;
          this.modal.hide();
        }
      },
      err => {
        this.additionalMessage = "Error - Saving Filter, Please contact your DSM developer";
      } );
  }

  public isSortField( name: string ) {
    return name === this.sortField;
  }

  sortByColumnName( col: Filter, sortParent: string ) {
    this.sortDir = this.sortField === col.participantColumn.name ? ( this.sortDir === "asc" ? "desc" : "asc" ) : "asc";
    this.sortField = col.participantColumn.name;
    this.sortParent = sortParent;
    this.doSort( col.participantColumn.object, col );
  }

  private doSort( object: string, col: Filter ) {
    let colType = col.type;
    let order = this.sortDir === "asc" ? 1 : -1;
    if (this.sortParent === "data" && object != null) {
      this.participantList.sort( ( a, b ) => {
        if (a.data[ object ] == null) {
          return 1;
        } else if (b.data[ object ] == null) {
          return -1;
        } else {
          return this.sort( a.data[ object ][ this.sortField ], b.data[ object ][ this.sortField ], order, undefined, colType );
        }
      } );
    } else if (this.sortParent === "data" && object == null) {
      this.participantList.sort( ( a, b ) => ( a.data == null || b.data == null ) ? 1 : this.sort( a.data, b.data, order, this.sortField, colType ) );
    } else if (this.sortParent === "p") {
      this.participantList.sort( ( a, b ) => {
        if (a.participant == null || (a.participant[ this.sortField ] == null && a.participant['additionalValues'] == null)) {
          return 1;
        } else if (b.participant == null || (b.participant[ this.sortField ] == null && b.participant['additionalValues'] == null)) {
          return -1;
        } else {
          if (a.participant['additionalValues'][this.sortField] != null || b.participant['additionalValues'][this.sortField] != null) {
            return this.sort( a.participant['additionalValues'][ this.sortField ], b.participant['additionalValues'][ this.sortField ], order, undefined, colType )
          } else {
            return this.sort( a.participant[ this.sortField ], b.participant[ this.sortField ], order, undefined, colType );
          }
        }
      } );
    } else if (this.sortParent === "m") {
      this.participantList.map( participant =>
        participant.medicalRecords.sort( (n, m) => this.sort( n[ this.sortField ], m[ this.sortField ], order, undefined, colType ))
      )
      this.participantList.sort( ( a, b ) => {
        if (a.medicalRecords === null || a.medicalRecords == undefined || a.medicalRecords.length < 1) {
          return 1;
        } else if (b.medicalRecords === null || b.medicalRecords == undefined || b.medicalRecords.length < 1) {
          return -1;
        } else {
          return this.sort(a.medicalRecords[0][this.sortField], b.medicalRecords[0][this.sortField], order, undefined, colType );
        }
      } );
    } else if (this.sortParent === "oD") {
      this.participantList.map( participant =>
        participant.oncHistoryDetails.sort( (n, m) => this.sort( n[ this.sortField ], m[ this.sortField ], order, undefined, colType ))
      )
      this.participantList.sort( ( a, b ) => {
        if (a.oncHistoryDetails === null || a.oncHistoryDetails == undefined || a.oncHistoryDetails.length < 1) {
          return 1;
        } else if (b.oncHistoryDetails === null || b.oncHistoryDetails == undefined || b.oncHistoryDetails.length < 1) {
          return -1;
        } else {
          return this.sort(a.oncHistoryDetails[0][this.sortField], b.oncHistoryDetails[0][this.sortField], order, undefined, colType );
        }
      } );
    } else if (this.sortParent === "t") {
    } else if (this.sortParent === "k") {
      this.participantList.map( participant =>
        participant.kits.sort( (n, m) => this.sort( n[ this.sortField ], m[ this.sortField ], order, undefined, colType ))
      )
      this.participantList.sort( ( a, b ) => {
        if (a.kits === null || a.kits == undefined || a.kits.length < 1) {
          return 1;
        } else if (b.kits === null || b.kits == undefined || b.kits.length < 1) {
          return -1;
        } else {
          return this.sort(a.kits[0][this.sortField], b.kits[0][this.sortField], order, undefined, colType );
        }
      } );
    } else if (this.checkIfColumnIsTabGrouped(this.sortParent) || this.checkIfColumnIsTabbed(this.sortParent)) {
      this.participantList.forEach(participant => {
        if (participant.participantData.length > 1) {
          participant.participantData.sort((n, m) => this.sort(this.getPersonField(n, col, null), this.getPersonField(m, col, null), order));
        }
      })
      this.participantList.sort((a, b) => {
        if (a.participantData && !a.participantData[0] == null || this.getPersonField(a.participantData[0], col, null) == null) {
          return 1;
        } else if (!b.participantData && !b.participantData[0] == null || !this.getPersonField(b.participantData[0], col, null) == null) {
          return 0;
        } else {
          return this.sort(this.getPersonField(a.participantData[0], col, null),
            this.getPersonField(b.participantData[0], col, null), order, undefined, colType);
        }
      })
    }
    else {
      //activity data
      this.participantList.map( participant => {
        let activityData = participant.data.getActivityDataByCode( this.sortParent );
        if (activityData !== null && activityData !== undefined) {
          let questionAnswer = this.getQuestionAnswerByName( activityData.questionsAnswers, this.sortField );
          if (questionAnswer !== null && questionAnswer !== undefined && questionAnswer.questionType === "COMPOSITE") {
            questionAnswer.answer.sort( ( n, m ) => this.sort( n.join(), m.join(), order ));
          }
        }
      })
      this.participantList.sort( ( a, b ) => {
        let activityDataA = a.data.getActivityDataByCode( this.sortParent );
        let activityDataB = b.data.getActivityDataByCode( this.sortParent );
        if (activityDataA == null) {
          return 1;
        } else if (activityDataB == null) {
          return -1;
        } else {
          if (this.sortField === "createdAt" || this.sortField === "completedAt" || this.sortField === "lastUpdatedAt" || this.sortField === "status") {
            return this.sort( activityDataA[ this.sortField ], activityDataB[ this.sortField ], order );
          } else {
            let questionAnswerA = this.getQuestionAnswerByName( activityDataA.questionsAnswers, this.sortField );
            let questionAnswerB = this.getQuestionAnswerByName( activityDataB.questionsAnswers, this.sortField );
            if (questionAnswerA == null) {
              return 1;
            } else if (questionAnswerB == null) {
              return -1;
            } else {
              if (questionAnswerA.questionType === "DATE") {
                return this.sort( questionAnswerA.date, questionAnswerB.date, order );
              } else if (questionAnswerA.questionType === "PICKLIST") {
                let optionsA = this.selectedColumns[activityDataA.activityCode].find(f => f.participantColumn.name === questionAnswerA.stableId).options;
                let sortedListStringA = "";
                optionsA.forEach(element => {
                  if (questionAnswerA.answer.includes(element.name)) {
                    sortedListStringA += this.findOptionValue(element.name, activityDataA.activityCode, questionAnswerA.stableId);
                  }
                });

                let optionsB = this.selectedColumns[activityDataB.activityCode].find(f => f.participantColumn.name === questionAnswerB.stableId).options;
                let sortedListStringB = "";
                optionsB.forEach(element => {
                  if (questionAnswerB.answer.includes(element.name)) {
                    sortedListStringB += this.findOptionValue(element.name, activityDataB.activityCode, questionAnswerB.stableId);
                  }
                });
                return this.sort( sortedListStringA, sortedListStringB, order );
              } else {
                return this.sort( questionAnswerA.answer, questionAnswerB.answer, order );
              }
            }
          }
        }
      } );
    }
  }

  private sort( x, y, order, sortField?, colType? ) {
    if (sortField !== undefined && x != undefined && y != undefined && x != null && y != null) {
      x = x[ sortField ];
      y = y[ sortField ];
    }
    if (x === null || x == undefined || x === "" || (colType == "DATE" && x === 0)) {
      return 1;
    } else if (y === null || y == undefined || y === "" || (colType == "DATE" && y === 0)) {
      return -1;
    } else {
      if (typeof x === "string") {
        if (x.toLowerCase() < y.toLowerCase()) {
          return -1 * order;
        } else if (x.toLowerCase() > y.toLowerCase()) {
          return 1 * order;
        } else {
          return 0;
        }
      } else {
        if (x < y) {
          return -1 * order;
        } else if (x > y) {
          return 1 * order;
        } else {
          return 0;
        }
      }
    }
  }

  findOptionValue(chosenOption: Array<string>, activityCode: string, stableId: string) {
    let filter = this.selectedColumns[activityCode].find(f => f.participantColumn.name === stableId);
    let optionValue = filter.options.find(option => option.name === chosenOption);
    return optionValue.value;
  }

  public isSelectedFilter( filterName ): boolean {
    return this.selectedFilterName === filterName;
  }

  getUtil(): Utils {
    return this.util;
  }

  getLanguageName(languageCode: string): string {
      let language = this.preferredLanguages.find( obj => {
        return obj.languageCode === languageCode;
      } );
      if (language != null) {
        return language.displayName;
      }
      return "";
  }

  getKeys() {
    return Array.from( this.dataSources.keys() );
  }

  getTableAlias( col: ParticipantColumn ) {
    return col.object != null ? col.object : col.tableAlias;
  }

  downloadCurrentData() {
    let date = new Date();
    let columns = {};
    this.dataSources.forEach( ( value: string, key: string ) => {
      if (this.selectedColumns[ key ] != null && this.selectedColumns[ key ].length != 0) {
        columns[ key ] = this.selectedColumns[ key ];
      }
    } );

    let paths: any[][] = [];

    for (let source of Object.keys( columns )) {
      if (source === "p") {
        paths.push(["participant", source]);
      } else if (source === "t") {
        paths.push(["tissues", source]);
      } else if (source === "m") {
        paths.push(["medicalRecords", source]);
      } else if (source === "oD") {
        paths.push(["oncHistoryDetails", source]);
      } else if (source === "k") {
        paths.push(["kits", source]);
      } else if (source === "a") {
        paths.push(["abstractionActivities", source]);
        paths.push(["abstractionSummary", source]);
      } else if (source === "invitations") {
        paths.push(["invitations", source]);
      } else if (source === "proxy") {
        paths.push(["proxyData", source]);
      } else if (source.includes("GROUP")) {
        paths.push(["participantData", source]);
      } else if (source === "proxy") {
        paths.push(["proxyData", source])
      } else {
        paths.push([source, source]);
      }
    }

    Utils.downloadCurrentData( this.participantList, paths, columns, "Participants-"  + Utils.getDateFormatted( date, Utils.DATE_STRING_CVS ) + Statics.CSV_FILE_EXTENSION, false );

  }

  getOptionDisplay( options: NameValue[], key: string ) {
    if (options != null) {
      let nameValue = options.find( obj => {
        return obj.name === key;
      } );
      if (nameValue != null) {
        return nameValue.value;
      }
    }
    return key;
  }

  checkboxChecked() {
    this.isAssignButtonDisabled = true;
    for (let pt of this.participantList) {
      if (pt.isSelected) {
        this.isAssignButtonDisabled = false;
        break;
      }
    }
  }

  assign() { //arg[0] = selectedAssignee: Assignee
    this.additionalMessage = null;
    if (this.assignee != null && this.participantList.length > 0) {
      let assignParticipants: Array<AssigneeParticipant> = [];
      for (let pt of this.participantList) {
        if (pt.isSelected) {
          if (this.assignMR) {
            if (this.assignee.assigneeId === "-1") {
              pt.participant.assigneeMr = null;
            } else {
              pt.participant.assigneeMr = this.assignee.name;
            }
          }
          if (this.assignTissue) {
            if (this.assignee.assigneeId === "-1") {
              pt.participant.assigneeMr = null;
            } else {
              pt.participant.assigneeTissue = this.assignee.name;
            }
          }
          assignParticipants.push( new AssigneeParticipant( pt.participant.participantId, this.assignee.assigneeId,
            this.assignee.email, pt.data.profile[ "shortId" ] ) );
        }
      }
      this.deselect();
      this.dsmService.assignParticipant( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), this.assignMR, this.assignTissue, JSON.stringify( assignParticipants ) ).subscribe(// need to subscribe, otherwise it will not send!
        data => {
          let result = Result.parse( data );
          if (result.code !== 200) {
            this.additionalMessage = result.body;
          }
          // this.loadParticipantData();
          this.assignMR = false;
          this.assignTissue = false;
        },
        err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.router.navigate( [Statics.HOME_URL] );
          }
          this.additionalMessage = "Error - Assigning Participants, Please contact your DSM developer";
        }
      );
    }
    this.modal.hide();
    window.scrollTo( 0, 0 );
  }

  assigneeSelected( evt: any ) {
    this.assignee = evt;
  }

  deselect() {
    for (let pt of this.participantList) {
      if (pt.isSelected) {
        pt.isSelected = false;
      }
    }
  }

  openModal( modalAnchor: string ) {
    this.modalAnchor = modalAnchor;
    this.modal.show();
  }

  deselectQuickFilters() {
    this.deselectFilters( this.quickFilters );
  }

  deselectFilters( filterArray: ViewFilter[] ) {
    if (filterArray != null) {
      filterArray.forEach( filter => {
        if (filter.selected) {
          filter.selected = false;
        }
      } );
    }
  }

  public doFilterByQuery( queryText: string ) {
    this.clearManualFilters();
    this.deselectQuickFilters();
    this.deactivateSavedFilterIfNotInUse(queryText);
    queryText = queryText.replace("( k.uploadReason = 'NORMAL' )", "k.uploadReason IS NULL");
    queryText = queryText.replace("( k.uploadReason like 'NORMAL' )", "k.uploadReason IS NULL");
    let data = {
      "filterQuery": queryText,
      "parent": this.parent
    };
    let jsonPatch = JSON.stringify( data );
    if (queryText != null) {
      this.filtered = true;
    } else {
      this.filtered = false;
    }
    this.jsonPatch = jsonPatch;
    this.loadingParticipants = localStorage.getItem( ComponentService.MENU_SELECTED_REALM );
    this.dsmService.filterData( localStorage.getItem( ComponentService.MENU_SELECTED_REALM ), jsonPatch, this.parent, null ).subscribe( data => {
      this.participantList = [];
      this.additionalMessage = "";
      this.originalParticipantList = [];
      this.copyParticipantList = [];
      if (data != null) {
        let jsonData: {};
        jsonData = data;
        jsonData['participants'].forEach( ( val ) => {
          let participant = Participant.parse( val );
          this.participantList.push( participant );
        } );
        this.originalParticipantList = this.participantList;
        this.participantsSize = jsonData['totalCount'];
        let date = new Date();
        this.loadedTimeStamp = Utils.getDateFormatted( date, Utils.DATE_STRING_IN_EVENT_CVS );
        this.additionalMessage = null;
      }
      this.loadingParticipants = null;
      this.filterQuery = queryText;
    }, err => {
      this.participantList = [];
      this.originalParticipantList = [];
      this.copyParticipantList = [];
      this.loadingParticipants = null;
      this.additionalMessage = "Error - Filtering Participant List, Please contact your DSM developer";
    } );
  }

  private deactivateSavedFilterIfNotInUse(queryText: string) {
    if (this.filterQuery !== queryText) {
      this.selectedFilterName = "";
    }
  }

  addContactInformationColumns(): void {
    this.showContactInformation = true;

    this.dataSources.set("address", "Contact Information");
    let possibleColumns: Array<Filter> = [];
    possibleColumns.push(new Filter( new ParticipantColumn("Street 1", "street1", "address", null, true), Filter.TEXT_TYPE) );
    possibleColumns.push(new Filter( new ParticipantColumn("Street 2", "street2", "address", null, true), Filter.TEXT_TYPE) );
    possibleColumns.push(new Filter( new ParticipantColumn("City", "city", "address", null, true), Filter.TEXT_TYPE) );
    possibleColumns.push(new Filter( new ParticipantColumn("State", "state", "address", null, true), Filter.TEXT_TYPE) );
    possibleColumns.push(new Filter( new ParticipantColumn("Zip", "zip", "address", null, true), Filter.TEXT_TYPE) );
    possibleColumns.push(new Filter( new ParticipantColumn("Country", "country", "address", null, true), Filter.TEXT_TYPE) );
    possibleColumns.push(new Filter( new ParticipantColumn("Phone", "phone", "address", null, true), Filter.TEXT_TYPE) );
    possibleColumns.push(new Filter( new ParticipantColumn("Mail To Name", "mailToName", "address", null, true), Filter.TEXT_TYPE) );
    possibleColumns.push(new Filter( new ParticipantColumn("Valid", "valid", "address", null, true), Filter.BOOLEAN_TYPE) );

    this.sourceColumns["address"] = possibleColumns;
    this.selectedColumns[ "address" ] = [];
    possibleColumns.forEach( filter => {
      let tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
      this.allFieldNames.add( tmp + "." + filter.participantColumn.name );
    } );
    this.orderColumns();
  }

  getQuestionAnswerByName( questionsAnswers: Array<QuestionAnswer>, name: string ) {
    return questionsAnswers.find( x => x.stableId === name );
  }

  updateParticipant( participant: Participant ) {
    if (participant != null) {
      this.showParticipantInformation = false;
      let pt = this.participantList.find( pt => {
        return pt.data.profile[ "guid" ] == participant.data.profile[ "guid" ];
      } );
      if (pt != null) {
        let index = this.participantList.indexOf( pt );
        this.participantList[ index ] = participant;
      }
    }
  }

  getMultiObjects( fieldValue: string | string[] ) {
    if (!( fieldValue instanceof Array )) {
      let o: any = JSON.parse( fieldValue );
      return o;
    }
    return null;
  }

  getMultiKeys( o: any ) {
    if (o != null) {
      return Object.keys( o );
    }
    return null;
  }

  isDateValue( value: string ): boolean {
    if (value != null && value != undefined && typeof value === "string" && value.indexOf( "dateString" ) > -1 && value.indexOf( "est" ) > -1) {
      return true;
    }
    return false;
  }

  getDateValue( value: string ) {
    if (value != null) {
      let o: any = JSON.parse( value );
      return o[ "dateString" ];
    }
    return "";
  }

  filterClientSide( viewFilter: ViewFilter ) {
    let didClientSearch = false;
    if (viewFilter == null && this.selectedColumns[ "data" ].length == 0) {
      return didClientSearch;
    }
    let participantFilters: Filter[];
    if (viewFilter != null && viewFilter.filters != null && viewFilter.filters.length != 0) {
      participantFilters = viewFilter.filters;
    } else if (viewFilter == null) {
      participantFilters = this.selectedColumns[ "data" ];
    }
    this.copyParticipantList = this.originalParticipantList;
    if (participantFilters != null && participantFilters.length != 0) {
      for (let filter of participantFilters) {
        if (filter.participantColumn.tableAlias === "data") {
          let tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
          let filterText = Filter.getFilterText( filter, tmp );
          if (filterText != null) {
            didClientSearch = true;
            if (filter.type === "TEXT") {
              let value = filterText[ "filter1" ][ "value" ];
              if (value !== null) {
                if (value.includes( "'" )) {
                  let first = value.indexOf( "'" );
                  let last = value.lastIndexOf( "'" );
                  value = value.substring( first + 1, last );
                } else if (value.includes( "\"" )) {
                  let first = value.indexOf( "\"" );
                  let last = value.lastIndexOf( "\"" );
                  value = value.substring( first + 1, last );
                }
                // console.log( filterText );
                if (value != null && value !== "") {
                  this.copyParticipantList = this.copyParticipantList.filter( participant =>
                    participant.data !== null &&
                    participant.data[ filterText[ "parentName" ] ][ filterText[ "filter1" ][ "name" ] ] === value
                  );
                }
                this.participantList = this.copyParticipantList;
              } else {
                let empt = filterText[ "empty" ];
                if (empt === "true") {
                  this.copyParticipantList = this.copyParticipantList.filter( participant =>
                    participant.data !== null &&
                    participant.data[ filterText[ "parentName" ] ][ filterText[ "filter1" ][ "name" ] ] === null
                  );
                } else {
                  let notempt = filterText[ "notEmpty" ];
                  if (notempt === "true") {
                    this.copyParticipantList = this.copyParticipantList.filter( participant =>
                      participant.data !== null &&
                      participant.data[ filterText[ "parentName" ] ][ filterText[ "filter1" ][ "name" ] ] !== null
                    );
                  }
                }
                this.participantList = this.copyParticipantList;
              }

            } else if (filterText[ "type" ] === "OPTIONS") {
              let results: Participant[] = new Array();
              let temp: Participant[] = new Array();
              for (let option of filterText[ "selectedOptions" ]) {// status
                temp = this.copyParticipantList.filter( participant =>
                  participant.data != null &&
                  participant.data[ filterText[ "filter1" ][ "name" ] ] === option
                );
                for (let t of temp) {
                  results.push( t );
                }
              }
              this.copyParticipantList = results;
              this.participantList = results;
            }
          }
        }
      }
    }
    return didClientSearch;
  }

  hasThisColumnSelected( selectedColumnArray: Array<Filter>, oncColumn: Filter ): boolean {
    let f = selectedColumnArray.find( f => {
      return f.participantColumn.tableAlias === oncColumn.participantColumn.tableAlias && f.participantColumn.name === oncColumn.participantColumn.name;
    } );
    return f !== undefined;
  }

  changeRowNumber(rows: number) {
    this.pageChanged(this.activePage, rows);
    this.rowsPerPage = rows;
  }

  formatInvitation(invitationCode: string): string{
    return invitationCode == undefined ? "" : invitationCode.match(/.{1,4}/g).join('-');
  }

  getParticipantData(participant: Participant, column: string, fieldTypeId: string) {
    if (participant != null && participant.participantData != null && fieldTypeId != null && column != null) {
      let participantData = participant.participantData.find(participantData => participantData.fieldTypeId === fieldTypeId);
      if (participantData != null && participantData.data != null && participantData.data[column] != null) {
        return participantData.data[column];
      }
    }
    return "";
  }

  updateStudySpecificStatuses(statuses: NameValue[]) {
    if (this.sourceColumns && this.sourceColumns[ "data" ]) {
      let statusFilter: Filter = this.sourceColumns["data"].find( (filter: Filter) => filter.participantColumn.name === 'status');
      if (statusFilter && statusFilter.options) {
        if (statusFilter.options.length > 1) {
          statusFilter.options = statusFilter.options.slice(0, 1);
        }
        if (statuses) {
          statuses.forEach( ( status: NameValue ) => statusFilter.options.push(new NameValue(status.name, status.value)));
        }
      }
    }
  }

  getPersonField(personData: ParticipantData, column: Filter, participant: Participant): string {
    let name: string
    if (column && column.participantColumn) {
      name = column.participantColumn.name;
    }
    return this.getPersonFieldFromDataRow(personData, column, name, participant);
  }

  getPersonFieldFromDataRow(personData: ParticipantData, column: Filter, name: string, participant: Participant): any {
    if (!personData || !personData.data || !name) {
      return null;
    }
    let currentKey = Object.keys(personData.data).find(key => key === name);
    let field = personData.data[currentKey];
    if (field) {
      if (column.options && column.options[0] && column.options[0].name) {
        let fieldToShow = null;
        if (column.additionalType === Filter.ACTIVITY_STAFF_TYPE) {
          fieldToShow = column.options.find(nameValue => nameValue.name === field);
        } else {
          fieldToShow = column.options.find(nameValue => nameValue.value === field);
        }
        if (fieldToShow != null) {
          return fieldToShow.name;
        }
        return "";
      }
      return field;
    }
    else {
      let fieldSettings:FieldSettings[] = this.settings[column.participantColumn.object];
      if (fieldSettings != null) {
        let fieldSetting = fieldSettings.find( setting => setting.columnName === name)
        if (fieldSetting != null) {
          if (fieldSetting.actions && fieldSetting.actions[0]) {
            if (fieldSetting.actions[0].type === 'CALC' && fieldSetting.actions[0].value && personData.data[fieldSetting.actions[0].value]) {
              return this.countYears(personData.data[fieldSetting.actions[0].value]);
            } else if (fieldSetting.actions[0].type === 'SAMPLE' && fieldSetting.actions[0].type2 === 'MAP_TO_KIT') {
              return this.getSampleFieldValue(fieldSetting, personData, participant);
            }
          }
        }
      }
    }
    return "";
  }

  getSampleFieldValue(fieldSetting: FieldSettings, personsParticipantData: ParticipantData, participant: Participant): string {
    if (participant == null) {
      return "";
    }
    let sample: Sample = participant.kits.find(kit => kit.bspCollaboratorSampleId === personsParticipantData.data['COLLABORATOR_PARTICIPANT_ID']);
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

  getPersonFieldForMultipleRows(personDatas: ParticipantData[], column: Filter, participant: Participant): string {
    let name: string
    if (column && column.participantColumn) {
      name = column.participantColumn.name;
    }
    let result: string;
    for (let personData of personDatas) {
      result = this.getPersonFieldFromDataRow(personData, column, name, participant);
      if (result) {
        break;
      }
    }
    if (!result && participant.data && participant.data.activities) {
      let setting = this.findSettingByColumnName(name);
      if (setting) {
        result = Utils.getActivityDataValues(setting, participant, this.activityDefinitionList);
      }
    }
    return result;
  }

  findSettingByColumnName(name: string): FieldSettings {
    if (this.settings && this.settings['TAB']) {
      for (let tab of this.settings['TAB']) {
        for (let setting of this.settings[tab.columnName]) {
          if (setting.displayType !== 'ACTIVITY' && setting.displayType !== 'ACTIVITY_STAFF') {
            continue;
          }
          if (setting.columnName === name) {
            return setting;
          }
        }
      }
    }
  }

  getPersonType(personData: ParticipantData): string {
    return personData.data["COLLABORATOR_PARTICIPANT_ID"];
  }

  addTabGroupedColumns() {
    let possibleColumns: Array<Filter> = [];
    for (let tab of this.settings['TAB_GROUPED']) {
      for (let setting of this.settings[tab.columnName]) {
        this.dataSources.set(setting.columnName, setting.columnDisplay);
        for (let field of this.settings[setting.columnName]) {
          let filter = this.createFilter(field);
          possibleColumns.push(filter);
        }
        this.sourceColumns[setting.columnName] = possibleColumns;
        possibleColumns = [];
      }
    }
  }

  hasAssignees() {
    return Array.isArray(this.assignees) && this.assignees.length > 0;
  }

  private createFilter(field: any): Filter {
    let showType = field.displayType;
    let filter: Filter = new Filter(new ParticipantColumn(field.columnDisplay.replace('*', ''), field.columnName, 'participantData', field.fieldType, false),
    showType, field.possibleValues);
    if (showType === Filter.TEXTAREA_TYPE) {
      showType = Filter.TEXT_TYPE
      filter = new Filter(new ParticipantColumn(field.columnDisplay.replace('*', ''), field.columnName, 'participantData', field.fieldType, false),
      showType, field.possibleValues);
    } else if (showType == Filter.ACTIVITY_STAFF_TYPE) {
      if (field.possibleValues && field.possibleValues[0].type) {
        showType = field.possibleValues[0].type;
      } else {
        showType = 'TEXT';
      }
      filter = new Filter(new ParticipantColumn(field.columnDisplay.replace('*', ''), field.columnName, 'participantData', field.fieldType, false),
      showType, field.possibleValues);
      if (showType === Filter.RADIO_TYPE) {
        let options: NameValue[] = [];
        options.push(new NameValue("Yes", "1"));
        options.push(new NameValue("No", "0"));
        filter = new Filter(new ParticipantColumn(field.columnDisplay.replace('*', ''), field.columnName, 'participantData', field.fieldType, false),
          showType, options, null, null, null, null, null, null, null, null, null, null, true, Filter.ACTIVITY_STAFF_TYPE);
      }
    } else if (showType === Filter.RADIO_TYPE) {
      filter = new Filter(new ParticipantColumn(field.columnDisplay.replace('*', ''), field.columnName, 'participantData', field.fieldType, false),
      showType, field.possibleValues, null, null, null, null, null, null, null, null, null, null, true);
    }
    return filter;
  }

  addTabColumns() {
    let possibleColumns: Array<Filter> = [];
    for (let tab of this.settings['TAB']) {
      this.dataSources.set(tab.columnName, tab.columnDisplay);
      for (let setting of this.settings[tab.columnName]) {
        let filter = this.createFilter(setting);
        possibleColumns.push(filter);
      }
      this.sourceColumns[tab.columnName] = possibleColumns;
      possibleColumns = [];
    }
  }

  checkIfColumnIsTabGrouped(alias: string): boolean {
    if (this.settings && this.settings['TAB_GROUPED']) {
      for (let tab of this.settings['TAB_GROUPED']) {
        for (let setting of this.settings[tab.columnName]) {
          if (setting.columnName === alias) {
            return true;
          }
        }
      }
    }
    return false;
  }

  checkIfColumnIsTabbed(alias: string): boolean {
    if (this.settings && this.settings['TAB']) {
      for (let tab of this.settings['TAB']) {
        if (tab.columnName === alias) {
          return true;
        }
      }
    }
    return false;
  }

  addAutomatedScoringColumns(): void {
    this.showComputedObject = true;

    this.dataSources.set("computed", "Morning-Evening Questionnaire Scoring");
    let possibleColumns: Array<Filter> = [];
    possibleColumns.push(new Filter( new ParticipantColumn("MEQ Score", "meqScore", "computed", null, true), Filter.TEXT_TYPE) );
    possibleColumns.push(new Filter( new ParticipantColumn("MEQ Chronotype", "meqChronotype", "computed", null, true), Filter.TEXT_TYPE) );
    this.sourceColumns["computed"] = possibleColumns;
    this.selectedColumns[ "computed" ] = [];
    possibleColumns.forEach( filter => {
      let tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
      this.allFieldNames.add( tmp + "." + filter.participantColumn.name );
     });
     this.orderColumns();
  }
}
