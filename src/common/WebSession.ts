import {FingerBoard} from './FingerBoard';

class FunctionArray {
    [index: string]: Array<Function>;
    constructor(eventType: Array<string>) {
        eventType.forEach(element => {
            this[element] = new Array<Function>();
        });
    }
}

enum ControlAction {
    Hello,
    Bye,
    Loha,
    Data
}

export interface UserInfo {
    name: string;
    fb: FingerBoard;
}

export class WebSession {
    private wsGuitar: WebSocket;
    private wsControl: WebSocket;
    private myName: string;
    private usersArr: Array<UserInfo> = [];

    private listeningFunction: FunctionArray;

    constructor(myName: string, wsPrefix: string, session: string) {
        this.myName = myName;
        this.wsGuitar = new WebSocket(`${wsPrefix}/${session}/guitar/session`);
        this.wsControl = new WebSocket(`${wsPrefix}/${session}/control/session`);
        this.wsControl.onmessage = this.onCtlMessage.bind(this);

        let eventTypes = new Array<string>();
        eventTypes.push("new member");
        eventTypes.push("data");
        // eventTypes.push("bye");
        this.listeningFunction = new FunctionArray(eventTypes);

        this.wsControl.onopen = () => {
            this.wsControl.send(`hello ${myName}`);
        }
        // this.wsControl.onclose = () => {
        //     this.wsControl.send(`bye ${myName}`);
        // }
        this.wsGuitar.url;
    }

    private onCtlMessage(e: MessageEvent): void {
        var reader = new FileReader();
        reader.readAsText(e.data);
        reader.onload = () => {
            const result = reader.result;
            let action = this.detectMsg(reader.result);
            if(action == ControlAction.Hello) {

                const name = result.split(" ")[1];
                let newUser = {name: name, fb:new FingerBoard()};
                this.usersArr.push(newUser);
                this.doCallback("new member", newUser);
                this.wsControl.send(`loha ${this.myName}`);

            } else if(action == ControlAction.Loha) {

                const name = result.split(" ")[1];
                if(this.usersArr.filter((element) => element.name == name).length == 0) {
                    // not int users array, update
                    let newUser = {name: name, fb:new FingerBoard()};
                    this.usersArr.push(newUser);
                    this.doCallback("new member", newUser);
                }
                else {
                    console.log("User " + name + " already in array!");
                }

            } else if(action == ControlAction.Data) {

                // data username,action,stringIndex,note
                const name = result.split(" ")[1].split(",")[0];
                this.usersArr.forEach(user => {
                    if(user.name == name) {
                        this.doCallback("data", user, result.split(" ")[1]);
                    }
                });
                    
             } //else if(action == ControlAction.Bye) {
            //     const byeUser = result.split(" ")[1];
            //     console.log(`${this.myName} get bye from ${byeUser}`)
            //     this.usersArr.forEach(user => {
            //         if(user.name != byeUser) {
            //             this.doCallback("bye", user);
            //         }
            //     });
            // }
                
        }
    }

    public on(event: string, func: (user?: UserInfo, data?: string) => void) {
        if(event == "new member") {
            this.listeningFunction["new member"].push(func);
        }
        else if(event == "data") {
            this.listeningFunction["data"].push(func);
        }
        else if(event == "bye") {
            this.listeningFunction["bye"].push(func);
        }
    }

    private doCallback(event: string, user?: UserInfo, data?: string) {
        if(event == "new member" && user != undefined) {
            this.listeningFunction[event].forEach(func => {
                func(user);
            });
        }
        else if(event == "data" && data != undefined && user != undefined) {
            this.listeningFunction[event].forEach(func => {
                func(user, data);
            })
        }
        else if(event == "bye" && user != undefined) {
            this.listeningFunction[event].forEach(func => {
                func(user);
            });
        }
        else {
            this.listeningFunction[event].forEach(func => {
                func();
            });
        }
    }

    // This is for onCtlMessage() to detect message type
    private detectMsg(msg: string): number {
        if(msg.split(" ")[0] == "hello") return ControlAction.Hello;
        else if(msg.split(" ")[0] == "bye") return ControlAction.Bye;
        else if(msg.split(" ")[0] == "loha") return ControlAction.Loha;
        else if(msg.split(" ")[0] == "data") return ControlAction.Data;
        else return -1;
    }

    public add() {
        
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

    public get users(): Array<UserInfo> {
        return this.usersArr;
    }


}