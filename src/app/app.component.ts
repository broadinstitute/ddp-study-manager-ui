
import {Component, OnInit} from "@angular/core";
import {DomSanitizer} from "@angular/platform-browser";
import {ActivatedRoute, Router} from "@angular/router";
import {filter} from 'rxjs/operators';

import {Auth} from "./services/auth.service";
import {RoleService} from "./services/role.service";
import {ComponentService} from "./services/component.service";

@Component( {
  selector: "app-root",
  templateUrl: "./app.component.html"
} )
export class AppComponent implements OnInit {
  private realmFromUrl: string;

  constructor( private router: Router, private auth: Auth, private sanitizer: DomSanitizer, private role: RoleService
    , private route: ActivatedRoute ) {
  }

  ngOnInit() {
    window.scrollTo( 0, 0 );
    this.route.queryParams.pipe(
      filter(params => params.realm)
    )
      .subscribe(params => {
        this.realmFromUrl = params.realm;
      });
  }

  doNothing() { //needed for the menu, otherwise page will refresh!
    return false;
  }

  selectRealmAndDoNothing( newValue ) {
    this.auth.selectRealm(newValue);
    this.doNothing();
  }

  isRealmChosen( realm ) {
    return this.realmFromUrl === realm;
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
      this.role.allowedToViewMailingList() || this.role.allowedToViewEELData() ||
      this.role.allowedToExitParticipant() || this.role.allowedToSkipParticipantEvents() ||
      this.role.allowedToDiscardSamples() || this.role.allowToViewSampleLists() ||
      this.role.allowedParticipantListView()) {
      return true;
    }
    return false;
  }
}
