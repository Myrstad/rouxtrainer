import Dexie, { type Table } from 'dexie';
import type { TrainingCase, CMLLSettings } from './trainers/CMLLTypes';

export class RouxtrainerDatabase extends Dexie {
    cmll!: Table<TrainingCase>;
    cmllSettings!: Table<CMLLSettings>;


    constructor() {
        super("RouxtrainerDb");
        this.version(1).stores({
            cmll: 'id',
            cmllSettings: '++id',
        })
    }
}

export const db = new RouxtrainerDatabase();