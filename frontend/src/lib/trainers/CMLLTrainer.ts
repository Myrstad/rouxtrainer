import type { CMLLCaseDefinition, TrainingCase, TrainingData, LearningStatus } from './CMLLTypes'
import CMLLCases from "./CMLL-cases.json"
import { CMLL_CASES_JSON_PATH } from "./CMLLTypes";
import { db } from '../db';

class CMLLTrainer {

    private allCaseDefinitions: CMLLCaseDefinition[] = [];
    public trainingData: TrainingData = {};
    private isInitialized = false;

    public constructor() {
    }

    public async initialize() : Promise<void> {
        if (this.isInitialized) {
            console.warn("CMLLTrainer already initialized.");
            return;
        }

        try {
            // const response = await fetch(CMLL_CASES_JSON_PATH);
            // if (!response.ok) {
            //     throw new Error(`Failed to fetch CMLL cases from ${CMLL_CASES_JSON_PATH}: ${response.statusText}`);
            // }
            // this.allCaseDefinitions = await response.json();
            this.allCaseDefinitions = CMLLCases;
            await this._loadTrainingFromDb();
            await this._ensureTrainingDataForAllCases();
            this.isInitialized = true;
            console.log("CMLLTrainer initialized with", this.allCaseDefinitions.length, "cases.");
        } catch (error) {
            console.error("Error initializing CMLLTrainer:", error);
            throw error; // Re-throw to allow UI to handle it
        }
            
    }
    
    private async _ensureTrainingDataForAllCases(): Promise<void> {
        if (!this.allCaseDefinitions || this.allCaseDefinitions.length === 0) return;

        const newCases: TrainingCase[] = [];
        this.allCaseDefinitions.forEach(caseDef => {
            if (!this.trainingData[caseDef.id]) {                
                const shell = this._createCaseShell(caseDef.id);
                this.trainingData[caseDef.id] = shell;
                newCases.push(shell);
            }
        });

        if (newCases.length > 0) {
            await db.cmll.bulkAdd(newCases);
        }
    }

    private async _loadTrainingFromDb(): Promise<void> {
        try {
            const storedCases = await db.cmll.toArray();
            this.trainingData = {};
            storedCases.forEach(c => {
                this.trainingData[c.id] = c;
            });
        } catch (e) {
            console.error("Error loading training data from DB:", e);
            this.trainingData = {};
        }
    }

    public async resetAllTrainingData(): Promise<void> {
        this.trainingData = {};
        await db.cmll.clear();
        await this._ensureTrainingDataForAllCases(); // Re-populates with shells
        console.log("All CMLL training data has been reset.");
    }

    private _createCaseShell(id: string): TrainingCase {
        const caseDefinition = this.allCaseDefinitions.find(def => def.id === id)
        
        let defaultAlgorithm = caseDefinition?.algorithms.at(caseDefinition?.recommended?.at(0) ?? 0) ?? "Alg not found";
        return {
            id: id,
            wantToLearn: false,
            totalSeen: 0,
            totalSuccess: 0,
            masteryLevel: 0,
            learningStatus: "unseen",
            preferredAlgorithm: defaultAlgorithm,
            lastSeen: undefined,
        };
    }

    public getCaseDefinition(id: string): CMLLCaseDefinition | undefined {
        if (!this.isInitialized) {
            console.warn("Trainer not initialized. Call initialize() first.");
            return undefined;
        }
        return this.allCaseDefinitions.find(c => c.id === id);
    }

    public getTrainingCase(id: string): TrainingCase | undefined {
        return this.trainingData[id];
    }

    public getAllTrainingCases(): TrainingCase[] {
        return Object.values(this.trainingData);
    }

    public getAllCaseDefinitions(): CMLLCaseDefinition[] {
        return this.allCaseDefinitions;
    }

    public learnCase(id: string): void {
        if (!this.trainingData[id]) {
            console.error(`Case with ID ${id} not found in training data.`);
            return;
        }

        this.trainingData[id].wantToLearn = true;
        db.cmll.update(id, { wantToLearn: true });
    }

