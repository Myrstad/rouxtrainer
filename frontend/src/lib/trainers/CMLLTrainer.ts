import type { CMLLCaseDefinition, TrainingCase, TrainingData, LearningStatus, CMLLSettings } from './CMLLTypes'
import CMLLCases from "./CMLL-cases.json"
import { CMLL_CASES_JSON_PATH, DEFAULT_CMLL_SETTINGS } from "./CMLLTypes";
import { db } from '../db';

class CMLLTrainer {

    private allCaseDefinitions: CMLLCaseDefinition[] = [];
    public settings!: CMLLSettings;
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
            await this._loadSettingsFromDb(); // Load settings first
            await this._loadTrainingFromDb();
            await this._ensureTrainingDataForAllCases();
            this.isInitialized = true;
            console.log("CMLLTrainer initialized with", this.allCaseDefinitions.length, "cases.");
        } catch (error) {
            console.error("Error initializing CMLLTrainer:", error);
            throw error; // Re-throw to allow UI to handle it
        }
            
    }

    private async _loadSettingsFromDb(): Promise<void> {
        try {
            // We expect only one settings object, typically with ID 1
            let storedSettings = await db.cmllSettings.get(1);
            if (!storedSettings) {
                // If no settings found, create default settings and store them
                this.settings = { ...DEFAULT_CMLL_SETTINGS, id: 1 }; // Assign ID 1 for the single settings object
                await db.cmllSettings.add(this.settings);
                console.log("Initialized default CMLL settings in DB.");
            } else {
                this.settings = storedSettings;
            }
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
                trainingCase.totalSuccess += 1;
                trainingCase.streakSuccess ? trainingCase.streakSuccess++ : trainingCase.streakSuccess = 1;

                // unknown or unseen to learning
                if (trainingCase.learningStatus === "unknown" || trainingCase.learningStatus === "unseen") {
                    trainingCase.masteryLevel = 2; // learning
                    trainingCase.learningStatus = "learning"
                }
                // learning to mastered
                if (trainingCase.learningStatus === "learning" && trainingCase.streakSuccess >= 3) {
                    trainingCase.masteryLevel = 3; // mastered
                    trainingCase.learningStatus = "mastered"
                }

                const MINUTE = 60 * 1000; //in ms

                let interval = 1 * MINUTE;
                if (trainingCase.streakSuccess == 2) interval = MINUTE * 60         // hour
                if (trainingCase.streakSuccess == 3) interval = MINUTE * 60 * 12    // 12 hours
                if (trainingCase.streakSuccess == 4) interval = MINUTE * 60 * 48    // 48 hours, two days
                if (trainingCase.streakSuccess >= 5) interval = MINUTE * 60 * 24 * 7// week

                trainingCase.nextReview = Date.now() + interval;
                break;
            case 'fail':
                // if learning
                if (trainingCase.learningStatus == "unseen" || trainingCase.learningStatus == "unknown" || trainingCase.streakSuccess! <= 1) {
                    trainingCase.masteryLevel = 1;
                    trainingCase.learningStatus = "unknown"
                }
                if (trainingCase.learningStatus == "mastered") {
                    trainingCase.masteryLevel = 2;
                    trainingCase.learningStatus = "learning";
                }

                trainingCase.nextReview = Date.now() + (60 * 1000) // in one minute

                trainingCase.streakSuccess = 0;
                trainingCase.learningStatus = trainingCase.masteryLevel === 1 ? "unknown" : "learning";
                break;
            case 'unsure':
                if (trainingCase.learningStatus === "unseen") {
                    trainingCase.learningStatus = "unknown";
                    trainingCase.masteryLevel = 1;
                }
                break;
            default:
                break;  
        }
        db.cmll.put(trainingCase);

    }

    public selectNextCasesToPractice(
        count: number = 5,
    ) : TrainingCase[] {
        const { spacedRepetition, maintenance, masteredPercentage } = this.settings;

        if (!this.isInitialized) {
            console.warn("Trainer not initialized. Call initialize() first. Returning empty array.");
            return [];
        }

        /*
        Cards are sorted in the following order:
         > Due learning
         > Due mastered w/ max
         > Future learning
         > Unseen
         > Future mastered
        
        So those due (spaced repetition only) are prioritized
        With a percentage of mastered cards (if maintenance) based on percentage [1+ mastered]
        Then Future learning to not create a large learning backlog
        Then learn new cases (unseen)
        Then Future mastered for emergency filling up to count
        */

        const now = Date.now();
        const result: TrainingCase[] = [];
        
        let allCases = Object.values(this.trainingData).filter(c => c.wantToLearn);
        
        if (allCases.length === 0) return [];
        
        const isDue = allCases.filter(c => (c.nextReview && c.nextReview <= now) || !spacedRepetition || !c.nextReview);
        // console.log(`Selecting ${count} cases, with spaced repetition ${spacedRepetition ? 'enabled' : 'disabled'}, with maintenance ${maintenance ? 'enabled' : 'disabled'}`);
        
        // console.log("Is due:", isDue);
        

        const dueLearning = isDue.filter(c => c.learningStatus === "learning" || c.learningStatus === "unknown");
        const dueMastered = isDue.filter(c => c.learningStatus === "mastered");

        const unseen = allCases.filter(c => c.learningStatus === "unseen");

        isDue.sort((a,b) => (a.nextReview! - b.nextReview!));

        // 1. Add mastered for maintenance
        if (maintenance) {
            const maxMastered = Math.max(1, Math.floor(count * masteredPercentage));
            // should be based on spaced repetition or random if not
            const toAdd = this.shuffleArray(dueMastered).sort((a,b) => (a.nextReview! - b.nextReview!));
            // console.log("Maintenance added:", toAdd);
            
            result.push(...toAdd.slice(0, maxMastered));
        }

        //2. Fill with learning/unknown
        dueLearning.sort((a,b) => (a.nextReview! - b.nextReview!));
        const learningSlotsNeeded = count - result.length;
        result.push(...dueLearning.slice(0, learningSlotsNeeded));

        //3. Fill with future learning/unknown
        if (result.length < count && spacedRepetition) {
            // cannot happen without spaced repetition, since then everything is already in dueLearning
            const remaining = count - result.length;
            const alreadySelectedIds = new Set(result.map(r => r.id))
            const filler = allCases
                .filter(c => !alreadySelectedIds.has(c.id) && (c.learningStatus == "learning" || c.learningStatus == "unknown"));

            result.push(...this.shuffleArray(filler).slice(0, remaining));
        }


        //4. Fill remaining with unseen
        if (result.length < count) {
            const unseenSlotsNeeded = count - result.length;
            const randomUnseen = this.shuffleArray(unseen).slice(0, unseenSlotsNeeded);
            result.push(...randomUnseen);
        }
        

        //5. Emergency fill, mastered not yet due
        if (result.length < count) {
            let remaining = count - result.length
            const alreadySelectedIds = new Set(result.map(r=>r.id))
            const filler = allCases
                .filter(c => !alreadySelectedIds.has(c.id))

            const toAdd = this.shuffleArray(filler).sort((a,b) => (a.nextReview || 0) - (b.nextReview || 0)).slice(0, remaining)
            console.log("emergency added", toAdd);
            
            result.push(...toAdd)
        }        
        
        return this.shuffleArray(result);
    }

    private shuffleArray<T>(array: T[]): T[] {        
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Updates the CMLL settings and persists them to the database.
     * @param newSettings A partial object containing the settings to update.
     */
    public async updateSettings(newSettings: Partial<CMLLSettings>): Promise<void> {
        if (!this.settings) {
            console.error("CMLL settings not initialized. Call initialize() first.");
            return;
        }
        Object.assign(this.settings, newSettings);
        await db.cmllSettings.put(this.settings); // Use put to update by ID
    }
}

export default CMLLTrainer;