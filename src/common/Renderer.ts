import * as d3 from 'd3';
import {Tabular, Note} from './Tabular';

export interface RendererConfig{
    string_interval: number;
    beat_interval: number;
    bpm: number;
}

export class D3Renderer {
    private config: RendererConfig;
    private svgCanvas: d3.Selection<SVGElement, undefined, null, undefined>;
    private tabularGroup: d3.Selection<SVGElement, undefined, null, undefined>;
    private stringGroup: d3.Selection<SVGElement, undefined, null, undefined>;
    private symbolsGroup: d3.Selection<SVGElement, undefined, null, undefined>;
    private scoreText: d3.Selection<d3.BaseType, undefined, null, undefined>;
    private tabular: Tabular;
    private noteAction: Array<null | d3.Selection<d3.BaseType, undefined, null, undefined>>;

    constructor(tabular: Tabular, config: RendererConfig) {
        this.config = config;

        this.svgCanvas = d3.create('svg:svg');
        this.svgCanvas.html(`    <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#333333" />
            <stop offset="10%" stop-color="#252525" />
            <stop offset="92%" stop-color="#252525" />
            <stop offset="100%" stop-color="#000000" />
        </linearGradient>
      </defs>`)
        this.svgCanvas.attr("width", "100%").attr("height", "100%");
        this.tabularGroup = this.svgCanvas.append('svg:g');

        let background = this.tabularGroup.append("svg:rect");
        background.attr("width", "100vw").attr("height", `100px`);
        background.classed("bg-rect", true);


        // generate string background
        background = this.tabularGroup.append("svg:rect");
        background.attr("y", "100px");
        background.attr("width", "100vw").attr("height", `${this.config.string_interval*7}vh`);
        background.classed("bg-rect-string", true);


        this.stringGroup = this.tabularGroup.append('svg:g');
        this.stringGroup.classed("string-group", true);


        this.scoreText = this.tabularGroup.append('svg:text');
        this.scoreText.text("SCORE 0");
        this.scoreText.classed("score-text", true);
        this.scoreText.attr("style", "transform: translate(10vw, 70px)");

        // generate six strings
        d3.range(6).forEach((i: number) => {
            const line = this.stringGroup.append("svg:line");
            line.attr("x1", "0vw");
            line.attr("y1", `${this.config.string_interval*i}vh`);
            line.attr("x2", "100vw");
            line.attr("y2", `${this.config.string_interval*i}vh`);
            line.classed("string", true);
        })

        this.noteAction = [null, null, null, null, null, null];

        d3.range(6).forEach((i: number) => {
            const g = this.stringGroup.append('svg:g');
            g.attr("style", `transform: translate(10vw, ${this.config.string_interval*i}vh)`);

            let circle = g.append('svg:circle');
            circle.attr("r", `${this.config.string_interval/2.2}vh`);
            circle.classed("hit-base-circle", true);
            
            circle = g.append('svg:circle');
            circle.attr("r", `${this.config.string_interval/2.7}vh`);
            circle.classed("hit-action-circle", true);
            this.noteAction[i] = circle;
        });
        

        this.symbolsGroup = this.stringGroup.append('svg:g');

        this.tabular = tabular;

        this.render();
    }

    public fireHitEvent(string_id: number, note?: string): void {
        const string = this.noteAction[string_id-1] as d3.Selection<d3.BaseType, undefined, null, undefined>;
        
        string.classed("fire-hit-action", false);
        const newone = string.clone(false);
        ((string.node() as HTMLElement).parentNode as HTMLElement).replaceChild(newone.node() as Node, string.node() as Node);
        newone.classed("fire-hit-action", true);
        this.noteAction[string_id-1] = newone;
    }

    public firePerfectEvent(string_id: number): void {
        /*
        for(let i=0; i<note.positions.length; i++) {
            const string_id = note.positions[i].stringID;
            const string = this.noteAction[string_id-1] as d3.Selection<d3.BaseType, undefined, null, undefined>;
            
            string.classed("fire-prefect-action", false);
            const newone = string.clone(false);
            ((string.node() as HTMLElement).parentNode as HTMLElement).replaceChild(newone.node() as Node, string.node() as Node);
            newone.classed("fire-prefect-action", true);
            this.noteAction[string_id-1] = newone;
        }*/
    }

    public fireGoodEvent(string_id: number, note?: string): void {
        const string = this.noteAction[string_id-1] as d3.Selection<d3.BaseType, undefined, null, undefined>;
        
        string.classed("fire-good-action", false);
        const newone = string.clone(false);
        ((string.node() as HTMLElement).parentNode as HTMLElement).replaceChild(newone.node() as Node, string.node() as Node);
        newone.classed("fire-good-action", true);
        this.noteAction[string_id-1] = newone;
    }

    public setTime(seconds: number): void {
        const beats = seconds * this.config.bpm / 60;
        // console.log(Math.floor(beats));
        this.symbolsGroup.attr("style", `transform: translate(${-beats/4*this.config.beat_interval}vw, 0);`);
    
    }

    public render(): void {
        this.symbolsGroup.html('');
        
        let dx = 10;
        for(let i=0; i<this.tabular.sections.length; i++) {
            const section = this.tabular.sections[i];
            for(let j=0; j<section.notes.length; j++) {
                const note = section.notes[j];

                if(note instanceof Note) {
                    for(let k=0; k<note.positions.length; k++) {
                        const position = note.positions[k];
                        const noteg = this.symbolsGroup.append('svg:g');

                        noteg.attr("style", `transform: translate(${dx}vw, ${(position.stringID-1)*this.config.string_interval}vh)`);
                        noteg.attr("data-x", `${dx}vw`);
                        noteg.attr("data-y", `${(position.stringID-1)*this.config.string_interval}vh)`);
                        const circle = noteg.append('svg:image');
                        circle.attr("xlink:href", "./img/group-174.svg");
                        circle.attr('x', "-14").attr("y", "-14");
                        circle.attr('width', "28").attr("height", "28");
                        
                        const text = noteg.append('svg:text');
                        text.text(position.fretID);
                        text.attr("alignment-baseline", "central");
                        text.attr("text-anchor", "middle");
                        text.classed("note-fret", true);

                        (note as any).renderContext = noteg.node();
                    }
                }
                dx += this.config.beat_interval*1/note.duration;
            }
        }
    }

    get domElement(): SVGElement | null {
        return this.svgCanvas.node();
    }

    set score(score: number) {
        this.scoreText.text(`SCORE ${Math.round(score)}`);
    }

    public killNote(note: Note): void {
        console.log(note);
        const noteg = d3.select((note as any).renderContext);
        noteg.attr("style", `transform: translate(${noteg.attr("data-x")}, ${noteg.attr("data-y")} scale(1.0)`).transition().duration(100)
            .attr("style", `transform: translate(${noteg.attr("data-x")}, ${noteg.attr("data-y")} scale(0)`)
    }

    public reset(): void {
        // TODO: This is TOO ugly
        this.symbolsGroup.selectAll('g').nodes().forEach((x) => {
            const noteg = d3.select(x);
            noteg.attr("style", `transform: translate(${noteg.attr("data-x")}, ${noteg.attr("data-y")} scale(1.0)`);
        })
        this.setTime(0);
    }
};