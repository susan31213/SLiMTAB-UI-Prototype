import { FingerBoard } from './FingerBoard';
export abstract class DataSource {
    protected fb: FingerBoard;

    constructor(fb: FingerBoard) {
        this.fb = fb;
    }
    public abstract on(ename: string, cbk: (arg: any) => void): void;
}