import {DatePipe} from "@angular/common";
import {Injectable} from "@angular/core";
import {FormControl} from "@angular/forms";
import {AbstractionGroup} from "../abstraction-group/abstraction-group.model";
import {ActivityData} from "../activity-data/activity-data.model";
import {ActivityDefinition} from "../activity-data/models/activity-definition.model";
import {Group} from "../activity-data/models/group.model";
import {OptionDetail} from "../activity-data/models/option-detail.model";
import {Option} from "../activity-data/models/option.model";
import {QuestionAnswer} from "../activity-data/models/question-answer.model";
import {QuestionDefinition} from "../activity-data/models/question-definition.model";
import {FieldSettings} from "../field-settings/field-settings.model";
import {Filter} from "../filter-column/filter-column.model";
import {AbstractionField} from "../medical-record-abstraction/medical-record-abstraction-field.model";
import {Participant} from "../participant-list/participant-list.model";
import {NameValue} from "./name-value.model";

var fileSaver = require( "file-saver/FileSaver.js" );
const Json2csvParser = require( "json2csv" ).Parser;

@Injectable()
export class Utils {
  //methods which might be useful for other components as well

  static PARTIAL_DATE_STRING: string = "yyyy-MM";
  static DATE_STRING: string = "yyyy-MM-dd";
  static DATE_STRING_CVS: string = "MMddyy";
  static DATE_STRING_IN_CVS: string = "MM/dd/yyyy";
  static DATE_STRING_IN_EVENT_CVS: string = "MMM dd, yyyy, hh:mm:ss a";
  static DATE_PARTIAL: string = "partial date";
  static COMMA: string = ",";
  static EMPTY_STRING_CSV: string = "\"\"";
  static DATA: string = "data";
  static PROFILE: string = "profile";

  YES: string = "Yes";
  NO: string = "No";

  public getDateFormatted( str ): string {
    return Utils.getDateFormatted( this.getNiceUserDate( str ), Utils.DATE_STRING_IN_CVS );
  }

  public getYesNo( value: any ): string {
    if (value != null) {
      if (value === 1 || value === "1" || value === "true" || value) {
        return this.YES;
      }
      else {
        return this.NO;
      }
    }
    return "-";
  }

  //get date of string
  public getNiceUserDate( dateString: string ): Date {
    if (dateString != null && typeof dateString === "string" && dateString.indexOf( "-" ) > 0) {
      let dateParts: string[] = dateString.split( "-" );
      if (dateParts.length == 3) {
        let check: Date = null;
        if (dateParts[ 0 ].length == 4) {
          check = new Date( Number( dateParts[ 0 ] ), Number( dateParts[ 1 ] ) - 1, Number( dateParts[ 2 ] ) );
        }
        else if (dateParts[ 2 ].length == 4) {
          check = new Date( Number( dateParts[ 2 ] ), Number( dateParts[ 0 ] ) - 1, Number( dateParts[ 1 ] ) );
        }
        if (check != null && !isNaN( check.getTime() )) {
          return check;
        }
      }
      else if (dateParts.length == 2) {
        let check: Date = new Date( Number( dateParts[ 0 ] ), Number( dateParts[ 1 ] ) - 1 );
        if (!isNaN( check.getTime() )) {
          return check;
        }
      }
    }
    else {
      let check: Date = new Date( Number( dateString ) );
      if (!isNaN( check.getTime() )) {
        return check;
      }
    }
    return null;
  }

  public getNiceUserText( text: string ) {
    if (text != null && text.indexOf( "-null" ) > -1) {
      return text.replace( "-null", "" ).replace( "-null", "" );
    }
    return text;
  }

  public getNameValue( nameValues: Array<NameValue>, text: string ) {
    let nameValue = nameValues.find( x => x.name === text );
    if (nameValue != null) {
      return nameValue.value;
    }
    return "";
  }

  isGroupSelected( selected: Array<string>, group: Group ): string {
    return selected.find( answer => {
      if (group.groupStableId === answer) {
        return true;
      }
      return false;
    } );
  }

  getAnswerText( groupAnswer: string, options: Array<Option> ): Option {
    return options.find( option => {
      if (option.optionStableId === groupAnswer) {
        return true;
      }
      return false;
    } );
  }

