import { DataSource } from './DataSource';

class FunctionArray {
    [index: string]: Array<Function>;
    constructor(eventType: Array<string>) {
        eventType.forEach(element => {
            this[element] = new Array<Function>();
        });
    }
}

enum SessionInfoOp {
    eMsg=0xAA,
    eQueryResult=0xAB,
    eEnter=0xBB,
    eLeave=0xCC
};

export enum SessionCommandOp {
    eBroadcast,
    eName=0x01,
    eQueryParticipant,
    eSlient,
    eAdmin=0x80,
    eAdminKick=0x81
};

class ServerMsg {
    opcode: SessionInfoOp;
    from: string;
    data: Array<string | number>;
    constructor(array: ArrayBuffer) {
        var wordarray = new Uint8Array(array);
        this.opcode = wordarray[0];
        this.from = "";
        this.data = [];
        if(this.opcode != SessionInfoOp.eQueryResult) {
            for(var i=1; i<9; i++)
                this.from += wordarray[i].toString();
            for(var i=9; i< wordarray.length; i++)
                this.data.push(wordarray[i]);
        }
        else {
            for(var i=1; i<wordarray.length; i++)
                this.data.push(wordarray[i]);
        }
    }
};

export class WebSession {
    private wsControl: WebSocket;
    private myName: string;
    private dataSources: Array<DataSource> = [];

    private listeningFunction: FunctionArray;

    constructor(myName: string, wsPrefix: string, session: string) {
        this.myName = myName;
        this.wsControl = new WebSocket(`${wsPrefix}/${session}/control/session2`);
        this.wsControl.binaryType = "arraybuffer";
        this.wsControl.onmessage = this.onCtlMessage.bind(this);

        let eventTypes = new Array<string>();
        eventTypes.push("enter");
        eventTypes.push("data");
        eventTypes.push("leave");
        this.listeningFunction = new FunctionArray(eventTypes);

        this.wsControl.onopen = () => {
            // say hi?
        }
        // this.wsControl.onclose = () => {}
    }

    private onCtlMessage(e: MessageEvent): void {
        if(e.data instanceof ArrayBuffer) {
            var msg = new ServerMsg(e.data);
            if(msg.opcode == SessionInfoOp.eEnter) {
                this.doCallback("enter", [msg.from]);
            }
            else if(msg.opcode == SessionInfoOp.eLeave) {
                this.doCallback("leave", [msg.from]);
            }
            else if(msg.opcode == SessionInfoOp.eMsg) {
                this.doCallback("data", msg.data);
            }
            else
                console.error(`Wrong message format...`);
        }
        
    }

    public on(event: string, func: (data?: Array<string|number>) => void) {
        if(event == "enter") {
            this.listeningFunction["enter"].push(func);
        }
        else if(event == "data") {
            this.listeningFunction["data"].push(func);
        }
        else if(event == "leave") {
            this.listeningFunction["leave"].push(func);
        }
    }

    private doCallback(event: string, data?: Array<string|number>) {
        if(event == "enter") {
            this.listeningFunction[event].forEach(func => {
                func();
            });
        }
        else if(event == "data" && data != undefined) {
            this.listeningFunction[event].forEach(func => {
                func(data);
            })
        }
        else if(event == "leave") {
            this.listeningFunction[event].forEach(func => {
                func();
            });
        }
        else {
            console.error("No such type of event...");
        }
    }

    public add(ds: DataSource) {
        this.dataSources.push(ds)
    }

    public get name(): string {
        return this.myName;
    }

    public set name(name: string) {
        this.myName = name;
    }

    public get wsCtrl(): WebSocket {
        return this.wsControl;
    }

    public get wsGita(): WebSocket {
        return this.wsControl;
    }
}