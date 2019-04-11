import { Tabular, Note, Rest } from "../common/Tabular";
import { FingerBoard } from "./FingerBoard";

class NoteLogic extends Note {
    public birthTime: number;
    public x: number;
    public state: number;
    public corrects: Array<boolean>;
    public parent: Note;
    constructor(note: Note, birth: number) {
        super(note.positions, note.duration);
        this.parent = note;
        this.birthTime = birth;
        this.x = 1070;
        this.state = NoteState.hidden;
        this.corrects = [];
        this.positions.forEach(() => {
            this.corrects.push(false);
        });
    }
};
  
class RestLogic extends Rest {
    public birthTime: number
    public x: number;
    public state: number;
    constructor(rest: Rest, birth: number) {
        super(rest.duration)
        this.birthTime = birth;
        this.x = 1070;
        this.state = NoteState.hidden;
    }
};

export enum GameState {
    playing,
    end,
    replaying
};

enum NoteState {
    hidden,
    shown,
    good,
    perfect,
    die
};

class FunctionArray {
    [index: string]: Array<Function>;
    constructor(eventType: Array<string>) {
        eventType.forEach(element => {
            this[element] = new Array<Function>();
        });
    }
}

interface GameLogicConfig {
    bpm: number;
    // second
    validDuration: number;
}

interface StringEvent {
    // second
    onsetTime: number;
    fretID: number;
    note: Note;
}

type Array6<T> = [T, T, T, T, T, T];
type StringsEvent = Array6<Array<StringEvent>>;

interface PlayContext {
    startTime: number;
    triggeredEvent: Array6<Array<boolean>>;
    endTime: number;
};

export class GameLogic2 {
    private config: GameLogicConfig;
    private stateP: GameState;
    private tab: Tabular;
    private stringsEvent: StringsEvent;
    private scoreP: number;
    private playContext: PlayContext;

    private callbackFuntions: FunctionArray;

    constructor(tab: Tabular, config: GameLogicConfig) {
        this.tab = tab;
        this.config = config;
        
        this.scoreP = 0;
        this.stateP = GameState.end;
        this.stringsEvent = [[], [], [], [], [], []];
        this.playContext = {
            startTime: 0,
            triggeredEvent: [[], [], [], [], [], []],
            endTime: 0
        };

        let eventTypes = ["start", "end", "perfect", "good", "miss"];
        this.callbackFuntions = new FunctionArray(eventTypes);
    }

    public on(ename: string, cbk: (arg: any) => void): void {
        if(this.callbackFuntions[ename]!=undefined) {
            this.callbackFuntions[ename].push(cbk);
        }
    }

    public reset(startTime: number): void {
        this.scoreP = 0;
        this.stateP = GameState.end;
        this.playContext = {
            startTime: startTime,
            triggeredEvent: [[], [], [], [], [], []],
            endTime: startTime
        };

        let onset = 0;
        this.stringsEvent = [[], [], [], [], [], []];
        for(let i=0; i<this.tab.sections.length; i++) {
            const section = this.tab.sections[i];
            for(let j=0; j<section.notes.length; j++) {
                const note = section.notes[j];
                if(note instanceof Note) {
                    for(let k=0; k<note.positions.length; k++) {
                        const position = note.positions[k];
                        this.stringsEvent[position.stringID-1].push(
                            {onsetTime: onset, fretID: position.fretID, note: note}
                        );
                        
                    }
                }
                // 4 = 1 beat
                onset += 4 / note.duration * 60/this.config.bpm;
            }
        }
        this.playContext.endTime += onset;

        for(let i=0; i<6; i++) {
            this.playContext.triggeredEvent[i] = Array(this.stringsEvent[i].length).fill(false);
        }
    }

    public start(elapsedTime: number): void {
        if(this.stateP == GameState.end) {
            this.reset(elapsedTime);
            
            this.callbackFuntions["start"].forEach((func) => func());
            this.stateP = GameState.playing;

        }
    }

    public update(elapsedTime: number): void {
        // abstraction
        if(elapsedTime >= this.playContext.endTime) {
            this.callbackFuntions["end"].forEach((func) => func());
            this.stateP = GameState.end;
        }
    }

