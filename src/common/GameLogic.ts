import { Tabular, Note, Pause } from "../common/Tabular";
class NoteLogic extends Note {
    public birthTime: number
    public x: number;
    constructor(note: Note, birth: number) {
        super(note.positions, note.duration)
        this.birthTime = birth;
        this.x = 1070;
    }
};
  
class PauseLogic extends Pause {
    public birthTime: number
    public x: number;
    constructor(pause: Pause, birth: number) {
        super(pause.duration)
        this.birthTime = birth;
        this.x = 1070;
    }
};

export class GameLogic {
    private renderer: TestRenderer;
    private startStamp: number;
    private fps: number;
    private noteList: Array<NoteLogic | PauseLogic>;
    private showList: Array<NoteLogic | PauseLogic>;
    private score: number;

    constructor(c: CanvasRenderingContext2D, tab: Tabular, fps: number) {
        this.renderer = new TestRenderer(c, fps);
        this.renderer.init();
        this.startStamp = -1;
        this.fps = fps;
        this.noteList = new Array<NoteLogic | PauseLogic>();
        this.showList = new Array<NoteLogic | PauseLogic>();
        this.score = 0;

        // Make note/pause list
        let timeCnt = 0;
        for(let i=0; i<tab.sections.length; i++) {
            for(let j=0; j<tab.sections[i].notes.length; j++) {
            const duration = 1/(tab.sections[i].notes[j].duration/4);
            let n;
            if(tab.sections[i].notes[j] instanceof Note) {
                n = new NoteLogic(<Note>tab.sections[i].notes[j], timeCnt);
            }
            else if(tab.sections[i].notes[j] instanceof Pause) {
            n = new PauseLogic(<Pause>tab.sections[i].notes[j], timeCnt);
            }
            timeCnt += duration*1000;
            if(n != undefined)
                this.noteList.push(n);
            }
        }
    }

    public StartGame() {
        this.startStamp = Date.now();
        let self = this;
        setInterval(function f() {self.Update()}, self.fps);
    }

    public Update() {
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

        // Draw notes & scores
        this.renderer.draw(this.showList, this.score);
    }

    public hit(note: Note) {
        let hitPoint = 100;
        let ans = (this.showList.length != 0)? this.showList[0] : undefined;
        if(ans != undefined)
            console.log(ans.x);
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
            if(ans instanceof PauseLogic) {
                this.showList.shift();
                this.score -= 10;
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
  
    public draw(showList: Array<NoteLogic | PauseLogic>, score: number): void {

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
        else if(element instanceof PauseLogic) {
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