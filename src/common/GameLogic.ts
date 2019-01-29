import { Tabular, Note, Rest } from "../common/Tabular";
import { FingerBoard } from "./FingerBoard";

class NoteLogic extends Note {
    public birthTime: number;
    public x: number;
    public state: number;
    public corrects: Array<boolean>;
    constructor(note: Note, birth: number) {
        super(note.positions, note.duration)
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

export class GameLogic {
    private fb: FingerBoard;
    private renderer: TestRenderer;
    private state: GameState;
    private startStamp: number;
    private tab: Tabular;
    private bpm: number;
    private noteList: Array<NoteLogic | RestLogic>;
    private checkIndex: number;
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
        this.checkIndex = 0;
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
                
            // Draw notes & scores
            this.renderer.draw(this.noteList, this.score);

            // find unchecked note, check correctness
            if(this.state == GameState.playing) {
                const beats = timer/1000 * this.bpm / 60;
                const n = this.noteList[this.checkIndex];
                
                if(beats - (n.birthTime+1) > 0.125) {

                    if(n instanceof Note) {
                        let correct = 0;
                        n.corrects.forEach(element => {
                            if(element) {
                                correct++;
                            }
                        });

                        if(correct == n.positions.length) {
                            // TODO: call notify(index, "perfect");
                            //
                            console.log("perfect");
                        }
                        else if(correct != 0) {
                            // TODO: call notify(index, "good");
                            //
                            console.log("good");
                        }
                    }
                    
                    this.checkIndex++;
                    if(this.checkIndex == this.noteList.length)
                        this.checkIndex -= 1;
                }
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
                this.score += this.inputList[i].score;
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

        const beats = seconds * this.bpm / 60;
        let correct = false;

        // variable of hit timing & +-score
        const positions: Array<{stringID: number, fretID: number}> = [];
        positions.push({stringID: note.stringID, fretID: note.fretID});
        let n = new NoteLogic(new Note(positions, 4), seconds * (this.bpm / 60));
        let s = 0;

        let upper = this.noteList.length-1, lower = 0;
        const firstNote = this.noteList[0];
        const lastNote = this.noteList[upper];
        
        // check hit before first note
        if(firstNote.birthTime+1 > beats) {
            if(check(firstNote)) {
                correct = true;
                // TODO: call notify(0, "perfect")
            }
        }

        // check hit after last note
        else if(lastNote.birthTime+1 < beats) {
            if(check(lastNote)) {
                correct = true;
                // TODO: call notify(upper, "perfect")
            }
        }

        // check hit between two notes
        else {
            let lowIdx = this.findBound(beats, upper, lower);
            const lowNote = this.noteList[lowIdx], upNote = this.noteList[lowIdx+1];
            let targetNote;
            if(beats - (lowNote.birthTime + 1) < (upNote.birthTime + 1) - beats) {
                console.log("close lower bound");
                targetNote = lowNote;
            }
            else {
                console.log("close upper bound");
                targetNote = upNote;
            }
            if(check(targetNote)) {
                correct = true;
            }
        }

        if(!correct)
            s = -1;
        this.score += s;

        // Recored hit info
        this.inputList.push({note: n, score: s});

        // check this hit correteness
        function check(ans: NoteLogic | RestLogic): boolean {
            let include = false;

            // hit timing & is it note?
            if(Math.abs((ans.birthTime + 1) - beats) >= 0.125|| ans instanceof Rest)
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
        }
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
    constructor(config: {width: string, height: string, bpm: number, validDuration: number}, tabular: Tabular) {
        this.bpm = config.bpm;
        this.validDuration = config.validDuration;
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
                    const validArea = document.createElementNS(xmlns, "rect");
                    validArea.classList.add("valid-area");
                    validArea.setAttribute("style", `transform: translate(${dx-this.interval*1/this.validDuration}vw, 0vh)`);
                    validArea.setAttribute("width", `${this.interval*1/(this.validDuration/2)}vw`);
                    validArea.setAttribute("height", `10vh`);
                    this.symbolsGroup.appendChild(validArea);
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