    public hit(positions: Array<{stringID: number, fretID: number}>, elapsedTime: number): void {
        if(this.stateP != GameState.playing)
            return;
        
        let i=0, j=0;
        const validDuration = this.config.validDuration;
        for(; i<positions.length; i++) {
            const stringEvent = this.stringsEvent[positions[i].stringID-1];
            for(; j<stringEvent.length; j++) {
                const x = stringEvent[j];
                if(Math.abs(x.onsetTime - (elapsedTime-this.playContext.startTime))<=validDuration) {
                    if(this.playContext.triggeredEvent[positions[i].stringID-1][j]==false)
                        if(x.fretID == positions[i].fretID) 
                            break;
                }
            }

            if(j<stringEvent.length) {
                this.playContext.triggeredEvent[positions[i].stringID-1][j]=true;
                // fire perfect event
                this.callbackFuntions["perfect"].forEach((func) => func(positions[i].stringID));
                this.scoreP += 10;
            }

        }
        
    }

    get nowState(): GameState {
        return this.stateP;
    }

    get score(): number {
        return this.scoreP;
    }
}

export class GameLogic {
    private fb: FingerBoard;
    private state: GameState;
    private startStamp: number;
    private tab: Tabular;
    private bpm: number;
    private range: number;
    private noteList: Array<NoteLogic | RestLogic>;
    private checkIndex: number;
    private resultList: Array<number>;
    private inputList: Array<{note: NoteLogic, score: number}>;
    private scoreP: number;
    private renderer: TestRenderer;

    private callbackFuntions: FunctionArray;

    constructor(fb: FingerBoard, c: CanvasRenderingContext2D, tab: Tabular, config: {fps: number, bpm: number, range: number}) {
        this.fb = fb;
        this.renderer = new TestRenderer(c, config.fps, config.bpm);
        this.state = GameState.end;
        this.renderer.init();
        this.startStamp = -1;
        this.tab = tab;
        this.bpm = config.bpm;
        this.range = 4/config.range;
        this.noteList = new Array<NoteLogic | RestLogic>();
        this.checkIndex = 0;
        this.resultList = new Array<number>();
        this.inputList = new Array<{note: NoteLogic, score: number}>();
        this.scoreP = 0;
        

        let eventTypes = new Array<string>();
        eventTypes.push("end");
        eventTypes.push("perfect");
        eventTypes.push("good");
        this.callbackFuntions = new FunctionArray(eventTypes);
    }

    public on(ename: string, cbk: (arg: any) => void): void {
        if(this.callbackFuntions[ename]!=undefined) {
            this.callbackFuntions[ename].push(cbk);
        }
    }

    private onGameEnd(): void {
        this.callbackFuntions["end"].forEach(func => {
            func();
        });
    }


    private makeNoteList(tab: Tabular) {

        this.noteList = [];
        let tmp = [];
        let beatCnt = 0;
        
        // flat notes
        for(let i=0; i<tab.sections.length; i++) {
            for(let j=0; j<tab.sections[i].notes.length; j++) {
                tmp.push(tab.sections[i].notes[j]);
            }
        }

        // no first beat...
        tmp[0].duration = 4/3;

        for(let k=0; k<tmp.length; k++) {
            const beats = 1/(tmp[k].duration/4);
            let n;
            if(tmp[k] instanceof Note) {
                n = new NoteLogic(<Note>tmp[k], beatCnt);
            }
            else if(tmp[k] instanceof Rest) {
                n = new RestLogic(<Rest>tmp[k], beatCnt);
            }
            if(n != undefined)
                this.noteList.push(n);
            beatCnt += beats;
        }

        this.noteList.shift();
    }

    get score(): number {
        return this.scoreP;
    }


    public StartGame() {
        
        if(this.state == GameState.end) {
            this.state = GameState.playing;
            this.startStamp = Date.now();
            this.checkIndex = 0;
            this.makeNoteList(this.tab);
            this.resultList = [];
            this.noteList.forEach(() => {
                this.resultList.push(0);
            });
            this.inputList = [];
            this.scoreP = 0;
        }
    }

    public StartReplay() {
        
        if(this.state == GameState.end) {
            this.state = GameState.replaying;
            this.startStamp = Date.now();
            this.checkIndex = 0;
            this.makeNoteList(this.tab);
            this.inputList.forEach(element => {
                element.note.state = NoteState.hidden;
            });
            this.scoreP = 0;
        }
    }

