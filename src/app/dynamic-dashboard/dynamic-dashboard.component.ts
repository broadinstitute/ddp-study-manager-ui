import { Component, OnInit } from '@angular/core';
import { ComponentService } from '../services/component.service';
import { DSMService } from '../services/dsm.service';

@Component({
  selector: 'app-dynamic-dashboard',
  templateUrl: './dynamic-dashboard.component.html',
  styleUrls: ['./dynamic-dashboard.component.css']
})
export class DynamicDashboardComponent implements OnInit {

  enrolledParticipants: number;
  registeredParticipants: number;

  constructor(private dsmService: DSMService) { }

  ngOnInit() {
    this.dsmService.getStatistics(localStorage.getItem( ComponentService.MENU_SELECTED_REALM )).subscribe(
      data => {

      },
      err => {

      }
    )
  }

  calculatePercentage(num: number) {
    let totalParticipants = this.enrolledParticipants + this.registeredParticipants;
    return ((num / totalParticipants) * 100).toFixed(2);
  }

}
