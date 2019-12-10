import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Statics} from "../utils/statics";

@Component({
  selector: "app-search-bar",
  templateUrl: "./search-bar.component.html",
  styleUrls: ["./search-bar.component.css"]
})
export class SearchBarComponent implements OnInit {

  @Input() textQuery: string;
  @Input() filters: {};
  @Input() allFieldNames: Set<string>;
  @Input() showHelp: boolean;
  @Output() queryText = new EventEmitter();

  filterQuery: string;
  edit: boolean;
  wrongQuery: boolean;

  constructor() {
  }

  ngOnInit() {
  }

  checkQuery() {
    for (let key of Object.keys(this.filters)) {
      for (let filter of this.filters[key]) {
        filter.clearFilter();
      }
    }
    let str = this.textQuery;
    let regex = /(\s*(AND\s*)|\s*(and\s*))/g;
    if (this.textQuery === null || this.textQuery.length == 0 || this.textQuery.search(regex) != 0) {
      if (this.textQuery === null) {
        this.textQuery = "";
      }
      this.textQuery = "AND " + (this.textQuery.length > 0 ? this.textQuery : "");
    }
    this.wrongQuery = !this.checkQueryWithAutomata(this.textQuery);
    if (this.wrongQuery) {
      return;
    }
    let p = 0;
    let q = 0;
    for (let c of str) {
      if (c === ")") {
        p--;
        if (p < 0) {
          this.wrongQuery = true;
          break;
        }
      }
      else if (c === "(") {
        p++;
      }

      else if (c === "'") {
        if (q == 0) {
          q++;
        }
        else if (q == 1) {
          q--;
        }
      }

    }
    if (p != 0 || q != 0) {
      this.wrongQuery = true;
    }
  }

  putFilterQueryBack() {
    this.textQuery = "";
    this.edit = true;
  }

  doFilterByQuery() {
    if (this.textQuery !== "" && this.textQuery != null) {
      this.queryText.emit(this.textQuery);
    }
  }

  checkQueryWithAutomata(query: string): boolean {
    let logicalOperators = ["AND", "OR", "and", "or"];
    let parenthesis = ["(", ")"];
    let operators = ["LIKE", "=", "<=", ">=", "<>", "like"];
    let initialState = -1;
    let state = initialState;
    let queryParts = query.split(" ");
    let i = 0;
    while (i < queryParts.length) {
      let part = queryParts[i];
      if (part === "") {
        i++;
        continue;
      }
      console.log(part);
      console.log(state);
      console.log(this.allFieldNames);
      switch (state) {
        case -1:
          if (logicalOperators.includes(part)) {
            state = 1;
            break;
          }
          else {
            return false;
          }
        case 1:
          if (part === "(") {
            state = 0;
            break;
          }
          else if (this.isColumn(part)) {
            state = 2;
            break;
          }
          else {
            return false;
          }
        case 0:
          if (part === "(") {
            state = 0;
            break;
          }
          if (this.isColumn(part)) {
            state = 2;
            break;
          }
          else {
            return false;
          }

        case 2:
          if (part === "IS" || part === "is") {
            state = 6;
            break;
          }
          else if (part === "like" || part === "LIKE") {
            state = 8;
            break;
          }
          else if (operators.includes(part)) {
            state = 3;
            break;
          }
          else {
            return false;
          }
        case 3:
          if (logicalOperators.includes(part) || operators.includes(part) || parenthesis.includes(part)) {
            return false;
          }
          else {
            state = 4;
            break;
          }
        case 4:
          if (part === "(") {
            state = 0;
            break;
          }
          else if (logicalOperators.includes(part)) {
            state = 1;
            break;
          }
          else if (part === ")") {
            state = 5;
            break;
          }
          else {
            return false;
          }
        case 5:
          if (part === ")") {
            state = 5;
            break;
          }
          if (logicalOperators.includes(part)) {
            state = 1;
            break;
          }
        case 6:
          if (part === "NOT" || part === "not") {
            state = 7;
            break;
          }
          else if (part === "NULL" || part === "null") {
            state = 4;
            break;
          }
          else {
            return false;
          }
        case 7:
          if (part === "NULL" || part === "null") {
            state = 4;
            break;
          }
          else {
            return false;
          }
        case 8: {
          if (logicalOperators.includes(part) || operators.includes(part) || parenthesis.includes(part)) {
            return false;
          }
          else {
            if (part.indexOf("'") != 0 || part.lastIndexOf("'") != part.length - 1 || (part.substr(1, part.length - 2).includes("'"))) {
              return false;
            }
            state = 4;
            break;
          }
        }
        default:
          return false;
      }
      i += 1;
    }
    if (state == 5 || state == 4) {
      return true;
    }
    else {
      return false;
    }
  }

  isColumn(name): boolean {
    if (this.allFieldNames != null) {
      return this.allFieldNames.has(name);
    }
    return false;
  }

  getButtonColorStyle(isOpened: boolean): string {
    if (isOpened) {
      return Statics.COLOR_PRIMARY;
    }
    return Statics.COLOR_BASIC;
  }

  public search(event) {
    if (event.keyCode == 13) {
      this.checkQuery();
      if (!this.wrongQuery && this.textQuery.length > 0) {
        this.doFilterByQuery();
      }
    }
    else {
      return;
    }
  }

}