    public unlearnCase(id: string): void {
        if (!this.trainingData[id]) {
            console.error(`Case with ID ${id} not found in training data.`);
            return;
        }

        this.trainingData[id].wantToLearn = false;
        db.cmll.update(id, { wantToLearn: false });
    }

    public setPreferredAlgorithm(caseId: string, algorithm: string): void {
        if (!this.trainingData[caseId]) {
            console.error(`Case with caseId ${caseId} not found in training data.`);
            return;
        }
        const caseDef = this.getCaseDefinition(caseId)
        if (!caseDef) {
            console.error("Case not found in case definitions")
            return;
        }
        this.trainingData[caseId].preferredAlgorithm = algorithm;
        db.cmll.update(caseId, { preferredAlgorithm: algorithm });
    }

    public recordAttempt(id: string, outcome: 'success'|'fail'|'unsure') {
        const trainingCase = this.trainingData[id];

        if (!this.trainingData[id]) {
            console.error(`Case with ID ${id} not found in training data.`);
            return;
        }

        trainingCase.totalSeen += 1;
        trainingCase.lastSeen = Date.now();

        switch (outcome) {
            case 'success':
                trainingCase.totalSuccess += 1
                if (trainingCase.masteryLevel < 3)
                    trainingCase.masteryLevel += 1;
                trainingCase.learningStatus = trainingCase.masteryLevel === 3 ? "mastered" : "learning";
                break;
            case 'fail':
                if (trainingCase.masteryLevel > 0)
                    trainingCase.masteryLevel -= 1;
                trainingCase.learningStatus = trainingCase.masteryLevel === 0 ? "unknown" : "learning";
                break;
            case 'unsure':
                if (trainingCase.learningStatus === "unseen")
                    trainingCase.learningStatus = "unknown";
                break;
            default:
                break;  
        }
        db.cmll.put(trainingCase);

    }

    public selectNextCasesToPractice(
        count: number = 5,
        maxNewCasesInQueue: number = 1,
        maxMasteredInQueue: number = 1
    ) : TrainingCase[] {
        
        if (!this.isInitialized) {
            console.warn("Trainer not initialized. Call initialize() first. Returning empty array.");
            return [];
        }

        let learnableCases = Object.values(this.trainingData).filter(c => c.wantToLearn);
        if (learnableCases.length === 0) return [];

        const categorized: Record<LearningStatus, TrainingCase[]> = {
            unseen: [], unknown: [], learning: [], mastered: []
        };
        learnableCases.forEach(c => categorized[c.learningStatus].push(c));
        categorized.learning = this.shuffleArray(categorized.learning);
        categorized.mastered = this.shuffleArray(categorized.mastered);
        categorized.unknown = this.shuffleArray(categorized.unknown);
        categorized.unseen = this.shuffleArray(categorized.unseen);

        // May want to sort the cases by last time seen

        const result: TrainingCase[] = [];
        const addCases = (from: TrainingCase[], max: number) => {
            const numToAdd = Math.min(from.length, max); // Failsafe
            result.push(...from.slice(0, numToAdd));
        };

        // Give higher changes of already seen cases versus new or mastered
        addCases(categorized.learning, this.allCaseDefinitions.length); // Always add all learning, want to master these
        addCases(categorized.unknown, this.allCaseDefinitions.length);  // Always add all unknown , want to master these
        addCases(categorized.unseen, maxNewCasesInQueue);   // Strict initial limit
        addCases(categorized.mastered, maxMasteredInQueue); // Strict initial limit

        // If count is not reached. fill array with randoms from learning, mastered, unknown, unseen
        while (result.length < count) {
            learnableCases = this.shuffleArray(learnableCases);
            result.push(learnableCases[0]);
        }

        return this.shuffleArray(result).slice(0, count);
    }

    private shuffleArray<T>(array: T[]): T[] {        
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

export default CMLLTrainer;