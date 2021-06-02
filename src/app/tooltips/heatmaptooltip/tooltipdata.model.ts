export class RoolOverTooltipdata {

    public participantFirstName: string;
    public participantLastName: string;
    public participantGuid: string;


    constructor(participantFirstName: string, participantLastName: string, participantGuid: string) {
        this.participantFirstName = participantFirstName;
        this.participantLastName = participantLastName;
        this.participantGuid = participantGuid;
    }

}

export class DataPlotTooltipData {

    public date: string;
    public time: string;
    public city: string;
    public stateProvince: string;
    public postalCode: string;
    public type: string;
    public description: string;
    public code: string;

    constructor(date: string, time: string, city: string, stateProvince: string, postalCode: string, type: string, description: string, code: string) {
        this.date = date;
        this.time = time;
        this.city = city;
        this.stateProvince = stateProvince;
        this.postalCode = postalCode;
        this.type = type;
        this.description = description;
        this.code = code;
    }

}