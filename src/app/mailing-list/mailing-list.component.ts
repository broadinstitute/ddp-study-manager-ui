import {Component, OnInit} from "@angular/core";
import {DSMService} from "../services/dsm.service";
import {Auth} from "../services/auth.service";
import {MailingListContact} from "./mailing-list.model";
import {Utils} from "../utils/utils";
import {RoleService} from "../services/role.service";
import {ComponentService} from "../services/component.service";
import {ActivatedRoute} from "@angular/router";
import {Statics} from "../utils/statics";

@Component( {
  selector: "app-mailing-list",
  templateUrl: "./mailing-list.component.html",
  styleUrls: ["./mailing-list.component.css"]
} )
export class MailingListComponent implements OnInit {

  realm: string;
  contactList: Array<MailingListContact> = [];

  loadingContacts: boolean = false;

  errorMessage: string;
  additionalMessage: string;

  keys: string[] = [];
  sortDir: string = "";
  sortKey: string = "";

  constructor( private dsmService: DSMService, private auth: Auth, private role: RoleService, private compService: ComponentService,
               private route: ActivatedRoute ) {
    if (!auth.authenticated()) {
      auth.logout();
    }
    this.route.queryParams.subscribe( params => {
      // console.log(this.compService.realmMenu);
      this.realm = params[ DSMService.REALM ] || null;
      if (this.realm != null) {
        //        this.compService.realmMenu = this.realm;
        this.checkRight();
      }
    } );
  }

  private checkRight() {
    let allowedToSeeInformation = false;
    this.additionalMessage = null;
    this.contactList = [];
    let jsonData: any[];
    this.dsmService.getRealmsAllowed( Statics.MAILING_LIST ).subscribe(
      data => {
        jsonData = data;
        jsonData.forEach( ( val ) => {
          if (this.realm === val) {
            allowedToSeeInformation = true;
            this.getMailingList();
          }
        } );
        if (!allowedToSeeInformation) {
          this.additionalMessage = "You are not allowed to see information of the selected realm at that category";
        }
      },
      err => {
        return null;
      }
    );
  }

  ngOnInit() {
    // console.log(this.compService.realmMenu);
    if (localStorage.getItem( ComponentService.MENU_SELECTED_REALM ) != null) {
      this.realm = localStorage.getItem( ComponentService.MENU_SELECTED_REALM );
      this.checkRight();
    } else {
      this.additionalMessage = "Please select a realm";
    }
    window.scrollTo( 0, 0 );
  }

  public getMailingList(): void {
    if (this.realm != null) {
      this.loadingContacts = true;
      let jsonData: any[];
      this.additionalMessage = null;
      this.keys = [];
      this.dsmService.getMailingList( this.realm ).subscribe(
        data => {
          this.contactList = [];
          jsonData = data;
          jsonData.forEach( ( val ) => {
            let contact = MailingListContact.parse( val );
            this.getPossibleInfoColumns( contact );
            this.contactList.push( contact );
          } );
          // console.info(`${this.contactList.length} contacts received: ${JSON.stringify(data, null, 2)}`);
          this.loadingContacts = false;
        },
        err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.auth.logout();
          }
          this.errorMessage = "Error - Loading contacts  " + err;
          this.loadingContacts = false;
        }
      );
    }
  }

  public downloadMailingList(): void {
    let map: { firstName: string, lastName: string, email: string, info: string, dateCreated: string }[] = [];
    for (var i = 0; i < this.contactList.length; i++) {
      let dateCreated: string = "-";
      if (this.contactList[ i ].dateCreated != null && this.contactList[ i ].dateCreated !== 0) {
        dateCreated = Utils.getDateFormatted( new Date( this.contactList[ i ].dateCreated * 1000 ), Utils.DATE_STRING_IN_CVS );
      }
      map.push( {
        firstName: this.contactList[ i ].firstName,
        lastName: this.contactList[ i ].lastName,
        email: this.contactList[ i ].email,
        info: this.contactList[ i ].info,
        dateCreated: dateCreated
      } );
    }
    var fields = [];
    if (this.showColumn( "firstName" )) {
      fields.push( "firstName" );
    }
    if (this.showColumn( "lastName" )) {
      fields.push( "lastName" );
    }
    fields.push( "email" );
    if (this.showColumn( "info" )) {
      fields.push( "info" );
    }
    fields.push( "dateCreated" );
    var date = new Date();
    Utils.createCSV( fields, map, "MailingList " + this.realm + " " + Utils.getDateFormatted( date, Utils.DATE_STRING_CVS ) + Statics.CSV_FILE_EXTENSION );
  }

  hasRole(): RoleService {
    return this.role;
  }

  showColumn( name: string ): boolean {
    if (this.contactList != null) {
      let foundContact = this.contactList.find( contact => {
        return contact[ name ] != null && contact[ name ] !== "";
      } );
      if (foundContact != null) {
        return true;
      }
    }
    return false;
  }

  getPossibleInfoColumns( contact: MailingListContact ) {
    if (contact != null && contact.info != null) {
        let k: string[] = Object.keys( contact );
        k.forEach( key => {
          if (!this.keys.includes( key )) {
            this.keys.push( key );
          }
        } );
    }
  }

  sortByJson( key: string ) {
    if (this.sortKey !== key) {
      this.sortKey = "";
      this.sortDir = "";
    }
    this.sortKey = key;
    if (this.sortDir === "") {
      this.sortDir = "asc";
    } else if (this.sortDir === "asc") {
      this.sortDir = "desc";
    } else if (this.sortDir === "desc") {
      this.sortDir = "asc";
    }
    let order = this.sortDir === "asc" ? 1 : -1;
    this.contactList.sort( ( a, b ) => {
      if (JSON.parse( a.info )[ key ] == null) {
        return 1;
      } else if (JSON.parse( b.info )[ key ] == null) {
        return -1;
      } else {
        if (typeof JSON.parse( a.info )[ key ] === "string") {
          if (JSON.parse( a.info )[ key ].toLowerCase() < JSON.parse( b.info )[ key ].toLowerCase()) {
            return -1 * order;
          } else if (JSON.parse( a.info )[ key ].toLowerCase() > JSON.parse( b.info )[ key ].toLowerCase()) {
            return 1 * order;
          } else {
            return 0;
          }
        } else {
          if (JSON.parse( a.info )[ key ] < JSON.parse( b.info )[ key ]) {
            return -1 * order;
          } else if (JSON.parse( a.info )[ key ] > JSON.parse( b.info )[ key ]) {
            return 1 * order;
          } else {
            return 0;
          }
        }
      }
    } );
  }

  clearKeySort() {
    this.sortKey = "";
    this.sortDir = "";
  }

}
