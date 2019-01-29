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

export class FakeDataSource extends DataSource {
    private wsControl: WebSocket;
    private callbackFuntions: FunctionArray;


    constructor(fb: FingerBoard, driverURI: string) {
        super(fb);

        this.wsControl = new WebSocket(`${driverURI}/guitar_command/session`);
        let eventTypes = new Array<string>();
        eventTypes.push("data");
        this.callbackFuntions = new FunctionArray(eventTypes);
        

        this.wsControl.onmessage = this.onResponseMessage.bind(this);
        this.wsControl.onopen = () => {
            this.wsControl.send('list_driver_devices')
            this.wsControl.send('set_driver_device 0 4');
            this.wsControl.send('run');
        }
    }

    public on(ename: string, cbk: (arg: any) => void): void {
        if(ename=="data") {
            this.callbackFuntions["data"].push(cbk);
        }
    }

    private onResponseMessage(ev: MessageEvent): void {
        const reader = new FileReader();
        reader.readAsText(ev.data, 'utf-8');

        reader.onloadend = () => {
            console.log(reader.result);
        };
    }

    // Change: Send Note instead of {stringID, note}
    private sendFakeData(input: {stringID: number, fretID: number}): void {
        this.callbackFuntions["data"].forEach(func => {
            func(input);
        });
    }

    public startSendData(interval: number): void {
        let parent = this;
        setInterval(function f(): void {
            parent.SendData();
          }, interval);
    }

    public SendData(): void {
        this.sendFakeData({stringID: 1, fretID: 0});
    }
};