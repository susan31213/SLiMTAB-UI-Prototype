export class FingerTab {

    canvas: HTMLCanvasElement;
    canvasWidth: number;    
    canvasHeight: number;
    chordNumber: number;

    constructor(cw: number, ch: number, chNum: number) {

        this.canvasWidth = cw;
        this.canvasHeight = ch;
        this.chordNumber = chNum;

        // Draw canvas and get by id
        document.write(`<canvas id="myCanvas" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>`)
        this.canvas = <HTMLCanvasElement>document.getElementById("myCanvas");
    }

    draw() {
        // Draw chord lines
        var ctx = this.canvas.getContext("2d");
        if(ctx !==null)
        {
            var dy = this.canvasHeight / (this.chordNumber+1);
            for(var i = 1; i <= this.chordNumber; i++) {
                ctx.moveTo(0, i*dy);
                ctx.lineTo(this.canvasWidth, i*dy);
                ctx.stroke();
            }
        }
    }

    /*press(chord: string) {

    }

    unPress(chord: string) {

    }

    picks(chord: string) {

    }

    clear() {

    }*/
}