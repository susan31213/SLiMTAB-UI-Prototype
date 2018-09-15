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
const noteNumberDic = new Dictionary(["C","D","E","F","G","A","B"], [0,2,4,5,7,9,11]);

class StringStatus {
    playing: boolean;
    start: number;
    elapsed: number;
    duration: number;

    constructor() {
        this.playing = false;
        this.start = -1;
        this.elapsed = -1;
        this.duration = 800;
    }
}

const stringInterval = 30;
// interface FingerBoardCallbacks {
//     onPressed: (e: any) => void;
// }

// enum StringID {
//     One = 1,
//     Two = 2,
//     Three = 3,
//     Four = 4,
//     Five = 5,
//     Six = 6
// }

export class FingerBoard {
    private config: FingerBoardConfig;
    private domElementCache: HTMLCanvasElement = document.createElement("canvas");
    private pressPointElementCache: HTMLElement = document.createElement("div");
    private stringStutasCache: Array<StringStatus> = [];

    private baseToneNumbers: Array<number> = [];
    //private callbacks: FingerBoardCallbacks;

    constructor(config?: FingerBoardConfig) {
        if(config == undefined) {
            this.config = {numOfString: 6, numOfCoda: 20, baseTones: ["E4", "B3", "G3", "D3", "A2", "E2"]};
        } else {
            this.config = config;
        }

        this.config.baseTones.forEach(element => {
            this.baseToneNumbers.push(this.note2num(element));

            // init string stutas...
            this.stringStutasCache.push(new StringStatus());
            console.log(this.stringStutasCache[this.stringStutasCache.length-1].playing);
        });

        // Create Canvas & press points
        this.DrawCanvasAndPressPoints();
    }

    // public on(ename: string, cbk: (e: any) => void) {
        
    // }

    public DrawCanvasAndPressPoints() {
        let ctx = this.domElementCache.getContext('2d');
        if(ctx != null)
            ctx.clearRect(0, 0, this.domElementCache.width, this.domElementCache.height);
        this.domElementCache.width = window.innerWidth * 0.9;
        this.domElementCache.height = (this.config.numOfString+1) * stringInterval;
        
        if(ctx != null)
        {
            // Draw string
            ctx.lineWidth = 1;
            for(var i = 1; i <= this.config.numOfString; i++)
            {
                ctx.beginPath();
                ctx.moveTo(0, i*stringInterval);
                ctx.lineTo(this.domElement.width, i*stringInterval);
                ctx.stroke(); 
            }

            // Draw coda
            let dx = this.domElement.width / this.config.numOfCoda;
            for(var i = 1; i < this.config.numOfCoda; i++)
            {
                ctx.beginPath();
                ctx.moveTo(dx*i, 0);
                ctx.lineTo(dx*i, this.domElement.height);
                ctx.stroke(); 
            }
        }

        // Press point divs
        if(this.pressPointElementCache != null) this.pressPointElementCache.remove();
        this.pressPointElementCache = document.createElement("div");
        this.pressPointElementCache.id = "pressPointContainer";
        
        this.pressPointElementCache.style.height = (this.domElementCache.height-stringInterval) + "px";
        this.pressPointElementCache.style.paddingTop = (stringInterval/2+1) + "px";
        this.pressPointElementCache.style.paddingBottom = (stringInterval/2+1) + "px";
        
        for(var i = 0; i < this.config.numOfString; i++) {
            for(var j = 0; j < this.config.numOfCoda; j++) {
                
                let d: HTMLDivElement = document.createElement("div");
                d.id = "pressPoint";
                d.className = "unpress";
                d.style.width = (this.domElementCache.width/this.config.numOfCoda*0.5) + "px";
                d.style.marginLeft = (this.domElementCache.width/this.config.numOfCoda*0.25) + "px";
                d.style.marginRight = (this.domElementCache.width/this.config.numOfCoda*0.25) + "px";
                d.style.height = (stringInterval-2) + "px";

                this.pressPointElementCache.appendChild(d);

            }
            this.pressPointElementCache.appendChild(document.createElement("br"));
        }
    }

