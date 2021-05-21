import { Component, Input, OnInit } from '@angular/core';
import { ComponentService } from '../../../services/component.service';
import { DSMService } from '../../../services/dsm.service';

@Component({
  selector: 'app-heatmapgraph',
  templateUrl: './heatmapgraph.component.html',
  styleUrls: ['./heatmapgraph.component.css']
})
export class HeatmapgraphComponent implements OnInit {

  static HEATMAP_ROWS_LENGTH = 25;


  @Input() heatmapGraph: any;


  //date range filter
  dateFrom: String;
  dateTo: String;

  //fusion charts
  title: String;
  dataSource: Object;
  dataSet = [];
  rowsDictionary = {};
  rows = [];
  columns = {};
  colorRange = {};
  dataLoaded: boolean;
  defaultRowLength = HeatmapgraphComponent.HEATMAP_ROWS_LENGTH;
  numberOfParticipants: number;

  constructor(private dsmService: DSMService) { }

  ngOnInit() {
    this.dsmService.getNumberOfParticipants(localStorage.getItem( ComponentService.MENU_SELECTED_REALM )).subscribe(
      data => {
        this.numberOfParticipants = data;
      },
      err => {

      }
    );
    this.dataSet.push({"data": this.heatmapGraph.data})
    this.rows = this.heatmapGraph.rows;
    this.rowsDictionary["row"] = this.rows.slice(0, this.defaultRowLength);
    this.columns["column"] = this.heatmapGraph.columns;
    this.colorRange["colorrange"] = this.heatmapGraph.colorRange;
    this.updateGraph();  
    debugger;
  }

  private fetchStatistic(from: number, to: number, dashboardSettingId: number) {
    this.dsmService.getStatistics(localStorage.getItem(ComponentService.MENU_SELECTED_REALM), from, to, dashboardSettingId).subscribe(
      data => {
        if (data != undefined && data != null) {
          if (data.find(st => st.displayType === "GRAPH_HEATMAP")) {
            let heatmapGraphData = data.find(st => st.displayType === "GRAPH_HEATMAP");
            this.dataSet.push({ "data": heatmapGraphData.data });
            this.rows = heatmapGraphData.rows;
            this.rowsDictionary["row"] = this.rows.slice(0, this.defaultRowLength);
            this.columns["column"] = heatmapGraphData.columns;
            this.colorRange["colorrange"] = heatmapGraphData.colorRange;
            this.dataLoaded = true;
            this.title = heatmapGraphData.displayText;
            this.updateGraph();
          }
        }
      }
    );
  }

  private updateGraph() {
    this.dataSource = {
      "chart": {
        "theme": "fusion",
        "caption": "",
        "subcaption": "",
        "xAxisName": "Kits",
        "yAxisName": "Participants",
        "showPlotBorder": "1",
        "showValues": "1",
        "mapByCategory": "1"
      },
      "rows": this.rowsDictionary,
      "columns": this.columns,
      "dataset": this.dataSet,
      "colorrange": this.colorRange["colorrange"]
    };
  }

  nextRow(): void {
    let previousRowLength = this.defaultRowLength;
    if (this.numberOfParticipants - previousRowLength == 0) return;
    if (((this.numberOfParticipants - previousRowLength) / 25) >= 1) {
      this.defaultRowLength += 25;
    } else {
      this.defaultRowLength += this.numberOfParticipants - previousRowLength;
    }
    this.fetchStatistic(previousRowLength, this.defaultRowLength, 0);
  }

  previousRow(): void {
    let currentRowLength = this.defaultRowLength;
    let from = currentRowLength - 50;
    let to = currentRowLength - 25;
    if (from < 0) return;
    if ((this.defaultRowLength % 25) != 0) {
      this.defaultRowLength -= this.defaultRowLength % 25;
      from = this.defaultRowLength - ((this.defaultRowLength % 25) + 25);
      to = this.defaultRowLength - (this.defaultRowLength % 25);
    } else {
      this.defaultRowLength -= 25;
    }
    this.fetchStatistic(from, to, 0);
  }


  clickRow(event: any) {
    let row = this.rows.find(row => row.id === event.eventObj.data.text);
    if (row !== undefined) {
      let participantGuid = row.guid;
      this.dsmService.getParticipantData(localStorage.getItem(ComponentService.MENU_SELECTED_REALM), participantGuid, "").subscribe(
        data => {
          this.dataSource = {};
          console.log(data);
        }, 
        err => {
          
        }
      );
    }
  }

  dateFromHandler(date: String) {
    this.dateFrom = date;
  }

  dateToHandler(date: String) {
    this.dateTo = date;
  }

  filterByDate() {
    this.fetchStatistic(0, HeatmapgraphComponent.HEATMAP_ROWS_LENGTH, 1);
  }

}
