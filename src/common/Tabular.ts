export class Tabular {
    private psections: Array<Section> = [];
    public get sections(): Array<Section>
    {
        return this.psections;
    }
}

export class Section {
    private pnotes: Array<Note> = [];
    public get notes(): Array<Note | Pause>
    {
        return this.pnotes;
    }
}

export class Note {
    public positions: Array<{stringID: number, fretID: number}>;
    public duration: number;

    constructor(positions: Array<{stringID: number, fretID: number}>, duration: number) {
        this.positions = positions;
        this.duration = duration;
    }

}

export class Pause {
    public duration: number;
    constructor(duration: number) {
        this.duration = duration;
    }
}