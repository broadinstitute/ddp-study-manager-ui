import { Filter } from "../filter-column/filter-column.model";

export class Sort {

    constructor(public type: string, public additionalType: string, public tableAlias: string,
        public outerProperty: string, public innerProperty: string, public order: string, public activityVersions?: string[]) {
            this.type = type;
            this.additionalType = additionalType;
            this.tableAlias = tableAlias;
            this.outerProperty = outerProperty;
            this.innerProperty = innerProperty;
            this.order = order;
            this.activityVersions = activityVersions;
    }

    static parse(filter: Filter, order: string): Sort {
        return new Sort(filter.type, filter.additionalType, filter.participantColumn.tableAlias, 
            filter.participantColumn.object, filter.participantColumn.name, order);
    }

}
