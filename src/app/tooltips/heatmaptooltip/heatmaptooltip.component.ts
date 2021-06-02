import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { HeatmaptooltipserviceService } from './heatmaptooltipservice.service';
import { RoolOverTooltipdata, DataPlotTooltipData } from './tooltipdata.model';

@Component({
  selector: 'app-heatmaptooltip',
  templateUrl: './heatmaptooltip.component.html',
  styleUrls: ['./heatmaptooltip.component.css']
})
export class HeatmaptooltipComponent implements OnInit {


  @HostListener('document:mousemove', ['$event']) 
  onMouseMove(e) {
    this.clientX = (e.clientX + window.scrollX) + "px";
    this.clientY = (e.clientY + window.scrollY) + "px";
  }

  rollOvered: boolean = false;
  dataPlotClicked: boolean = false;
  dataPlotTooltipDataArray: DataPlotTooltipData[] = [];
  labelRollOverTooltipData: any;
  clientX: string;
  clientY: string;

  constructor(private tooltipService: HeatmaptooltipserviceService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.tooltipService.labelRollOver.subscribe(
      (tooltipData: RoolOverTooltipdata) => {
        if (tooltipData.participantFirstName && tooltipData.participantLastName) {
          this.rollOvered = true;
          this.labelRollOverTooltipData = tooltipData;
        }
      }
    );
    this.tooltipService.labelRollOut.subscribe(
      () => {
        this.rollOvered = false;
      }
    );
    this.tooltipService.dataPlotClick.subscribe(
      (dataPlotTooltipData: DataPlotTooltipData[]) => {
        this.dataPlotTooltipDataArray = dataPlotTooltipData;
        this.dataPlotClicked = true;
        this.cd.detectChanges();
      }
    );
    this.tooltipService.dataPlotRollOut.subscribe(
      () => {
        this.dataPlotClicked = false; 
      }
    )
  }
}
