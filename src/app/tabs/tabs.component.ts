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
  Input
} from '@angular/core';
import { FormDataComponent } from '../form-data/form-data.component';

import { TabComponent } from './tab.component';
import { Tab } from './tab.model';

@Component({
  selector: 'my-tabs',
  template: `
    <ul class="nav nav-tabs">
      <li *ngFor="let tab of participantTabs" (click)="selectTab(tab)" [class.active]="tab.active">
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
    `
  ]
})
export class TabsComponent implements AfterContentInit {
  
  @ContentChildren(TabComponent) tabs: QueryList<TabComponent>;
  // @ContentChildren(FormDataComponent) formdatas: QueryList<FormDataComponent>;


  @Input() participantTabs: TabComponent[];


  ngOnChanges() {
    setTimeout(() => {
    })

  }
  
  
  ngAfterContentInit() {
    let activeTabs = this.participantTabs.filter((tab)=>tab.active);
    // if there is no active tab set, activate the first
    if(activeTabs.length === 0) {
      this.selectTab(this.participantTabs[0]);
    }

  }
  
  selectTab(tab: TabComponent){
    // deactivate all tabs
    this.participantTabs.forEach(tab => tab.active = false);
    
    // activate the tab the user has clicked on.
    if (tab != null) {
      tab.active = true;
    }
  }
}
