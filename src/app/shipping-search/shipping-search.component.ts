import { Component, OnInit } from '@angular/core';
import {ScanError} from "../scan/error.model";
import {ScanValue} from "../scan/scan.model";
import { Auth } from "../services/auth.service";
import { Statics } from "../utils/statics";
import { DSMService } from "../services/dsm.service";
import { KitRequest } from "../shipping/shipping.model";
import { RoleService } from "../services/role.service";

@Component({
  selector: 'app-shipping-search',
  templateUrl: './shipping-search.component.html',
  styleUrls: ['./shipping-search.component.css']
})
export class ShippingSearchComponent implements OnInit {

  errorMessage: string;
  additionalMessage: string;
  searchValue: string = null;
  searchField: string = null;
  searching: boolean = false;
  allowedRealms: string[] = [];
  kit: KitRequest[] = [];

  constructor(private dsmService: DSMService, private auth: Auth, private role: RoleService) {
    if (!auth.authenticated()) {
      auth.logout();
    }
  }

  ngOnInit() {
    this.checkRight();
  }

  private checkRight() {
    this.allowedRealms = [];
    let jsonData: any[];
    this.dsmService.getRealmsAllowed(Statics.SHIPPING).subscribe(
      data => {
        jsonData = data;
        jsonData.forEach((val) => {
          this.allowedRealms.push(val);
        });
      },
      err => {
        return null;
      }
    );
  }

  searchKit() {
    if (this.allowedRealms != null && this.allowedRealms.length > 0) {
      this.searching = true;
      this.kit = [];
      this.errorMessage = null;
      this.additionalMessage = null;
      let jsonData: any[];
      this.dsmService.getKit(this.searchField, this.searchValue, this.allowedRealms).subscribe(
        data => {
          // console.log(`received: ${JSON.stringify(data, null, 2)}`);
          jsonData = data;
          jsonData.forEach((val) => {
            this.kit.push(KitRequest.parse(val));
          });
          if (this.kit == null || this.kit.length < 1) {
            this.additionalMessage = "Kit was not found.";
          }
          console.log(this.kit);
          this.searching = false;
          // console.log(this.ddp);
        },
        err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.auth.logout();
          }
          this.errorMessage = "Error - Loading ddp information\nPlease contact your DSM developer";
          this.searching = false;
        }
      );
    }
    else {
      this.additionalMessage = "You are not allowed to see kit information";
    }
  }

  getRole(): RoleService {
    return this.role;
  }

  showColumn( name: string ): boolean {
    if (this.kit != null) {
      let foundColumn = this.kit.find( kit => {
        return kit[ name ] != null && kit[ name ] !== "" && kit[ name ] != 0;
      } );
      if (foundColumn != null) {
        return true;
      }
    }
    return false;
  }

  receiveATKit(kitRequest: KitRequest) {
    let singleScanValues: Array<ScanValue> = [];
    singleScanValues.push(new ScanValue(kitRequest.kitLabel));
    this.dsmService.setKitReceivedRequest(JSON.stringify(singleScanValues)).subscribe(// need to subscribe, otherwise it will not send!
      data => {
        // kitRequest.receiveDateString =
      },
      err => {
      }
    );

  }
}
