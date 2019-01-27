import { Tabular, Note, Rest } from "../common/Tabular";
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

export class GameLogic {
    private renderer: TestRenderer;
    private startStamp: number;
    private fps: number;
    private noteList: Array<NoteLogic | RestLogic>;
    private showList: Array<NoteLogic | RestLogic>;
    private score: number;

    constructor(c: CanvasRenderingContext2D, tab: Tabular, fps: number) {
        this.renderer = new TestRenderer(c, fps);
        this.renderer.init();
        this.startStamp = -1;
        this.fps = fps;
        this.noteList = new Array<NoteLogic | RestLogic>();
        this.showList = new Array<NoteLogic | RestLogic>();
        this.score = 0;

        // Make note/rest list
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
            if(ans instanceof RestLogic) {
                this.showList.shift();
                this.score -= 10;
            }
        }
    }
}

const xmlns = "http://www.w3.org/2000/svg";

export class SVGRenderer {
    private domElementP: SVGSVGElement;
    private tabularGroup: SVGGElement;
    private symbolsGroup: SVGGElement;
    private tabular: Tabular;
    constructor(config: {width: string, height: string}, tabular: Tabular) {
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
            line.setAttribute("x1", "0%");
            line.setAttribute("y1", `${i*10}`);
            line.setAttribute("x2", "100%");
            line.setAttribute("y2", `${i*10}`);
            line.classList.add("string");
            this.tabularGroup.appendChild(line);
        }

        this.tabularGroup.setAttribute("style", `transform: translate(0px, 10px) scale(1.2);`);

        let dx = 0;
        // in percentage
        let interval = 10;
        // draw note
        for(let i=0; i<this.tabular.sections.length; i++) {
            const section = this.tabular.sections[i];
            for(let j=0; j<section.notes.length; j++) {
                
                const note = section.notes[j];

                if(note instanceof Note) {
                    for(let k=0; k<note.positions.length; k++) {
                    
                        const position = note.positions[k];
                        const noteg = document.createElementNS(xmlns, "g");
                        noteg.setAttribute("style", `transform: translate(${dx}vh, ${(position.stringID-1)*10}px)`);
                        const circle = document.createElementNS(xmlns, "circle");
                        circle.setAttribute("r", `3`);
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
                dx += interval*1/note.duration;


            }
        }
        this.tabularGroup.appendChild(this.symbolsGroup);
        
    }

    public get domElement(): SVGSVGElement {
        return this.domElementP;
    }

    public play(): void {
        this.symbolsGroup.setAttribute("style", `transform: translate(-100vh, 0); transition: 10s;`);
    }

    public render(): void {
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