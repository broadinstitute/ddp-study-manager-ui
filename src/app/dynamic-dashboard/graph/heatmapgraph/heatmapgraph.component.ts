import { Component, HostListener, Input, OnInit } from '@angular/core';
import { ComponentService } from '../../../services/component.service';
import { DSMService } from '../../../services/dsm.service';
import { HeatmaptooltipComponent } from '../../../tooltips/heatmaptooltip/heatmaptooltip.component';
import { HeatmaptooltipserviceService } from '../../../tooltips/heatmaptooltip/heatmaptooltipservice.service';
import { RoolOverTooltipdata, DataPlotTooltipData } from '../../../tooltips/heatmaptooltip/tooltipdata.model';

@Component({
  selector: 'app-heatmapgraph',
  templateUrl: './heatmapgraph.component.html',
  styleUrls: ['./heatmapgraph.component.css']
})
export class HeatmapgraphComponent implements OnInit {

  static HEATMAP_ROWS_LENGTH = 200;
  static HEATMAP_HEIGHT = 10000;
  static HEATMAP_CELL_HEIGHT = 22.5;


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
  dataLoaded: boolean = false;
  defaultRowLength = HeatmapgraphComponent.HEATMAP_ROWS_LENGTH;
  numberOfParticipants: number;
  // heatmapHeight = HeatmapgraphComponent.HEATMAP_ROWS_LENGTH * HeatmapgraphComponent.HEATMAP_CELL_HEIGHT;
  heatmapHeight = HeatmapgraphComponent.HEATMAP_HEIGHT;
  sortOrder = "ASC";
  events: any;

  //interval for fetching
  fetchInterval: any;
  isResponseReturned: boolean = true;

  constructor(private dsmService: DSMService, private tooltipService: HeatmaptooltipserviceService) { 
    this.events = {
      dataPlotClick: e => {
        this.dataPlotClick(e);
      },
      dataLabelClick: e => {
        this.clickRow(e);
      },
      dataLabelRollOver: e => {
        this.labelRollOver(e);
      },
      dataLabelRollOut: e => {
        this.labelRollOut(e);
      },
      dataplotRollOut: e => {
        this.dataplotRollOut(e);
      }
    }
  }
    
  ngOnInit() {
    this.setInitialValues();
    this.title = this.heatmapGraph.displayText;
    this.dataSet.push({"data": this.heatmapGraph.data})
    this.rows = this.heatmapGraph.rows;
    this.rowsDictionary["row"] = this.rows.slice(0, this.defaultRowLength);
    this.columns["column"] = this.heatmapGraph.columns;
    this.colorRange["colorrange"] = this.heatmapGraph.colorRange;
    this.updateGraph(); 
    this.fetchInterval = this.runInterval(); 
  }

  private fetchStatistic(from: number, to: number, dashboardSettingId: number) {
    this.dsmService.getStatistics(localStorage.getItem(ComponentService.MENU_SELECTED_REALM), from, to, dashboardSettingId, this.sortOrder).subscribe(
      data => {
        if (data != undefined && data != null) {
          if (data.find(st => st.displayType === "GRAPH_HEATMAP")) {
            let heatmapGraphData = data.find(st => st.displayType === "GRAPH_HEATMAP");
            this.dataSet.push({ "data": heatmapGraphData.data });
            this.rows = heatmapGraphData.rows;
            this.rowsDictionary["row"] = this.rows;
            this.columns["column"] = heatmapGraphData.columns;
            this.colorRange["colorrange"] = heatmapGraphData.colorRange;
            this.title = heatmapGraphData.displayText;
            this.updateGraph();
          }
        }
      }
    );
  }

