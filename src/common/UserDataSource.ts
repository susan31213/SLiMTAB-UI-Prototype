import { DataSource } from "./DataSource";
import { FingerBoard } from "./FingerBoard";

export class UserDataSource extends DataSource {
    constructor(fb: FingerBoard) {
        super(fb);


    }
    
    public on(ename: string, cbk: (arg: any) => void): void {

    }
}