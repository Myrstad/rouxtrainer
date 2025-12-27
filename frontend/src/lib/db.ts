import Dexie, { type Table } from 'dexie';
import type { TrainingCase } from './trainers/CMLLTypes';

export class RouxtrainerDatabase extends Dexie {
    cmll!: Table<TrainingCase>;

    constructor() {
        super("RouxtrainerDb");
        this.version(1).stores({
            cmll: 'id'
        })
    }
}

export const db = new RouxtrainerDatabase();