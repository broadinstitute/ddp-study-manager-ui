import { EventEmitter, Injectable } from '@angular/core';
import { RoolOverTooltipdata, DataPlotTooltipData } from './tooltipdata.model';

@Injectable()
export class HeatmaptooltipserviceService {

  labelRollOver: EventEmitter<RoolOverTooltipdata> = new EventEmitter<RoolOverTooltipdata>();
  labelRollOut = new EventEmitter();

  dataPlotClick: EventEmitter<DataPlotTooltipData[]> = new EventEmitter<DataPlotTooltipData[]>();
  dataPlotRollOut = new EventEmitter();

  constructor() { }

}