  static getAnswerGroupOrOptionText( answer: any, qdef: QuestionDefinition ): string {
    if (answer instanceof Array) {
      answer = answer[ 0 ];
    }
    let text = answer;
    let ans;
    if (qdef.groups) {
      loop1: for (let group of qdef.groups) {
        if (group.groupStableId === answer) {
          ans = group.groupText;
          break loop1;
        }
        for (let g of group.options) {
          if (g.optionStableId === answer) {
            ans = g.optionText;
            break loop1;
          }
        }
      }
      if (ans) {
        text = ans;
      }
    }
    if (!ans && qdef.options) {
      let ans = qdef.options.find( option => {
        if (option.optionStableId === answer) {
          return true;
        }
        return false;
      } );
      if (ans) {
        text = ans.optionText;
      }
    }
    return text;
  }

  static getNestedOptionText( answer: any, qdef: QuestionDefinition, nestedOption ): string {
    if (answer instanceof Array) {
      answer = answer[ 0 ];
    }
    let text = answer;
    let ans;
    if (qdef.options) {
      let option = qdef.options.find( option => {
        if (option.optionStableId === answer) {
          return true;
        }
        return false;
      } );
      if (option) {
        let ne = option.nestedOptions.find( o => {
          if (o.optionStableId === nestedOption) {
            return true;
          }
          return false;
        } );
        ans = ne.optionText;
      }
    }
    if (ans) {
      return ans;
    }
    return text;
  }

  isOptionSelected( selected: Array<string>, optionStableId: string ) {
    return selected.find( x => x === optionStableId );
  }

  getOptionOrGroupText( questionDefinition: QuestionDefinition, stableId: string ): string {
    if (questionDefinition.options) {
      let option = questionDefinition.options.find( x => x.optionStableId === stableId );
      if (option != null) {
        return option.optionText;
      }
    }
    if (questionDefinition.groups) {
      let text = "";
      questionDefinition.groups.find( g => {
        if (g.options) {
          let option = g.options.find( o => o.optionStableId === stableId );
          if (option) {
            text = option.optionText;
            return true;
          }
        }
        return false;
      } );
      return text;
    }
    return "";
  }

  static getOptionDetails( optionDetails: Array<OptionDetail>, stableId: string ) {
    return optionDetails.find( x => x.option === stableId );
  }

  static getQuestionDefinition( activities: Array<ActivityDefinition>, activity: string, stableId: string, version: string ) {
    let questions = activities.find( x => x.activityCode === activity && x.activityVersion === version );
    if (questions && questions.questions) {
      return questions.questions.find( x => x.stableId === stableId );
    }
    return null;
  }

  getAbstractionGroup( groups: Array<AbstractionGroup>, groupId: string ) {
    return groups.find( x => x.abstractionGroupId.toString() === groupId );
  }

  getAbstractionField( fields: Array<AbstractionField>, fieldId: string ) {
    return fields.find( x => x.medicalRecordAbstractionFieldId.toString() === fieldId );
  }

  public static getFormattedDate( date: Date ): string {
    return Utils.getDateFormatted( date, Utils.DATE_STRING );
  }

  public static getDateFormatted( date: Date, format: string ): string {
    if (date instanceof Date && !isNaN( date.getTime() )) {
      if (format != null) {
        return new DatePipe( "en-US" ).transform( date, format );
      }
      return new DatePipe( "en-US" ).transform( date, Utils.DATE_STRING_IN_CVS );
    }
    if (date != null) {
      return date.toString();
    }
    return "";
  }

  public maxDate(): Date {
    return new Date();
  }

  //used to get db saved date string (yyyy-MM-dd) as date
  public static getDate( dateString: string ): Date {
    if (dateString.indexOf( "-" ) > 0) {
      var dateParts: string[] = dateString.split( "-" );
      if (dateParts.length == 3) {
        return new Date( Number( dateParts[ 0 ] ), Number( dateParts[ 1 ] ) - 1, Number( dateParts[ 2 ] ) );
      }
    }
    return null;
  }

