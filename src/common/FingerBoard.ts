interface FingerBoardConfig {
    numOfString: number;
    numOfCoda: number;
    baseTones: Array<string>;

}

class Dictionary {
    [index: string]: number;
    constructor(keys: Array<string>, values: Array<number>) {
        if(keys.length != values.length) return;
        for(var i=0; i<keys.length; i++) {
            this[keys[i]] = values[i];
        }
    }
}
const noteNumberDic = new Dictionary(["C", "D", "E", "F", "G", "A", "B"], [0, 2, 4, 5, 7, 9, 11]);

export class NoteInfo {
    divIndex: number;
    string: number;
    note: string;
    constructor(str: string) {
        let splited = str.split(",");
        this.divIndex = parseInt(splited[0]);
        this.string = parseInt(splited[1]);
        this.note = splited[2];
    }
}

export class FingerBoard {
    private config: FingerBoardConfig;
    private domElementCache: HTMLObjectElement = document.createElement("object");
    private pressPointElementCache: HTMLElement = document.createElement("div");
    private stringElementsCache: Array<HTMLElement> = [];

    private pressFunctions: Array<Function> = [];
    private unPressFunctions: Array<Function> = [];
    private pickFunctions: Array<Function> = [];

    private baseToneNumbers: Array<number> = [];

    constructor(config?: FingerBoardConfig) {
        if(config == undefined) {
            this.config = {numOfString: 6, numOfCoda: 24, baseTones: ["E4", "B3", "G3", "D3", "A2", "E2"]};
        } else {
            this.config = config;
        }

        this.config.baseTones.forEach(element => {
            this.baseToneNumbers.push(this.note2num(element));
        });
    }

    public drawFingerTab()
    {
        this.domElementCache.id = "svg-object";
        this.domElementCache.data = "../../fingertab.svg";
        this.domElementCache.width = "1450px";
        this.domElementCache.height = "182.288px";

        let a = this.domElementCache as HTMLObjectElement;
        let self = this;
        a.onload = function() {
            var svgDoc = a.contentDocument;
            if(svgDoc != null) {
                self.pressPointElementCache = svgDoc.getElementById("points") as HTMLElement;
                for(var i=0; i<self.pressPointElementCache.childElementCount; i++) {
                    self.pressPointElementCache.children[i].id = `${i}`;
                }
                self.stringElementsCache.push(svgDoc.getElementById("str1") as HTMLElement);
                self.stringElementsCache.push(svgDoc.getElementById("str2") as HTMLElement);
                self.stringElementsCache.push(svgDoc.getElementById("str3") as HTMLElement);
                self.stringElementsCache.push(svgDoc.getElementById("str4") as HTMLElement);
                self.stringElementsCache.push(svgDoc.getElementById("str5") as HTMLElement);
                self.stringElementsCache.push(svgDoc.getElementById("str6") as HTMLElement);
            }
        };
    }

    public on(event: string, func: (note: NoteInfo) => void) {
        if(event == "press")
            this.pressFunctions.push(func);
        else if(event == "unPress")
            this.unPressFunctions.push(func);
        else if(event == "pick")
            this.pickFunctions.push(func);
    }

    // public unSubscribe(event: string, func: (note: NoteInfo) => void) {
    //     if(event == "press") {
    //         this.pressFunctions.forEach( (element, idx) => {
    //             if(element == func) this.pressFunctions.splice(idx, 1);
    //         });
    //     }
    //     else if(event == "unPress") {
    //         this.unPressFunctions.forEach( (element, idx) => {
    //             if(element == func) this.unPressFunctions.splice(idx, 1);
    //         });
    //     }
    //     else if(event == "pick") {
    //         this.pickFunctions.forEach( (element, idx) => {
    //             if(element == func) this.pickFunctions.splice(idx, 1);
    //         });
    //     }
    // }

    public press(index: number): void {
        let element = this.pressPointElements.children.item(index);
        if(element != null)  
            element.setAttribute('class', "fb-p");
    }

    public unpress(index: number): void {
        let element = this.pressPointElements.children.item(index);
        if(element != null)  
            element.setAttribute('class', "fb-u");
    }

    public pick(stringId: number): void {
        var element: any = this.stringElementsCache[stringId-1].children[2];
        element.beginElement();
    }

    public pressPointIndex(stringId:number, note: string): number {
        let diff = this.note2num(note) - this.baseToneNumbers[stringId -1];
        if(diff != 0)
            return (stringId-1) * (this.config.numOfCoda) + diff -1;
        else
            return -1;
    } 

    get domElement(): HTMLObjectElement {
        return this.domElementCache;
    }

    get pressPointElements(): HTMLElement {
        return this.pressPointElementCache;
    }

    get stringElements(): Array<HTMLElement> {
        return this.stringElementsCache;
    }

    private note2num(note: string | null): number 
    {
        if(note != null)
        {
            let a, b: number;
            a = noteNumberDic[note.charAt(0)];
            b = + note.charAt(note.length-1);
            let ret = a+(b-1)*12;

            if(note.length == 3) {
                if(note.charAt(1) == "#")   ret++;
                else if(note.charAt(1) == "b")    ret--;
            }

            if(a != undefined && b != undefined)
                return (note.length == 2)? ret : ((note.charAt(1) == "#")? ret++ : ret--);
            else
                return -1;
        }
        else
            return -1;
    }

    
}