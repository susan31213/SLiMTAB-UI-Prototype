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

export class DriverDataSource extends DataSource {
    private wsData: WebSocket;
    private callbackFuntions: FunctionArray;

    constructor(fb: FingerBoard, driverURI: string) {
        super(fb);

        this.wsData = new WebSocket(`${driverURI}/signal/subscribe`);
        let eventTypes = new Array<string>();
        eventTypes.push("data");
        this.callbackFuntions = new FunctionArray(eventTypes);
        this.wsData.onmessage = this.onDataMessage.bind(this);
    }

    public on(ename: string, cbk: (...args: any[])=>void): void {
        if(ename=="data") {
            this.callbackFuntions["data"].push(cbk);
        }
    }

    /*
    private onResponseMessage(ev: MessageEvent): void {
        const reader = new FileReader();
        reader.readAsText(ev.data, 'utf-8');

        reader.onloadend = () => {
            console.log(reader.result);
        };
    }
    */

    private onDataMessage(ev: MessageEvent): void {
        const reader = new FileReader();
        reader.readAsText(ev.data, 'utf-8');

        reader.onloadend = () => {
            const data = (reader.result as string).split(' ');
            this.callbackFuntions["data"].forEach(func => {
                func(Number(data[0]), data[1]);
            });
        };
    }


};