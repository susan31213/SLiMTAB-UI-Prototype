export class Tabular {
    private psections: Array<Section> = [];
    public get sections(): Array<Section>
    {
        return this.psections;
    }
}

export class Section {
    private pnotes: Array<Note> = [];
    public get notes(): Array<Placeholder>
    {
        return this.pnotes;
    }
}

export abstract class Placeholder {

}

export class Note extends Placeholder {
    public positions: Array<{stringID: number, fretID: number}>;
    public duration: number;

    constructor(positions: Array<{stringID: number, fretID: number}>, duration: number) {
        super();
        this.positions = positions;
        this.duration = duration;
    }

}

export class Pause extends Placeholder {
    public duration: number;
    constructor(duration: number) {
        super();
        this.duration = duration;
    }
}