/**
 * A single tab page. It renders the passed template
 * via the @Input properties by using the ngTemplateOutlet
 * and ngTemplateOutletContext directives.
 */

 import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Tab } from './tab.model';

 @Component({
   selector: 'my-tab',
   styles: [
     `
     .pane{
       padding: 1em;
     }
   `
   ],
   template: `
     <div [hidden]="!active" class="pane">
       <ng-content></ng-content>
     </div>
   `
 })
 export class TabComponent {
   @Input('tabTitle') title: string;
   @Input() active = false;
   @Output() putTab = new EventEmitter();

   ngOnInit() {
       this.putTab.emit(this);
   }
 }
 