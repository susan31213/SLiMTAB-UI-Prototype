import { Tabular, Note, Rest } from "../common/Tabular";
import { FingerBoard } from "./FingerBoard";

class NoteLogic extends Note {
    public birthTime: number
    public x: number;
    constructor(note: Note, birth: number) {
        super(note.positions, note.duration)
        this.birthTime = birth;
        this.x = 1070;
    }
};
  
class RestLogic extends Rest {
    public birthTime: number
    public x: number;
    constructor(rest: Rest, birth: number) {
        super(rest.duration)
        this.birthTime = birth;
        this.x = 1070;
    }
};

enum GameState {
    playing,
    end,
    replaying
};

export class GameLogic {
    private fb: FingerBoard;
    private renderer: TestRenderer;
    private state: GameState;
    private startStamp: number;
    // private fps: number;
    private tab: Tabular;
    private noteList: Array<NoteLogic | RestLogic>;
    private showList: Array<NoteLogic | RestLogic>;
    private recordList: Array<NoteLogic | RestLogic>;
    private score: number;

    constructor(fb: FingerBoard, c: CanvasRenderingContext2D, tab: Tabular, fps: number) {
        this.fb = fb;
        this.renderer = new TestRenderer(c, fps);
        this.state = GameState.end;
        this.renderer.init();
        this.startStamp = -1;
        // this.fps = fps;
        this.tab = tab;
        this.noteList = new Array<NoteLogic | RestLogic>();
        this.showList = new Array<NoteLogic | RestLogic>();
        this.recordList = new Array<NoteLogic | RestLogic>();
        this.score = 0;
    }

    private makeNoteList(tab: Tabular) {

        this.noteList = [];
        this.showList = [];

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
            this.makeNoteList(this.tab);
            this.recordList = [];
            this.startStamp = Date.now();
            this.score = 0;
        }
    }

    public StartReplay() {
        
        if(this.state == GameState.end) {
            this.state = GameState.replaying;
            this.startStamp = Date.now();
            this.makeNoteList(this.tab);
        }
    }

    public Update() {
        if(this.state != GameState.end) {
            this.play();
        }
    }

    private play() {
        let timer = Date.now() - this.startStamp;
        // spawn notes
        if(this.noteList.length != 0 && this.noteList[0].birthTime <= timer) {
            let n = this.noteList.shift();
            if(n != undefined)
                this.showList.push(n);
        }
  
        // remove showing notes
        this.showList.forEach(element => {
            if(element.x < 5) {
                this.showList.shift();
            }
        });

        // if no note, end game
        if(this.noteList.length == 0 && this.showList.length == 0) {
            this.state = GameState.end;
        }
            
        // Draw notes & scores
        this.renderer.draw(this.showList, this.score);

        // Replay
        if(this.state == GameState.replaying)
            this.replay(timer);
    }

    private replay(timer: number) {
        if(this.recordList.length != 0 && this.recordList[0].birthTime <= timer) {
            let n = this.recordList.shift() as Note;
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

    public Hit(note: Note) {

        if(this.state == GameState.playing) {

            // Record
            this.recordList.push(new NoteLogic(note, Date.now() - this.startStamp));

            // Detect hit or not, and right or wrong
            let hitPoint = 100;
            let ans = (this.showList.length != 0)? this.showList[0] : undefined;
            if(ans != undefined && Math.abs(hitPoint-ans.x) <= 50) {
                if(ans instanceof NoteLogic && ans.positions.length == note.positions.length) {
                    let flag = true;
                    for(let i=0; i<note.positions.length; i++) {
                        if(note.positions[i].stringID != ans.positions[i].stringID || note.positions[i].fretID != ans.positions[i].fretID) {
                            flag = false;
                        }
                    }
                    if(flag) {
                        this.showList.shift();
                        this.score += 10;
                    }
                }
                if(ans instanceof RestLogic) {
                    this.showList.shift();
                    this.score -= 10;
                }
            }
        }
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
      // draw six strings...
  
      
      showList.forEach(element => {
        // draw
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
      });

      // scores
      this.cxt.font = "30px Arial";
      this.cxt.fillStyle = "#c82124";
      this.cxt.fillText(`Score: ${score}`, 10, 50);
    }
  }