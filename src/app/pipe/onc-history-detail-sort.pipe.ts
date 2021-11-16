import { Pipe, PipeTransform } from "@angular/core";
import { OncHistoryDetail } from "../onc-history-detail/onc-history-detail.model";

@Pipe({
  name: "oncHistoryDetailSort",
})
export class OncHistoryDetailSortPipe implements PipeTransform {

  transform(array: OncHistoryDetail[], trigger: number): OncHistoryDetail[] {
    var reA = /[^a-zA-Z]/g;
    var reN = /[^0-9]/g;

    array.sort((a, b) => {
      if (a.datePx != null && b.datePx != null && a.datePx != undefined && b.datePx != undefined) {
        var aA = a.datePx.replace(reA, "");
        var bA = b.datePx.replace(reA, "");
        if (aA === bA) {
          var aN = parseInt(a.datePx.replace(reN, ""), 10);
          var bN = parseInt(b.datePx.replace(reN, ""), 10);
          return aN === bN ? 0 : aN > bN ? 1 : -1;
        }
        else {
          return aA > bA ? 1 : -1;
        }
      }
      if (b.oncHistoryDetailId == null) {
        return -1;
      }
      if (a.datePx == null) {
        return 1;
      }
      if (b.datePx == null) {
        return -1;
      }
    });
    return array;
  }
}