    public press(stringId: number, note: string): void {        
        let diff = this.note2num(note) - this.baseToneNumbers[stringId -1];
        if(diff != 0) {
            console.log("Press: " + stringId + ", " + note + "(" + ((stringId-1) * (this.config.numOfCoda+1) + diff) + ")");
            this.pressPointElements.children.item((stringId-1) * (this.config.numOfCoda+1) + diff -1).className = "press";
        }
    }

    public unPress(stringId: number, note: string): void {
        let diff = this.note2num(note) - this.baseToneNumbers[stringId -1];
        if(diff != 0) {
            console.log("UnPress: " + stringId + ", " + note + "(" + ((stringId-1) * (this.config.numOfCoda+1) + diff) + ")");
            this.pressPointElements.children.item((stringId-1) * (this.config.numOfCoda+1) + diff -1).className = "unpress";
        }
    }

    public pick(stringId: number): void {
        console.log("Pick: " + stringId);
        this.stringStutasCache[stringId-1].playing = true;
        this.stringStutasCache[stringId-1].start = -1;
        this.playAnimation(this);
    }

    get domElement(): HTMLCanvasElement {
        return this.domElementCache;
    }

    get pressPointElements(): HTMLElement {
        return this.pressPointElementCache;
    }

    get stringStutas(): Array<StringStatus> {
        return this.stringStutasCache;
    }

    private note2num(note: string | null): number 
    {
        if(note != null)
        {
            let a, b: number;
            a = noteNumberDic[note.charAt(0)];
            b = + note.charAt(1);
            let ret = a+(b-1)*12;
            if(note.length == 3) {
                if(note.charAt(2) == "#")   ret++;
                else if(note.charAt(2) == "b")    ret--;
            }

            if(a != undefined && b != undefined)
                return ret;
            else
                return -1;
        }
        else
            return -1;
    }  

    private playAnimation(parent: FingerBoard) {

        requestAnimationFrame(reDrawString);

        function reDrawString(timestamp: any) {

            let ss = parent.stringStutasCache;
            let noPlayingCnt = ss.length;
            
            // Clear last frame and draw background 
            let ctx = parent.domElementCache.getContext('2d');
            if(ctx != null) {
                
                ctx.clearRect(0, 0, parent.domElementCache.width, parent.domElementCache.height);
                // Draw string
                ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
                ctx.lineWidth = 1;
                for(var i = 1; i <= parent.config.numOfString; i++)
                {
                    ctx.beginPath();
                    ctx.moveTo(0, i*stringInterval);
                    ctx.lineTo(parent.domElement.width, i*stringInterval);
                    ctx.stroke(); 
                }
    
                // Draw coda
                let dx = parent.domElement.width / parent.config.numOfCoda;
                for(var i = 1; i < parent.config.numOfCoda; i++)
                {
                    ctx.beginPath();
                    ctx.moveTo(dx*i, 0);
                    ctx.lineTo(dx*i, parent.domElement.height);
                    ctx.stroke(); 
                }
            }
            var time_id = -1;   // timestamp不會出現-1?????? 可這樣用?????
    
            // Check every string need to draw red line or not
            for(var i=0; i<ss.length; i++) {
                if(ss[i].playing)
                {
                    noPlayingCnt--;
                    if(ss[i].start == -1) ss[i].start = timestamp;
                    ss[i].elapsed = timestamp - ss[i].start;
    
                    // draw red line
                    if ((ss[i].elapsed / ss[i].duration) < 1) {
                        
                        if(ctx != null) {
                            ctx.beginPath();
                            ctx.lineWidth = 4;
                            ctx.moveTo(0, (i+1)*stringInterval);
                            ctx.lineTo(parent.domElement.width, (i+1)*stringInterval);
                            ctx.strokeStyle = 'rgba(255, 0, 0, ' + (1-ss[i].elapsed / ss[i].duration) + ')';
                            ctx.stroke();
                        }
                        
                    } else {
                        ss[i].playing = false;
                    }
                }
            }

            // If no one string in playing, stop requestAnumationFrame
            if(noPlayingCnt == ss.length) {
                cancelAnimationFrame(time_id);
            } else {
                time_id = requestAnimationFrame(reDrawString);
            }
        } 
    }

    
}