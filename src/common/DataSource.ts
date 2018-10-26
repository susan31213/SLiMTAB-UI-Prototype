import { FingerBoard } from './FingerBoard';
import { WebSession } from './WebSession';
export abstract class DataSource {
    protected fb: FingerBoard;
    protected wb: WebSession;
    constructor(fb: FingerBoard, wb:WebSession) {
        this.fb = fb;
        this.wb = wb;
        wb.add(this);
    }
    public abstract on(ename: string, cbk: (arg: any) => void): void;
}