  private updateData(from: number, to: number) {
    this.isResponseReturned = false;
    this.dsmService.getStatistics(localStorage.getItem(ComponentService.MENU_SELECTED_REALM), from, to, 0, this.sortOrder).subscribe(
      data => {
        if (data != undefined && data != null) {
          if (data.find(st => st.displayType === "GRAPH_HEATMAP")) {
            let heatmapGraphData = data.find(st => st.displayType === "GRAPH_HEATMAP");
            this.dataSet[0].data.push(...heatmapGraphData.data);
            this.rowsDictionary["row"].push(...heatmapGraphData.rows);
            this.dataLoaded = true;
            this.isResponseReturned = true;
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
        "showToolTip": "0",
        "mapByCategory": "1",
        "plottooltext": "<div id='nameDiv' style='font-size: 12px; border-bottom: 1px dashed #666666; font-weight:bold; padding-bottom: 3px; margin-bottom: 5px; display: inline-block; color: #888888;' >$rowLabel :</div>{br}Rating : <b>$dataValue</b>{br}$columnLabel : <b>$tlLabel</b>{br}<b>$trLabel</b>",
      },
      "rows": this.rowsDictionary,
      "columns": this.columns,
      "dataset": this.dataSet,
      "colorrange": this.colorRange["colorrange"]
    };
    this.dataLoaded = true;
  }


  clickRow(event: any) {
    // let row = this.rows.find(row => row.id === event.eventObj.data.text);
    // if (row !== undefined) {
    //   let participantGuid = row.guid;
    //   this.dsmService.getParticipantData(localStorage.getItem(ComponentService.MENU_SELECTED_REALM), participantGuid, "").subscribe(
    //     data => {
    //       this.dataSource = {};
    //       console.log(data);
    //     }, 
    //     err => {
          
    //     }
    //   );
    // }
  }

  sortAscending() {
    this.sortOrder = "ASC";
    this.dataLoaded = false;
    this.setInitialValues();
    this.fetchStatistic(0, HeatmapgraphComponent.HEATMAP_ROWS_LENGTH, 0);
    clearInterval(this.fetchInterval);
    this.fetchInterval = this.runInterval();
  }

  sortDescending() {
    this.dataLoaded = false;
    this.sortOrder = "DESC";
    this.setInitialValues();
    this.fetchStatistic(0, HeatmapgraphComponent.HEATMAP_ROWS_LENGTH, 0);
    clearInterval(this.fetchInterval);
    this.fetchInterval = this.runInterval();
  }

  private runInterval() {
    setInterval(() => {
      debugger;
      if (!this.isResponseReturned) {
        // clearInterval(this.fetchInterval);
        return this.fetchInterval;
      };
      let previousRowLength = this.defaultRowLength;
      if (this.numberOfParticipants - previousRowLength <= 0) {
        this.isResponseReturned = false;
        clearInterval(this.fetchInterval);
        return;
      }
      if (((this.numberOfParticipants - previousRowLength) / HeatmapgraphComponent.HEATMAP_ROWS_LENGTH) >= 1) {
        this.defaultRowLength += HeatmapgraphComponent.HEATMAP_ROWS_LENGTH;
      } else {
        this.defaultRowLength += this.numberOfParticipants - previousRowLength;
      }
      console.log(previousRowLength, this.defaultRowLength);
      if (this.isResponseReturned) this.updateData(previousRowLength, this.defaultRowLength);
    }, 500);
  }

  private setInitialValues() {
    this.dsmService.getNumberOfParticipants(localStorage.getItem( ComponentService.MENU_SELECTED_REALM )).subscribe(
      data => {
        this.numberOfParticipants = data;
        this.heatmapHeight = this.numberOfParticipants * HeatmapgraphComponent.HEATMAP_CELL_HEIGHT;
      },
      err => {
      }
      );
    this.isResponseReturned = true;
    this.defaultRowLength = HeatmapgraphComponent.HEATMAP_ROWS_LENGTH;
  }


  labelRollOver(event: any) {
    let row = this.rowsDictionary['row'].find(row => row.id === event.data.text);
    let firstName = row ? row.firstName : "";
    let lastName = row ? row.lastName : "";
    let guid = row ? row.guid : "";
    this.tooltipService.labelRollOver.emit(new RoolOverTooltipdata(firstName, lastName, guid));
  }

  labelRollOut(event: any) {
    this.tooltipService.labelRollOut.emit();
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

  dataPlotClick(event: any) {
    let kitRequestId = event.data.tlLabel;
    if (kitRequestId) {
      this.dsmService.getKitTrackingHistory(kitRequestId).subscribe(
        data => {
          this.tooltipService.dataPlotClick.emit(this.processKitTrackingData(data));
        },
        err => {

        }
      )      
    }
  }

  processKitTrackingData(data: any[]): DataPlotTooltipData[] {
    let dataPlotTooltipDatas = Array<DataPlotTooltipData>();
    data.forEach(d => {
      let location = d['location']['address'];
      let status = d['status'];
      let dataPlotTooltipData = new DataPlotTooltipData(
        d['date'],
        d['time'],
        location['city'],
        location['stateProvince'],
        location['postalCode'],
        status['type'],
        status['description'],
        status['code']
      );
      dataPlotTooltipDatas.push(dataPlotTooltipData);
    });
    return dataPlotTooltipDatas;
  }

  dataplotRollOut(event: any) {
    this.tooltipService.dataPlotRollOut.emit();
  }

}