    public Update() {
        if(this.state != GameState.end) {

            let timer = Date.now() - this.startStamp;
            this.noteList.forEach(n => {
                
                // spawn notes
                if(n.state == NoteState.hidden && n.birthTime*(60/this.bpm*1000) <= timer) {
                    n.state = NoteState.shown;
                }

                // remove showing notes
                else if(n.state == NoteState.shown && n.x < 5) {
                    n.state = NoteState.die;
                }
            });
                
            // Draw notes & scores
            this.renderer.draw(this.noteList, this.score);

            // find unchecked note, check correctness
            const beats = timer/1000 * this.bpm / 60;
            const n = this.noteList[this.checkIndex];
            if(beats - (n.birthTime+1) > this.range) {
                if(n instanceof Note) {
                    if(this.state == GameState.playing) {
                        this.resultList[this.checkIndex] = 0;
                        n.corrects.forEach(element => {
                            if(element) {
                                this.resultList[this.checkIndex]++;
                            }
                        });
                    }

                    if(this.resultList[this.checkIndex] == n.positions.length) {
                        // TODO: call notify(index, "perfect");
                        //
                        console.log("perfect");
                        this.scoreP += 10;
                        this.callbackFuntions["perfect"].forEach(func => {
                            func(n.parent);
                        });
                    }
                    else if(this.resultList[this.checkIndex] != 0) {
                        // TODO: call notify(index, "good");
                        //
                        console.log("good");
                        this.scoreP += this.resultList[this.checkIndex];
                        this.callbackFuntions["good"].forEach(func => {
                            func(n.parent);
                        });
                    }
                }
                
                this.checkIndex++;
                if(this.checkIndex == this.noteList.length)
                    this.checkIndex -= 1;
            }

            // Replay
            if(this.state == GameState.replaying)
                this.replayFingerBoard(timer);
            
            // if no note, end game
            let noNote = true;
            this.noteList.forEach(n => {
                if(n.state == NoteState.hidden || n.state == NoteState.shown)
                    noNote = false;
            });
            if(noNote) {
                this.state = GameState.end;
                this.onGameEnd();
            }
        }
    }

    private replayFingerBoard(timer: number) {

        for(let i=0; i<this.inputList.length; i++) {
            let input = this.inputList[i];
            if(input.note.state == NoteState.hidden && input.note.birthTime*(60/this.bpm*1000) <= timer) {
                input.note.state = NoteState.shown;
                this.scoreP += this.inputList[i].score;
                let n = input.note as Note;
                if(n != undefined) {
                    n.positions.forEach(element => {
                        this.fb.press(this.fb.fretPressPointIndex(element.stringID, element.fretID));
                        this.fb.pick(element.stringID);
                        setTimeout(() => {
                            this.fb.unpress(this.fb.fretPressPointIndex(element.stringID, element.fretID));
                        }, 300);
                    });
                }
            }
        }
    }

    private findBound(beat:number, u: number, l: number): number {
        while(l+1 != u) {
            const mid = Math.floor((u+l)/2);
            if(this.noteList[mid].birthTime + 1/(this.noteList[mid].duration/4) > beat) {
                u = mid;
            }
            else if(this.noteList[mid].birthTime + 1/(this.noteList[mid].duration/4) < beat) {
                l = mid;
            }
            else {
                return mid;
            }
        }
        return l;
    }

    public Hit(note: {stringID: number, fretID: number}, seconds: number) {
        // check this hit correteness
        const check = (ans: NoteLogic | RestLogic, beats: number, note:{stringID: number, fretID: number}) => {
            let include = false;

            // hit timing & is it note?
            if(Math.abs((ans.birthTime + 1) - beats) >= this.range || ans instanceof Rest)
                return false;
    
            // hit right string & fret?
            if(ans instanceof NoteLogic) {
                for(let j=0; j<ans.positions.length; j++) {
                    if(ans.positions[j].stringID == note.stringID && ans.positions[j].fretID == note.fretID) {
                        include = true;
                        ans.corrects[j] = true;
                        break;
                    }
                }
            }
            return include;
        };
        const beats = seconds * this.bpm / 60;
        let correct = false;

        // variable of hit timing & +-score
        const positions: Array<{stringID: number, fretID: number}> = [];
        positions.push({stringID: note.stringID, fretID: note.fretID});
        let n = new NoteLogic(new Note(positions, 4), seconds * (this.bpm / 60));
        let s = 0;

        let target: NoteLogic | RestLogic;
        let upper = this.noteList.length-1, lower = 0;
        const firstNote = this.noteList[0];
        const lastNote = this.noteList[upper];
        
        // check hit before first note
        if(firstNote.birthTime+1 > beats) {
            if(check(firstNote, beats, note)) {
                correct = true;
                // TODO: call notify(0, "perfect")
            }
        }

        // check hit after last note
        else if(lastNote.birthTime+1 < beats) {
            if(check(lastNote, beats, note)) {
                correct = true;
                // TODO: call notify(upper, "perfect")
            }
        }

        // check hit between two notes
        else {
            let lowIdx = this.findBound(beats, upper, lower);
            const lowNote = this.noteList[lowIdx], upNote = this.noteList[lowIdx+1];
            if(beats - (lowNote.birthTime + 1) < (upNote.birthTime + 1) - beats) {
                console.log("close lower bound");
                target = lowNote;
            }
            else {
                console.log("close upper bound");
                target = upNote;
            }
            if(check(target, beats, note)) {
                correct = true;
            }
        }

        if(!correct)
            s = -1;
        this.scoreP += s;

        // Recored hit info
        this.inputList.push({note: n, score: s});
    }

