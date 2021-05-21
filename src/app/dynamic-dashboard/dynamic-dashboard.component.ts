import { Component, OnInit } from '@angular/core';
import { ComponentService } from '../services/component.service';
import { DSMService } from '../services/dsm.service';

@Component({
  selector: 'app-dynamic-dashboard',
  templateUrl: './dynamic-dashboard.component.html',
  styleUrls: ['./dynamic-dashboard.component.css']
})
export class DynamicDashboardComponent implements OnInit {

  static HEATMAP_ROWS_LENGTH = 25;

  enrolledParticipants: number;
  registeredParticipants: number;
  statistics: Array<any>;

  constructor(private dsmService: DSMService) {
    
  }

  ngOnInit() {
    this.fetchStatistic(0, DynamicDashboardComponent.HEATMAP_ROWS_LENGTH, 0);
  }

  private fetchStatistic(from: number, to: number, dashboardSettingId: number) {
    this.dsmService.getStatistics(localStorage.getItem(ComponentService.MENU_SELECTED_REALM), from, to, dashboardSettingId).subscribe(
      data => {
        if (data != undefined && data != null) {
          this.statistics = data;
        }
      }
    );
  }
}
