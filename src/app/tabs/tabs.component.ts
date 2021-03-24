/**
 * The main component that renders single TabComponent
 * instances.
 */

 import {
  Component,
  ContentChildren,
  QueryList,
  AfterContentInit,
  ViewChild,
  ComponentFactoryResolver,
  ViewContainerRef,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { FormDataComponent } from '../form-data/form-data.component';

import { TabComponent } from './tab.component';

@Component({
  selector: 'tabFamily',
  template: `
    <ul class="nav nav-tabs">
      <li *ngFor="let tab of participantTabs" (click)="selectTab(tab)" [ngClass]="{'disabled': tab.disabled}" [class.active]="tab.active">
        <a href="javascript:void(0);">{{tab.title}}</a>
      </li>
    </ul>
    <ng-content></ng-content>
  `,
  styles: [
    `
    .tab-close {
      color: gray;
      text-align: right;
      cursor: pointer;
    }

    .disabled {
      pointer-events:none;
      opacity:0.6; 
    }

    `
  ]
})
export class TabsComponent{
  
  @ContentChildren(TabComponent) tabs: QueryList<TabComponent>;
  // @ContentChildren(FormDataComponent) formdatas: QueryList<FormDataComponent>;


  @Input() participantTabs: TabComponent[];

  @Output() activateDoRender = new EventEmitter<void>(true);

  ngOnChanges() {
    setTimeout(() => {
    })
  }
  
  
  ngAfterContentInit() {
    let activeTabs = this.participantTabs.filter((tab)=>tab.active);
    // if there is no active tab set, activate the first
    if(activeTabs.length === 0 && !this.participantTabs[0].disabled) {
      this.activateTab(this.participantTabs[0]);
    }
  }
  
  selectTab(tab: TabComponent){
    this.activateTab(tab);
    this.activateDoRender.emit();
  }

  activateTab(tab: TabComponent) {
    // deactivate all tabs
    this.participantTabs.forEach(tab => tab.active = false);
    
    // activate the tab the user has clicked on.
    if (tab != null) {
      tab.active = true;
    }
  }
  
}
