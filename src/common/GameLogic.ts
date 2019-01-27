import { Tabular, Note, Rest } from "../common/Tabular";
import { FingerBoard } from "./FingerBoard";

class NoteLogic extends Note {
    public birthTime: number
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
    private noteList: Array<NoteLogic | RestLogic>;
    private leadNote: number;
    private resultList: Array<NoteState>;
    private inputList: Array<NoteLogic | RestLogic>;
    private score: number;

    private callbackFuntions: FunctionArray;

    constructor(fb: FingerBoard, c: CanvasRenderingContext2D, tab: Tabular, fps: number) {
        this.fb = fb;
        this.renderer = new TestRenderer(c, fps);
        this.state = GameState.end;
        this.renderer.init();
        this.startStamp = -1;
        this.tab = tab;
        this.noteList = new Array<NoteLogic | RestLogic>();
        this.leadNote = -1;
        this.resultList = new Array<NoteState>();
        this.inputList = new Array<NoteLogic | RestLogic>();
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

        let timeCnt = 0;
        for(let i=0; i<tab.sections.length; i++) {
            for(let j=0; j<tab.sections[i].notes.length; j++) {
            const duration = 1/(tab.sections[i].notes[j].duration/4);
            let n;
            if(tab.sections[i].notes[j] instanceof Note) {
                n = new NoteLogic(<Note>tab.sections[i].notes[j], timeCnt);
            }
            else if(tab.sections[i].notes[j] instanceof Rest) {
            n = new RestLogic(<Rest>tab.sections[i].notes[j], timeCnt);
            }
            timeCnt += duration*1000;
            if(n != undefined)
                this.noteList.push(n);
            }
        }
    }

    public StartGame() {
        
        if(this.state == GameState.end) {
            this.state = GameState.playing;
            this.startStamp = Date.now();
            this.makeNoteList(this.tab);
            this.leadNote = -1;
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
            this.leadNote = -1;
            this.inputList.forEach(element => {
                element.state = NoteState.hidden;
            });
            this.score = 0;
        }
    }

    public Update() {
        if(this.state != GameState.end) {

            let timer = Date.now() - this.startStamp;
            let noteCnt = 0;
            this.noteList.forEach(n => {

                // find lead note
                if((this.leadNote == -1 || this.noteList[this.leadNote].state != NoteState.shown) && n.state == NoteState.shown) {
                    this.leadNote = noteCnt;
                }
                
                // spawn notes
                if(n.state == NoteState.hidden && n.birthTime <= timer) {
                    n.state = NoteState.shown;
                }

                // remove showing notes
                else if(n.state == NoteState.shown && n.x < 5) {
                    n.state = NoteState.die;
                }

                noteCnt++;
            });

            // if replaying, apply result
            if(this.leadNote != -1 && this.state == GameState.replaying && Math.abs(this.noteList[this.leadNote].x - 100) < 30) {
                this.noteList[this.leadNote].state = this.resultList[this.leadNote];
                if(this.resultList[this.leadNote] == NoteState.perfect) {
                    if(this.noteList[this.leadNote] instanceof NoteLogic) {
                        this.score += 10;
                    }
                    else if(this.noteList[this.leadNote] instanceof RestLogic) {
                        this.score -= 10;
                    }

                    // ***clear lead note index
                    this.leadNote = -1;
                }
            }
            
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
            if(nl.state == NoteState.hidden && nl.birthTime <= timer) {
                nl.state = NoteState.shown;
                let n = nl as Note;
                if(n != undefined) {
                    // this.Hit(n);
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

    public Hit(note: Note) {

        let ans, i;
        for(i=0; i<this.noteList.length; i++) {
            if(this.noteList[i].state == NoteState.shown) {
                ans = this.noteList[i];
                break;
            }
        }

        if(this.state == GameState.playing) {

            // Record
            this.inputList.push(new NoteLogic(note, Date.now() - this.startStamp));

            // Detect hit or not, and right or wrong
            let hitPoint = 100;
            if(ans != undefined && Math.abs(hitPoint-ans.x) <= 80) {
                if(ans instanceof NoteLogic && ans.positions.length == note.positions.length) {
                    let flag = true;
                    for(let j=0; j<note.positions.length; j++) {
                        if(note.positions[j].stringID != ans.positions[j].stringID || note.positions[j].fretID != ans.positions[j].fretID) {
                            flag = false;
                        }
                    }
                    if(flag) {
                        ans.state = NoteState.perfect;
                        this.resultList[i] = NoteState.perfect;
                        this.score += 10;
                    }
                }
                if(ans instanceof RestLogic) {
                    ans.state = NoteState.die;
                    this.resultList[i] = NoteState.perfect;
                    this.score -= 10;
                }
            }
        }
        else if(this.state == GameState.replaying) {
            this.noteList[i].state = this.resultList[i];
        }
    }

    public get nowState(): GameState {
        return this.state;
    }
}

class TestRenderer {
    private cxt: CanvasRenderingContext2D;
    private updateInterval: number;    
  
    constructor(c: CanvasRenderingContext2D, updateTime: number) {
      this.cxt = c;
      this.updateInterval = updateTime;
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
    
            element.x -= 1000/(1000/this.updateInterval);
        }
        
      });

      // scores
      this.cxt.font = "30px Arial";
      this.cxt.fillStyle = "#c82124";
      this.cxt.fillText(`Score: ${score}`, 10, 50);
    }
  }