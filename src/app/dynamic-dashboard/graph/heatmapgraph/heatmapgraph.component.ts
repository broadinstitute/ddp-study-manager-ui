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

  static HEATMAP_ROWS_LENGTH = 1000;
  static HEATMAP_HEIGHT = 10000;
  static HEATMAP_CELL_HEIGHT = 22.5;


  @Input() heatmapGraph: any;


  //date range filter
  dateFrom: String;
  dateTo: String;

  //fusion charts
  title: String;
  dataSource: Object = {
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
    }
  };
  dataSet = [];
  rowsDictionary = {};
  rows = [];
  columns = {};
  colorRange = {};
  dataLoaded: boolean = false;
  numberOfParticipants: number;
  // heatmapHeight = HeatmapgraphComponent.HEATMAP_ROWS_LENGTH * HeatmapgraphComponent.HEATMAP_CELL_HEIGHT;
  heatmapHeight = HeatmapgraphComponent.HEATMAP_ROWS_LENGTH * HeatmapgraphComponent.HEATMAP_CELL_HEIGHT;
  sortOrder = "ASC";
  events: any;
  numberOfPages: number = 0;
  currentPage: number = 1;

  //interval for fetching
  fetchInterval: any;
  isResponseReturned: boolean = true;

  constructor(private dsmService: DSMService, private tooltipService: HeatmaptooltipserviceService) { 
    this.events = {
      dataPlotClick: e => {
        this.dataPlotClick(e);
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
    this.updateGraph(); 
    this.dataLoaded = true;
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
            this.dataLoaded = true;
          }
        }
      }
    );
  }

  nextPage(): void {
    this.currentPage += 1;
    this.dataLoaded = false;
    this.loadList();
  }

  previousPage(): void {
    this.currentPage -= 1;
    this.dataLoaded = false;
    this.loadList();
  }

  loadList(): void {
    let from = ((this.currentPage - 1) * HeatmapgraphComponent.HEATMAP_ROWS_LENGTH);
    let to = from + HeatmapgraphComponent.HEATMAP_ROWS_LENGTH;
    this.fetchStatistic(from, to, 0);
  }

  private updateGraph() {
    this.dataSource['rows'] = this.rowsDictionary;
    this.dataSource['columns'] = this.columns;
    this.dataSource['dataset'] = this.dataSet;
    this.dataSource['colorrange'] = this.colorRange['colorrange'];
    this.heatmapHeight = this.rows.length * HeatmapgraphComponent.HEATMAP_CELL_HEIGHT;
  }

  sortAscending() {
    this.sortOrder = "ASC";
    this.dataLoaded = false;
    this.loadList();
  }

  sortDescending() {
    this.dataLoaded = false;
    this.sortOrder = "DESC";
    this.loadList();
  }

  private setInitialValues() {
    this.dsmService.getNumberOfParticipants(localStorage.getItem( ComponentService.MENU_SELECTED_REALM )).subscribe(
      data => {
        this.numberOfParticipants = data;
        this.numberOfPages = Math.ceil(data / HeatmapgraphComponent.HEATMAP_ROWS_LENGTH);
      },
      err => {
      }
    );
    this.title = this.heatmapGraph.displayText;
    this.dataSet.push({"data": this.heatmapGraph.data})
    this.rows = this.heatmapGraph.rows;
    this.rowsDictionary["row"] = this.heatmapGraph.rows;
    this.columns["column"] = this.heatmapGraph.columns;
    this.colorRange["colorrange"] = this.heatmapGraph.colorRange;
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
