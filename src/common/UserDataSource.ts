import { DataSource } from "./DataSource";
import { FingerBoard } from "./FingerBoard";

class FunctionArray {
    [index: string]: Array<Function>;
    constructor(eventType: Array<string>) {
        eventType.forEach(element => {
            this[element] = new Array<Function>();
        });
    }
}

export class UserDataSource extends DataSource {
    private callbackFuntions: FunctionArray;
    constructor(fb: FingerBoard) {
        super(fb);
        let eventTypes = new Array<string>();
        eventTypes.push("press");
        eventTypes.push("unpress");
        eventTypes.push("pick");
        this.callbackFuntions = new FunctionArray(eventTypes);
    }
    
    public on(ename: string, cbk: (arg: any) => void): void {
        if(ename == "press") {
            this.callbackFuntions["press"].push(cbk);
        } else if (ename == "unpress") {
            this.callbackFuntions["unpress"].push(cbk);
        } else if (ename == "pick") {
            this.callbackFuntions["pick"].push(cbk);
        }
    }

    public do(action: string, noteInfo: {stringID: number, note: string}) {
        if(action == "press") {
            this.callbackFuntions["press"].forEach(func => {
                func(noteInfo);
            })
        } else if(action == "unpress") {
            this.callbackFuntions["unpress"].forEach(func => {
                func(noteInfo);
            })
        } else if(action == "pick") {
            this.callbackFuntions["pick"].forEach(func => {
                func(noteInfo);
            })
        }
    }

    public get fingerTab(): FingerBoard {
        return this.fb;
    }
}