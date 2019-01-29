import { Tabular, Note, Rest } from "../common/Tabular";
import { FingerBoard } from "./FingerBoard";

class NoteLogic extends Note {
    public birthTime: number;    // change to beats
    public x: number;
    public state: number;
    constructor(note: Note, birth: number) {
        super(note.positions, note.duration)
        this.birthTime = birth;
        this.x = 1070;
        this.state = NoteState.hidden;
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

export class GameLogic {
    private fb: FingerBoard;
    private renderer: TestRenderer;
    private state: GameState;
    private startStamp: number;
    private tab: Tabular;
    private bpm: number;
    private noteList: Array<NoteLogic | RestLogic>;
    private resultList: Array<NoteState>;
    private inputList: Array<{note: NoteLogic, score: number}>;
    private score: number;

    private callbackFuntions: FunctionArray;

    constructor(fb: FingerBoard, c: CanvasRenderingContext2D, tab: Tabular, config: {fps: number, bpm: number}) {
        this.fb = fb;
        this.renderer = new TestRenderer(c, config.fps, config.bpm);
        this.state = GameState.end;
        this.renderer.init();
        this.startStamp = -1;
        this.tab = tab;
        this.bpm = config.bpm;
        this.noteList = new Array<NoteLogic | RestLogic>();
        this.resultList = new Array<NoteState>();
        this.inputList = new Array<{note: NoteLogic, score: number}>();
        this.score = 0;

        let eventTypes = new Array<string>();
        eventTypes.push("end");
        this.callbackFuntions = new FunctionArray(eventTypes);
    }

    public on(ename: string, cbk: (arg: any) => void): void {
        if(ename=="end") {
            this.callbackFuntions["end"].push(cbk);
        }
    }

    private onGameEnd(): void {
        this.callbackFuntions["end"].forEach(func => {
            func();
        });
    }

    private makeNoteList(tab: Tabular) {

        this.noteList = [];

        let beatCnt = -1;
        for(let i=0; i<tab.sections.length; i++) {
            for(let j=0; j<tab.sections[i].notes.length; j++) {
            const beats = 1/(tab.sections[i].notes[j].duration/4);
            let n;
            if(tab.sections[i].notes[j] instanceof Note) {
                n = new NoteLogic(<Note>tab.sections[i].notes[j], beatCnt);
            }
            else if(tab.sections[i].notes[j] instanceof Rest) {
            n = new RestLogic(<Rest>tab.sections[i].notes[j], beatCnt);
            }
            beatCnt += beats;
            if(n != undefined)
                this.noteList.push(n);
            }
        }
        this.noteList[0].x = 100;
    }

    public StartGame() {
        
        if(this.state == GameState.end) {
            this.state = GameState.playing;
            this.startStamp = Date.now();
            this.makeNoteList(this.tab);
            this.resultList = [];
            this.noteList.forEach(() => {
                this.resultList.push(NoteState.shown);
            });
            this.inputList = [];
            this.score = 0;
        }
    }

    public StartReplay() {
        
        if(this.state == GameState.end) {
            this.state = GameState.replaying;
            this.startStamp = Date.now();
            this.makeNoteList(this.tab);
            this.inputList.forEach(element => {
                element.note.state = NoteState.hidden;
            });
            this.score = 0;
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
                
            // Draw notes & scores
            this.renderer.draw(this.noteList, this.score);

            // Replay
            if(this.state == GameState.replaying)
                this.replay(timer);
        }
    }

    private replay(timer: number) {

        for(let i=0; i<this.inputList.length; i++) {
            let nl = this.inputList[i];
            if(nl.note.state == NoteState.hidden && nl.note.birthTime*(60/this.bpm*1000) <= timer) {
                nl.note.state = NoteState.shown;
                this.score += this.inputList[i].score;
                let n = nl.note as Note;
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

    private foundBound(beat:number, u: number, l: number): number {
        while(l+1 != u) {
            const mid = Math.floor((u+l)/2);
            if(this.noteList[mid].birthTime / (this.noteList[mid].duration/4) > beat) {
                u = mid;
            }
            else if(this.noteList[mid].birthTime / (this.noteList[mid].duration/4) < beat) {
                l = mid;
            }
            else {
                return mid;
            }
        }
        return l;
    }

    public Hit(note: Note, seconds: number) {
        let ans, i;
        for(i=0; i<this.noteList.length; i++) {
            if(this.noteList[i].state == NoteState.shown) {
                ans = this.noteList[i];
                break;
            }
        }

        if(this.state == GameState.playing) {

            
            // variable of hit timing & +-score
            let n = new NoteLogic(note, seconds * (this.bpm / 60));
            let s = 0;
            

            let right = false;
            // Detect hit or not, and right or wrong
            if(ans instanceof NoteLogic && ans.positions.length == note.positions.length) {
                right = true;
                for(let j=0; j<note.positions.length; j++) {
                    if(note.positions[j].stringID != ans.positions[j].stringID || note.positions[j].fretID != ans.positions[j].fretID) {
                        right = false;
                    }
                }
            }

            if(right) {
                const beats = seconds * this.bpm / 60 -1;
                let upper = this.noteList.length-1, lower = 0;

                const upperNote = this.noteList[upper];
                if(upperNote.birthTime / (upperNote.duration/4) < beats) {
                    if(Math.abs(upperNote.birthTime / (upperNote.duration/4)) < 0.5) {
                        if(upperNote instanceof Note) {
                            this.score += 10;
                        }
                    }
                }
                else {
                    const idx = this.foundBound(beats, upper, lower);
                    const lowNote = this.noteList[idx], upNote = this.noteList[idx+1];
                    if(beats - lowNote.birthTime / (upperNote.duration/4) < upNote.birthTime / (upperNote.duration/4) - beats) {
                        console.log("close lower bound");
                        if(Math.abs(beats - lowNote.birthTime / (lowNote.duration/4)) < 0.0625 && lowNote instanceof Note) {
                            s = 10;
                            this.resultList[i] = NoteState.perfect;
                        }
                    }
                    else {
                        console.log("close upper bound");
                        if(Math.abs(upNote.birthTime / (upNote.duration/4) - beats) < 0.1 && upNote instanceof Note) {
                            s = 10;
                            this.resultList[i] = NoteState.perfect;
                        }
                    }
                }
            }

            if(this.resultList[i] != NoteState.perfect)
                s = -1;
            this.score += s;

            // Recored hit info
            this.inputList.push({note: n, score: s});

        }
        else if(this.state == GameState.replaying) {
            this.noteList[i].state = this.resultList[i];
        }
    }

    public get nowState(): GameState {
        return this.state;
    }
}

const xmlns = "http://www.w3.org/2000/svg";

export class SVGRenderer {
    private domElementP: SVGSVGElement;
    private tabularGroup: SVGGElement;
    private symbolsGroup: SVGGElement;
    private tabular: Tabular;
    private bpm: number;
    //private tabDuration: number;
    private interval: number = 40;
    constructor(config: {width: string, height: string, bpm: number}, tabular: Tabular) {
        this.bpm = config.bpm;
        this.tabular = tabular;

        this.domElementP = document.createElementNS(xmlns, "svg");
        this.domElementP.setAttribute("width", `${config.width}`);
        this.domElementP.setAttribute("height", `${config.height}`);
        this.tabularGroup = document.createElementNS(xmlns, "g");
        this.symbolsGroup = document.createElementNS(xmlns, "g");
        this.domElementP.appendChild(this.tabularGroup);

        // generate six lines:
        for(let i=0; i<6; i++) {
            let line = document.createElementNS(xmlns, "line");
            line.setAttribute("x1", "0vw");
            line.setAttribute("y1", `${i*2}vh`);
            line.setAttribute("x2", "100vw");
            line.setAttribute("y2", `${i*2}vh`);
            line.classList.add("string");
            this.tabularGroup.appendChild(line);
        }

        this.tabularGroup.setAttribute("style", `transform: translate(0px, 10px) scale(1);`);

        let dx = 0;
        // draw note
        for(let i=0; i<this.tabular.sections.length; i++) {
            const section = this.tabular.sections[i];
            for(let j=0; j<section.notes.length; j++) {
                
                const note = section.notes[j];

                if(note instanceof Note) {
                    for(let k=0; k<note.positions.length; k++) {
                    
                        const position = note.positions[k];
                        const noteg = document.createElementNS(xmlns, "g");
                        noteg.setAttribute("style", `transform: translate(${dx}vw, ${(position.stringID-1)*2}vh)`);
                        const circle = document.createElementNS(xmlns, "circle");
                        circle.setAttribute("r", `5`);
                        circle.classList.add("note-bg-circle");

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
      this.cxt.beginPath();
      this.cxt.arc(100, 100, 20, 0, 2 * Math.PI);
      this.cxt.stroke();
      
      showList.forEach(element => {
        // draw
        if(element.state == NoteState.shown) {
            if(element instanceof NoteLogic) {
                this.cxt.fillStyle = "#c82124";
            }
            else if(element instanceof RestLogic) {
                this.cxt.fillStyle = "#3370d4";
            }
            this.cxt.beginPath();
            this.cxt.arc(element.x, 100, 10, 0, 2 * Math.PI);
            this.cxt.closePath();
            this.cxt.fill();
    
            element.x -= (this.bpm/60)*970*this.updateInterval;
        }
        
      });

      // scores
      this.cxt.font = "30px Arial";
      this.cxt.fillStyle = "#c82124";
      this.cxt.fillText(`Score: ${score}`, 10, 50);
    }
  }