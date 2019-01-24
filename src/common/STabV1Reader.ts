import {Tabular, Section, Pause, Note} from './Tabular';

export class STabV1Reader {
    private json: string;
    constructor(json: string) {
        this.json = json;        
    }

    public read(): Tabular {
        const result = new Tabular();
        const tabular = JSON.parse(this.json) as Array<any>;

        tabular.forEach((section: Array<any>) => {
            const tabsection = new Section();
            section.forEach((pick: Array<number>) => {
                const duration = pick[0];
                const positions: Array<{stringID: number, fretID: number}> = [];
                if(pick[1] == 0) {
                    tabsection.notes.push(new Pause(duration));
                } else {
                    for(let i=1; i<Math.floor((pick.length-1)/2)*2; i+=2) {
                        positions.push({stringID: pick[i], fretID: pick[i+1]});
                    }
                    tabsection.notes.push(new Note(positions, duration));
                }
                //pick.slice(1, Math.floor((pick.length-1)/2)*2) as Array<{stringID: number, fretID: number}>;
            });
            result.sections.push(tabsection);
        });

        return result;
    }

    
}