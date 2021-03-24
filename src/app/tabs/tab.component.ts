/**
 * A single tab page. It renders the passed template
 * via the @Input properties by using the ngTemplateOutlet
 * and ngTemplateOutletContext directives.
 */

 import { Component, Input, Output, EventEmitter } from '@angular/core';

 @Component({
   selector: 'tabChild',
   styles: [
     `
     .pane{
       padding: 1em;
     }
   `
   ],
   template: `
     <div [hidden]="!active" class="pane">
       <ng-content *ngIf="!disabled"></ng-content>
     </div>
   `
 })
 export class TabComponent {
   @Input('tabTitle') title: string;
   @Input() active = false;
   @Input() isGrandChild = false;
   @Input() disabled = false;
   @Output() putTab = new EventEmitter();

   ngOnInit() {
     this.putTab.emit(this);
   }

 }
 