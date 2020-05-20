import {Component, OnInit, ViewChild} from "@angular/core";
import {MdMenuTrigger} from "@angular/material";
import {DomSanitizer} from "@angular/platform-browser";
import {Router} from "@angular/router";

import {Auth} from "./services/auth.service";
import {RoleService} from "./services/role.service";
import {ComponentService} from "./services/component.service";
import {Access} from "./utils/access.model";

@Component( {
  selector: "app-root",
  templateUrl: "./app.component.html"
} )
export class AppComponent implements OnInit {

  @ViewChild( MdMenuTrigger ) trigger: MdMenuTrigger;

  counter: number;

  constructor( private router: Router, private auth: Auth, private sanitizer: DomSanitizer, private role: RoleService ) {
  }

  ngOnInit() {
    window.scrollTo( 0, 0 );
    this.countPermissionExpiration();
  }

  doNothing() { //needed for the menu, otherwise page will refresh!
    return false;
  }

  doLogin() {
    localStorage.removeItem( ComponentService.MENU_SELECTED_REALM ); //if user logs in new or logs out, remove stored menu!
    if (this.auth.authenticated()) {
      this.auth.logout();
    }
    else {
      this.auth.lock.show();
    }
    return false;
  }

  hasRole(): RoleService {
    return this.role;
  }

  getAuth(): Auth {
    return this.auth;
  }

  shouldSeeRealmSelection(): boolean {
    if (this.role.allowedToHandleSamples() || this.role.allowedToViewMedicalRecords() ||
      this.role.allowedToViewMailingList() || this.role.allowedToExitParticipant() ||
      this.role.allowedToSkipParticipantEvents() || this.role.allowedToDiscardSamples() ||
      this.role.allowToViewSampleLists()) {
      return true;
    }
    return false;
  }

  private checkAccessExpiration() {
    let myDate = new Date();
    let obj: any = this.sessionService.getDSMClaims( this.sessionService.getDSMToken() );
    let access: Access;
    if (obj.USER_ACCESS_ROLE != null && obj.USER_ACCESS_ROLE !== "null") {
      access = Access.parse( JSON.parse( obj.USER_ACCESS_ROLE ) );
    }
    if (access != null) {
      console.log( access );
      console.log( access.exp * 1000 );
      console.log( myDate.getTime() );
      if (access.exp * 1000 <= myDate.getTime()) {
        this.refreshAccess().subscribe(
          data => {
            console.log( data );
            if (data != null) {
              return true;
            }
          }
        );
      }
    }
  }
}