    public get nowState(): GameState {
        return this.state;
    }

    public get notelist(): Array<NoteLogic | RestLogic> {
        return this.noteList;
    }
}

const xmlns = "http://www.w3.org/2000/svg";

export class SVGRenderer {
    private domElementP: SVGSVGElement;
    private tabularGroup: SVGGElement;
    private symbolsGroup: SVGGElement;
    private tabular: Tabular;
    private bpm: number;
    private validDuration: number;
    //private tabDuration: number;
    private interval: number = 40;
    private hitbox: SVGRectElement;
    constructor(config: {width: string, height: string, bpm: number, validDuration: number}, tabular: Tabular) {
        this.bpm = config.bpm;
        this.validDuration = config.validDuration;
        this.tabular = tabular;

        this.domElementP = document.createElementNS(xmlns, "svg");
        this.domElementP.setAttribute("width", `${config.width}`);
        this.domElementP.setAttribute("height", `${config.height}`);
        this.tabularGroup = document.createElementNS(xmlns, "g");
        this.symbolsGroup = document.createElementNS(xmlns, "g");
        this.tabularGroup.setAttribute("style", "transform: translate(0, 3vh)");
        this.domElementP.appendChild(this.tabularGroup);

        // generate six lines:
        const string_interval = 4;
        for(let i=0; i<6; i++) {
            let line = document.createElementNS(xmlns, "line");
            line.setAttribute("x1", "0vw");
            line.setAttribute("y1", `${i*string_interval}vh`);
            line.setAttribute("x2", "100vw");
            line.setAttribute("y2", `${i*string_interval}vh`);
            line.classList.add("string");
            this.tabularGroup.appendChild(line);
        }

        // vertical hit box
        this.hitbox = document.createElementNS(xmlns, "rect");
        this.hitbox.setAttribute("style", `transform: translate(${10-this.interval*1/(this.validDuration)}vw, 0vh)`);
        this.hitbox.setAttribute("width", `${this.interval*1/(this.validDuration/2)}vw`);
        this.hitbox.setAttribute("height", `${string_interval*5}vh`);
        this.hitbox.classList.add("hitbox");
        this.tabularGroup.appendChild(this.hitbox);

        let line = document.createElementNS(xmlns, "line");
        line.setAttribute("x1", "10vw");
        line.setAttribute("y1", "0vh");
        line.setAttribute("x2", "10vw");
        line.setAttribute("y2", `${string_interval*5}vh`);
        line.classList.add("scanline");
        this.tabularGroup.appendChild(line);

        this.tabularGroup.setAttribute("style", `transform: translate(0px, 10px) scale(1);`);

        let dx = 10;

        // draw note
        for(let i=0; i<this.tabular.sections.length; i++) {
            const section = this.tabular.sections[i];
            for(let j=0; j<section.notes.length; j++) {
                
                const note = section.notes[j];

                if(note instanceof Note) {
                    /*if(note.positions.length>1) {
                        const validArea = document.createElementNS(xmlns, "rect");
                        validArea.classList.add("valid-area");
                        validArea.setAttribute("style", `transform: translate(${dx-this.interval*1/this.validDuration}vw, 0vh)`);
                        validArea.setAttribute("width", `${this.interval*1/(this.validDuration/2)}vw`);
                        validArea.setAttribute("height", `${string_interval*5}vh`);
                        this.symbolsGroup.appendChild(validArea);
                    }*/
                    const link = note.positions.length>1;
                    const result = note.positions.reduce((result, obj) => {
                        if (obj.stringID < result[0]) result[0] = obj.stringID;
                        if (obj.stringID > result[1]) result[1] = obj.stringID;
                        return result;
                    }, [Number.MAX_VALUE, Number.MIN_VALUE]);
                    
                    if(link) {
                        console.log(result);
                        let line = document.createElementNS(xmlns, "line");
                        line.setAttribute("x1", `${dx}vw`);
                        line.setAttribute("y1", `${(result[0]-1)*string_interval}vh`);
                        line.setAttribute("x2", `${dx}vw`);
                        line.setAttribute("y2", `${(result[1]-1)*string_interval}vh`);
                        line.classList.add("link");
                        this.symbolsGroup.appendChild(line);
                    }
                    for(let k=0; k<note.positions.length; k++) {
                    
                        const position = note.positions[k];
                        const noteg = document.createElementNS(xmlns, "g");
                        
                        
                        noteg.setAttribute("style", `transform: translate(${dx}vw, ${(position.stringID-1)*string_interval}vh)`);
                        const circle = document.createElementNS(xmlns, "circle");
                        circle.setAttribute("r", `${string_interval/2.5}vh`);
                        circle.classList.add("note-bg-circle");
                        if(link)
                            circle.classList.add("note-link-border");
                        noteg.appendChild(circle);
                        

                        const text = document.createElementNS(xmlns, "text");
                        text.innerHTML = `${position.fretID}`;
                        text.setAttribute("alignment-baseline", "central");
                        text.setAttribute("text-anchor", "middle");
                        text.classList.add("note-fret");
                        noteg.appendChild(text);
                        this.symbolsGroup.appendChild(noteg);
                    }
                }
                dx += this.interval*1/note.duration;
            }
        }
        this.tabularGroup.appendChild(this.symbolsGroup);
        // beats
        // TODO: remove this hard coded "4"
        //this.tabDuration = dx / this.interval * 4;
    }