  //used to change db saved date (yyyy-MM) to user format
  public static getPartialFormatDate( dateString: string, format: string ) {
    if (Utils.DATE_STRING === format) {
      return dateString;
    }
    else if (Utils.DATE_STRING_IN_CVS === format) {
      if (dateString.indexOf( "/" ) > -1) {
        return dateString;
      }
      else {
        var dateParts: string[] = dateString.split( "-" );
        return dateParts[ 1 ] + "/" + dateParts[ 0 ];
      }
    }
  }

  public static downloadCurrentData( data: any[], paths: any[], columns: {}, fileName: string, isSurveyData ?: boolean, activityDefinitionList? ) {
    let headers = "";
    for (let path of paths) {
      for (let i = 1; i < path.length; i += 2) {
        let source = path[ i ];
        if (columns[ source ] != null) {
          for (let name of columns[ source ]) {
            let headerColumnName = name.participantColumn.display;
            if (isSurveyData) {
              headerColumnName = name.participantColumn.name;
            }
            headers += headerColumnName + ",";
          }
        }
      }
    }
    let csv = this.makeCSV( data, paths, columns, activityDefinitionList );
    csv = headers + "\r\n" + csv;
    let blob = new Blob( [ csv ], {type: "text/csv;charset=utf-8;"} );
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob( blob, fileName );
    }
    else {
      let link = document.createElement( "a" );
      if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        let url = URL.createObjectURL( blob );
        link.setAttribute( "href", url );
        link.setAttribute( "download", fileName );
        link.style.visibility = "hidden";
        document.body.appendChild( link );
        link.click();
        document.body.removeChild( link );
      }
    }
  }

  private static makeCSV( data: any[], paths: any[], columns: {}, activityDefinitionList? ): string {
    let input = [];
    let result = [];
    for (let d of data) {
      let input = [];
      for (let path of paths) {
        let nonDefaultFieldsResultArray: string[] = null;
        let output = this.makeCSVForObjectArray( d, path, columns, 0, activityDefinitionList );
        let temp = [];

        for (let i = 0; i < output.length; i++) {
          if (input.length === output.length) {
            temp.push( input[ i ] + output[ i ] );
          }
          else {
            for (let j = 0; j < input.length; j++) {
              temp.push( input[ j ] + output[ i ] );
            }
          }
        }
        if (output.length > 1) {
          let resultOutputSplitted = Utils.fillEmptyValuesFromCorrespondingOutputArray( output );
          nonDefaultFieldsResultArray = Utils.mergeDefaultColumnsWithNonDefaultColumns( temp, resultOutputSplitted );
        }

        // for (let o of output) {
        //   for (let i of input) {
        //     temp.push( i + o );
        //   }
        // }
        if (nonDefaultFieldsResultArray) {
          temp = nonDefaultFieldsResultArray;
        }
        else if (input.length == 0) {
          temp = output;
        }
        input = temp;
      }
      result = result.concat( input );
    }
    let mainStr = result.join( "\r\n" );
    return mainStr;
  }

  private static fillEmptyValuesFromCorrespondingOutputArray( output: string[] ) {
    let resultOutputSplitted = output[ 0 ].split( this.COMMA );
    output.slice( 1, output.length ).forEach( outputArray => {
      let tempOutputArray = outputArray.split( this.COMMA );
      for (let j = 0; j < tempOutputArray.length; j++) {
        if (resultOutputSplitted[ j ] === this.EMPTY_STRING_CSV) {
          resultOutputSplitted[ j ] = tempOutputArray[ j ];
        }
      }
    } );
    return resultOutputSplitted;
  }

  private static mergeDefaultColumnsWithNonDefaultColumns( temp: any[], resultOutputSplitted: string[] ) {
    let tempSplitted: string[] = temp[ 0 ].split( this.COMMA );
    let defaultFields: string[] = tempSplitted.slice( 0, tempSplitted.length - resultOutputSplitted.length );
    return [ defaultFields.concat( resultOutputSplitted ).join( this.COMMA ) ];
  }


  public static makeCSVForObjectArray( data: Object, paths: any[], columns: {}, index: number, activityDefinitionList? ): string[] {
    let result: string[] = [];
    if (index > paths.length - 1) {
      return null;
    }
    else {
      let objects = null;
      if (Utils.isColumnNestedInParticipantData( data, paths, index )) {
        objects = [ data[ Utils.DATA ] [ paths[ index ] ] ];
      }
      else if (!( data[ paths[ index ] ] instanceof Array )) {
        objects = [ data[ paths[ index ] ] ];
      }
      else {
        objects = data[ paths[ index ] ];
      }
      if (objects != null) {
        for (let o of objects) {
          let oString = this.makeCSVString( o, columns[ paths[ index + 1 ] ], data, activityDefinitionList );
          let a = this.makeCSVForObjectArray( o, paths, columns, index + 2, activityDefinitionList );
          if (a != null && a.length > 0) {
            for (let t of a) {
              result.push( oString + t );
            }
          }
          else {
            result.push( oString );
          }
        }
        if (objects.length == 0) {
          let oString = this.makeCSVString( null, columns[ paths[ index + 1 ] ] );
          result.push( oString );
        }
      }
      return result;
    }
  }

  private static isColumnNestedInParticipantData( data: Object, paths: any[], index: number ): boolean {
    return Utils.participantDataExists( data, paths, index ) && data[ Utils.DATA ][ paths[ index ] ];
  }

  private static participantDataExists( data: Object, path: any[], index: number ): boolean {
    return data && data[ Utils.DATA ];
  }

  private static isColumnNestedInProfileData( data: Object, columnName: string ) {
    return this.profileDataExists( data ) && data[ Utils.PROFILE ][ columnName ];
  }

  private static profileDataExists( data: Object ): boolean {
    return data && data[ Utils.PROFILE ];
  }

  private static getObjectAdditionalValue( o: Object, fieldName: string, column: any ) {
    if (o[ fieldName ] != null) {
      return o[ fieldName ][ column.participantColumn.name ];
    }
    return "";
  }

  private static makeCSVString( o: Object, columns: any[], data?: any, activityDefinitionList? ): string {
    let str = "";
    let col: Filter;
    if (columns != null) {
      if (o != null) {
        for (col of columns) {
          if (col.type === "ADDITIONALVALUE") {
            let fieldName = "additionalValues";
            if (fieldName !== "") {
              let value = this.getObjectAdditionalValue( o, fieldName, col );
              value = value == undefined ? "" : value.toString();
              value.replace( "\\n", " " );
              str = str + "\"" + value + "\"" + ",";
            }
          }
          else if (col.participantColumn.object != null && col.participantColumn.object === "final" && o instanceof AbstractionGroup && col.participantColumn.tableAlias === o[ "abstractionGroupId" ].toString()) {
            if (o[ "fields" ] != null && o[ "fields" ] instanceof Array) {
              let abstractionField: AbstractionField = o[ "fields" ].find( field => {
                return field.medicalRecordAbstractionFieldId.toString() === col.participantColumn.name;
              } );
              if (abstractionField != null && abstractionField.fieldValue != null) {
                let value = abstractionField.fieldValue.value;
                value = value == undefined ? "" : value.toString();
                if (value !== "") {
                  let tmp = "";
                  let multiObject: Object[] = this.getMultiObjects( value );
                  multiObject.forEach( ( object ) => {
                    let keys: string[] = this.getMultiKeys( object );
                    keys.forEach( ( key ) => {
                      if (key === "other") {
                        object[ key ].forEach( ( oV ) => {
                          let otherKeys: string[] = this.getMultiKeys( oV );
                          otherKeys.forEach( ( otherKey ) => {
                            let tmp2 = oV[ otherKey ] == undefined ? "" : oV[ otherKey ];
                            tmp = tmp + "Other - " + otherKey + ": " + tmp2 + " ";
                          } );
                        } );
                      }
                      else {
                        if (this.isDateValue( object[ key ] )) {
                          let tmp2 = this.getDateValue( object[ key ] ) == undefined ? "" : this.getDateValue( object[ key ] );
                          tmp = tmp + key + ": " + tmp2 + " ";
                        }
                        else {
                          let tmp2 = object[ key ] == undefined ? "" : object[ key ];
                          tmp = tmp + key + ": " + tmp2 + " ";
                        }
                      }
                    } );
                  } );
                  if (tmp !== undefined && tmp !== null && tmp !== "") {
                    value = tmp.trim();
                    value.replace( "\\n", " " );
                  }
                }
                str = str + "\"" + value + "\"" + ","; //TODO make answer pretty
              }
            }
          }
          else {
            let value = null;
            if (Utils.isColumnNestedInProfileData( o, col.participantColumn.name )) {
              value = o[ Utils.PROFILE ][ col.participantColumn.name ];
            }
            else {
              value = o[ col.participantColumn.name ];
            }
            if (col.participantColumn.object != null && o[ col.participantColumn.object ] != null) {
              value = o[ col.participantColumn.object ][ col.participantColumn.name ];
            }
            else if (o[ 'data' ] && o[ 'data' ][ col.participantColumn.name ]) {
              value = o[ 'data' ][ col.participantColumn.name ];
            }
            if (col.type === Filter.DATE_TYPE) {
              if (!value) {
                value = "";
              }
              else {
                value = this.getDateFormatted( new Date( value ), Utils.DATE_STRING_IN_CVS );
              }
            }
            value = value == undefined ? "" : value.toString();
            value.replace( "\\n", " " );
            str = str + "\"" + value + "\"" + ",";
          }
        }
      }
      else {
        for (col of columns) {
          let value = "";
          if (data != null) {
            //check for survey data
            let activityDataArray: ActivityData[] = this.getSurveyData( data, col.participantColumn.tableAlias );
            if (activityDataArray != null) {
              if (activityDataArray.length == 1) {
                let activityData = activityDataArray[ 0 ];
                if (( col.participantColumn.name === "createdAt" || col.participantColumn.name === "completedAt"
                  || col.participantColumn.name === "lastUpdatedAt" ) && activityData[ col.participantColumn.name ] != null) {
                  value = this.getDateFormatted( new Date( activityData[ col.participantColumn.name ] ), this.DATE_STRING_IN_CVS );
                }
                else if (col.participantColumn.name === "status" && activityData[ col.participantColumn.name ] != null) {
                  value = activityData[ col.participantColumn.name ];
                }
                else {
                  let questionAnswer = this.getQuestionAnswerByName( activityData.questionsAnswers, col.participantColumn.name );
                  value  +=  this.getTextForQuestionAnswer(questionAnswer, col, activityDefinitionList, activityData);
                }
              }
              else {
                value = this.getActivityValueForMultipleActivities( activityDataArray, col.participantColumn.name, activityDefinitionList, col );
              }
            }
            else if (col.participantColumn.tableAlias === "invitations") {
              if (data != null && data.data != null && data.data.invitations != null) {
                let tmp: string = "";
                data.data.invitations.forEach( ( invite ) => {
                  if (col.type === Filter.DATE_TYPE) {
                    tmp = tmp + " " + invite[ col.participantColumn.name ] == undefined ? "" : this.getDateFormatted( new Date( invite[ col.participantColumn.name ] ), this.DATE_STRING_IN_CVS );
                  }
                  else if (col.participantColumn.name === "guid") {
                    tmp = tmp + " " + invite[ col.participantColumn.name ] == undefined ? "" : invite[ col.participantColumn.name ].match( /.{1,4}/g ).join( "-" );
                  }
                  else {
                    tmp = tmp + " " + invite[ col.participantColumn.name ] == undefined ? "" : invite[ col.participantColumn.name ];
                  }
                } );
                if (tmp !== undefined && tmp !== null && tmp !== "") {
                  value = tmp.trim();
                  value.replace( "\\n", " " );
                }
              }
            }
          }
          str = str + "\"" + value + "\"" + ",";
        }
      }
    }
    return str;
  }

  public static getSurveyData( participant: Participant, code: string ) {
    let array = [];
    if (participant != null && participant.data != null && participant.data.activities != null) {
      for (let x of participant.data.activities) {
        if (x.activityCode === code) {
          array.push( x );
        }
      }
      return array;
    }
    return null;
  }

  public static getQuestionAnswerByName( questionsAnswers: Array<QuestionAnswer>, name: string ): QuestionAnswer {
    return questionsAnswers.find( x => x.stableId === name );
  }

  public static getMultiObjects( fieldValue: string | string[] ) {
    if (!( fieldValue instanceof Array )) {
      let o: any = JSON.parse( fieldValue );
      return o;
    }
    return null;
  }

  public static getMultiKeys( o: any ) {
    if (o != null) {
      return Object.keys( o );
    }
    return null;
  }

  public static isDateValue( value: string ): boolean {
    if (value != null && value != undefined && typeof value === "string" && value.indexOf( "dateString" ) > -1 && value.indexOf( "est" ) > -1) {
      return true;
    }
    return false;
  }


  public static getDateValue( value: string ) {
    if (value != null) {
      let o: any = JSON.parse( value );
      return o[ "dateString" ];
    }
    return "";
  }

  public static createCSV( fields: any[], dataArray: Array<any>, fileName: string ) {
    const json2csvParser = new Json2csvParser( {fields} );
    const csv = json2csvParser.parse( dataArray );
    Utils.fileSaverCreateCSV( fileName, csv );
  }

  public static fileSaverCreateCSV( fileName: string, csv: any ) {
    let data = new Blob( [ csv ], {type: "text/plain;charset=utf-8"} );
    fileSaver.saveAs( data, fileName );
  }

  phoneNumberValidator( control: FormControl ) {
    let validationError = {"invalidPhoneNumber": true};
    if (!control || !control.value) {
      return null;
    }
    if (control.value.match( /^\d{3}-\d{3}-\d{4}$/ )) {
      return null;
    }
    return validationError;
  }

  public static parseDate( dateString: string, format: string, allowUnknownDay: boolean ): string | Date {
    if (dateString != null && format != null) {
      var dateParts: string[] = null;
      if (Utils.DATE_STRING_IN_CVS === format) {
        dateParts = dateString.split( "/" );
        if (dateParts.length == 3) {
          return this.changePartialYearTo2000( dateParts[ 2 ], dateParts[ 0 ], dateParts[ 1 ] );
        }
        else if (allowUnknownDay && dateParts.length == 2) {
          if (dateParts[ 1 ].length == 4 && dateParts[ 0 ].length < 3) {
            if (Number( dateParts[ 0 ] ) > -1 && Number( dateParts[ 0 ] ) < 12) {
              return Utils.DATE_PARTIAL;
            }
          }
        }
        else if (allowUnknownDay && dateParts.length == 1) {
          if (dateParts[ 0 ].length == 4) {
            return Utils.DATE_PARTIAL;
          }
        }
      }
      else if (Utils.DATE_STRING === format) {
        dateParts = dateString.split( "-" );
        if (dateParts.length == 3) {
          return this.changePartialYearTo2000( dateParts[ 0 ], dateParts[ 1 ], dateParts[ 2 ] );
        }
        else if (allowUnknownDay && dateParts.length == 2) {
          if (dateParts[ 0 ].length == 4 && dateParts[ 1 ].length < 3) {
            if (Number( dateParts[ 1 ] ) > -1 && Number( dateParts[ 1 ] ) < 12) {
              return Utils.DATE_PARTIAL;
            }
          }
        }
        else if (allowUnknownDay && dateParts.length == 1) {
          if (dateParts[ 0 ].length == 4) {
            return Utils.DATE_PARTIAL;
          }
        }
      }
    }
    return null;
  }

  private static changePartialYearTo2000( year: string, month: string, day: string ): Date {
    if (year.length < 2) {
      return new Date( Number( "200" + year ), Number( month ) - 1, Number( day ) );
    }
    else if (year.length < 3) {
      return new Date( Number( "20" + year ), Number( month ) - 1, Number( day ) );
    }
    else if (year.length < 4) {
      return new Date( Number( "2" + year ), Number( month ) - 1, Number( day ) );
    }
    else {
      return new Date( Number( year ), Number( month ) - 1, Number( day ) );
    }
  }

  public static getPartialDateFormatted( dateString: string, format: string ): string {
    if (format != null) {
      var dateParts: string[] = null;
      if (Utils.DATE_STRING_IN_CVS === format) {
        dateParts = dateString.split( "/" );
        if (dateParts.length == 2) {
          if (dateParts[ 1 ].length == 4 && dateParts[ 0 ].length < 3) {
            if (Number( dateParts[ 0 ] ) > -1 && Number( dateParts[ 0 ] ) < 12) {
              return dateParts[ 1 ] + "-" + dateParts[ 0 ];
            }
          }
        }
        else if (dateParts.length == 1) {
          if (dateParts[ 0 ].length == 4) {
            return dateParts[ 0 ];
          }
        }
      }
      else if (Utils.DATE_STRING === format) {
        dateParts = dateString.split( "-" );
        if (dateParts.length == 2) {
          if (dateParts[ 0 ].length == 4 && dateParts[ 1 ].length < 3) {
            if (Number( dateParts[ 1 ] ) > -1 && Number( dateParts[ 1 ] ) < 12) {
              return dateString;
            }
          }
        }
        else if (dateParts.length == 1) {
          if (dateParts[ 0 ].length == 4) {
            return dateParts[ 0 ];
          }
        }
      }
    }
    return null;
  }

  public static getActivityDataValues( fieldSetting: FieldSettings, participant: Participant, activityDefinitions: ActivityDefinition[] ) {
    if (fieldSetting != null && fieldSetting.possibleValues != null && fieldSetting.possibleValues[ 0 ] != null && fieldSetting.possibleValues[ 0 ].value != null) {
      let tmp: string[] = fieldSetting.possibleValues[ 0 ].value.split( '.' );
      if (tmp != null && tmp.length > 1) {
        if (tmp[ 0 ] === 'profile') {
          return participant.data.profile[ tmp[ 1 ] ];
        }
        else {
          if (participant != null && participant.data != null && participant.data.activities != null) {
            let activity: ActivityData = participant.data.activities.find( activity => activity.activityCode === tmp[ 0 ] );
            if (activity != null && activity.questionsAnswers != null) {
              let questionAnswer = activity.questionsAnswers.find( questionAnswer => questionAnswer.stableId === tmp[ 1 ] );
              if (questionAnswer != null) {
                if (tmp.length == 2) {
                  if (typeof questionAnswer.answer === "boolean") {
                    if (questionAnswer.answer) {
                      return "Yes";
                    }
                    return "No";
                  }
                  if (questionAnswer.answer instanceof Array) {
                    return questionAnswer.answer[ 0 ];
                  }
                  return questionAnswer.answer;
                }
                else if (tmp.length === 3) {
                  if (fieldSetting.possibleValues != null && fieldSetting.possibleValues[ 0 ] != null && fieldSetting.possibleValues[ 0 ].type != null && fieldSetting.possibleValues[ 0 ].type === "RADIO") {
                    if (questionAnswer.answer != null) {
                      let found = questionAnswer.answer.find( answer => answer === tmp[ 2 ] );
                      if (found != null) {
                        return "Yes";
                      }
                      return "No";
                    }
                  }
                  else if (activityDefinitions != null) {
                    let definition: ActivityDefinition = activityDefinitions.find( definition => definition.activityCode === tmp[ 0 ] );
                    if (definition != null && definition.questions != null) {
                      let question = definition.questions.find( question => question.stableId === tmp[ 1 ] );
                      if (question != null && question.childQuestions != null) {
                        for (let i = 0; i < question.childQuestions.length; i++) {
                          if (question.childQuestions[ i ] != null && question.childQuestions[ i ].stableId === tmp[ 2 ] && questionAnswer.answer[ 0 ][ i ] != null) {
                            return questionAnswer.answer[ 0 ][ i ];
                          }
                        }
                      }
                      else if (question != null && question.options != null) {

                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return "";
  }

  private static getTextForQuestionAnswer(questionAnswer: QuestionAnswer, col, activityDefinitionList, activityData){
    let value = "";
    if (questionAnswer != null) {
      let qDef: QuestionDefinition = Utils.getQuestionDefinition( activityDefinitionList, col.participantColumn.tableAlias, questionAnswer.stableId, activityData.activityVersion );
      if (col.type === Filter.DATE_TYPE) {
        value += questionAnswer.date + ", ";
      }
      else if (col.type === Filter.COMPOSITE_TYPE) {
        let answers = Utils.getNiceTextForCSVCompositeType( questionAnswer, qDef );
        answers.forEach( ans => value += ( ans + ", " ) + '\n' );
      }
      else {
        let answers = Utils.getCorrectTextAsAnswerForCSV( questionAnswer, qDef );
        answers.forEach( ans => value += ans + '\n' );
      }
    }
    return value;
  }

  private static getActivityValueForMultipleActivities( activityDataArray: ActivityData[], name: string, activityDefinitionList: any,  col ) {
    let value = "";
    for (let activityData of activityDataArray) {
      for (let questionsAnswer of activityData.questionsAnswers) {
        if (questionsAnswer.stableId === name) {
          value  +=  this.getTextForQuestionAnswer(questionsAnswer, col, activityDefinitionList, activityData);
        }
      }
      value += '\n';
    }
    return value;
  }



  public static getCorrectTextAsAnswerForCSV( questionAnswer: QuestionAnswer, qDef: QuestionDefinition ): string[] {
    let answers = [];
    let probableAnswer = questionAnswer.answer;
    if (!(questionAnswer.answer instanceof Array)){
      probableAnswer = new Array();
      probableAnswer.push(questionAnswer.answer);
    }
    for (let answer of probableAnswer) {
      let text = answer;
      let activityAnswers = "";
      let ans = this.getAnswerGroupOrOptionText( answer, qDef );
      if (ans) {
        text = ans;
      }
      activityAnswers += text;
      if (answer instanceof Array) {
        answer = answer[ 0 ];
      }
      if (( questionAnswer.groupedOptions || questionAnswer.nestedOptions ) && ( questionAnswer.groupedOptions[ answer ] || questionAnswer.nestedOptions[ answer ] )) {
        activityAnswers += "(";
        let ans = questionAnswer.groupedOptions[ answer ];
        if (ans) {
          for (let a of ans) {
            activityAnswers += this.getAnswerGroupOrOptionText( a, qDef ) + ",";
          }
        }

        if (questionAnswer.nestedOptions[ answer ]) {
          for (let nestedOption of questionAnswer.nestedOptions[ answer ]) {
            let nestedOptionText = this.getNestedOptionText( answer, qDef, nestedOption );
            if (nestedOptionText && nestedOptionText.length > 0) {
              activityAnswers += nestedOptionText + ",";
            }
          }
        }
        activityAnswers += "),";
      }
      if (questionAnswer.optionDetails) {
        let freeText = this.getOptionDetails( questionAnswer.optionDetails, answer );
        if (freeText) {
          activityAnswers += "(";
          activityAnswers += freeText.details;
          activityAnswers += "),";
        }
      }
      if (activityAnswers.lastIndexOf( ',' ) === activityAnswers.length - 1) {
        activityAnswers = activityAnswers.substr( 0, activityAnswers.length - 1 );
      }
      answers.push( activityAnswers );
    }
    return answers;
  }

  getCorrectTextAsAnswer( questionAnswer: QuestionAnswer ) {
    let answers = [];
    for (let answer of questionAnswer.answer) {
      answers.push( answer );
    }
    return answers;
  }

  public static getNiceTextForCSVCompositeType( questionAnswer: QuestionAnswer, qdef: QuestionDefinition ): string[] {
    let answers = [];
    for (let answer of questionAnswer.answer) {
      if (answer instanceof Array) {
        answer = answer[ 0 ];
      }
      let text = answer;
      let ans;
      if (qdef.childQuestions) {
        loop1: for (let childq of qdef.childQuestions) {
          if (childq.groups) {
            for (let g of childq.groups) {
              for (let option of g.options) {
                if (option.optionStableId === answer) {
                  ans = option.optionText;
                  break loop1;
                }
              }
            }
          }
          if (!ans && childq.options) {
            for (let g of childq.options) {
              if (g.optionStableId === answer) {
                ans = g.optionText;
                break loop1;
              }
            }
          }
        }
        if (ans) {
          text = ans;
        }
      }
      answers.push( text );
    }

    return answers;
  }

  getGroupedOptionsForAnswer( activityData: ActivityData, name: any, questionAnswer: any ) {
    let answers: Array<string> = new Array();
    for (let y of activityData.questionsAnswers) {
      if (y.stableId === name) {
        for (let answer of y.answer) {
          if (answer === questionAnswer) {
            if (y.groupedOptions) {
              let ans = y.groupedOptions[ answer ];
              if (ans) {
                for (let a of ans) {
                  answers.push( a );
                }
              }
            }
          }
        }
      }
    }
    return answers.reverse();
  }

}