    public get domElement(): SVGSVGElement {
        return this.domElementP;
    }

    public play(): void {
        this.symbolsGroup.setAttribute("style", `transform: translate(-100vw, 0); transition: 10s;`);
    }

    public setTime(seconds: number): void {
        const beats = seconds * this.bpm / 60;
        // console.log(Math.floor(beats));
        this.symbolsGroup.setAttribute("style", `transform: translate(${-beats/4*this.interval}vw, 0);`);
    }

    public fireHitEvent(): void {
        this.hitbox.classList.add("fire-hit-animation")
        const newone = this.hitbox.cloneNode(true) as SVGRectElement;
        if(this.hitbox.parentNode != null) {
            this.hitbox.parentNode.replaceChild(newone, this.hitbox);
            this.hitbox = newone;
        }
        
        
    }
}


class TestRenderer {
    private cxt: CanvasRenderingContext2D;
    private updateInterval: number;    
    private bpm: number;
  
    constructor(c: CanvasRenderingContext2D, fps: number, bpm: number) {
      this.cxt = c;
      this.bpm = bpm;
      this.updateInterval = 1/fps;
    }
  
    public init(): void
    {
      // draw hit area
      this.cxt.beginPath();
      this.cxt.arc(100, 100, 20, 0, 2 * Math.PI);
      this.cxt.stroke();
  
      // draw six strings...
    }
  
    public draw(showList: Array<NoteLogic | RestLogic>, score: number): void {


      this.cxt.clearRect(0,0,(<HTMLCanvasElement>this.cxt.canvas).width,(<HTMLCanvasElement>this.cxt.canvas).height);
      // draw hit area
      //this.cxt.beginPath();
      //this.cxt.arc(100, 100, 20, 0, 2 * Math.PI);
      //this.cxt.stroke();
      showList.forEach(element => {
        // draw
        if(element.state == NoteState.shown) {
            if(element instanceof NoteLogic) {
                this.cxt.fillStyle = "#c82124";
            }
            else if(element instanceof RestLogic) {
                this.cxt.fillStyle = "#3370d4";
            }
            /*
            this.cxt.beginPath();
            this.cxt.arc(element.x, 100, 10, 0, 2 * Math.PI);
            this.cxt.closePath();
            this.cxt.fill();
    */
            element.x -= (this.bpm/60)*970*this.updateInterval;
        }
        
      });

      // scores
      this.cxt.font = "30px Arial";
      this.cxt.fillStyle = "#c82124";
      this.cxt.fillText(`Score: ${score}`, 10, 50);
    }
  }
  