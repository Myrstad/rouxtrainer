import CMLLTrainer from "./CMLLTrainer";
import type { TrainingCase, TrainingData, CMLLCaseDefinition, LearningStatus } from "./CMLLTypes";

let trainerInstance: CMLLTrainer | null = $state(null);
let isInitializedState = $state(false);
let trainingDataState: TrainingData = $state({});
let allCaseDefinitionsState: CMLLCaseDefinition[] = $state([]);


class CMLLTrainerStore {
    constructor() {
        trainerInstance = new CMLLTrainer();
        trainingDataState = { ...trainerInstance.trainingData };
        allCaseDefinitionsState = [...trainerInstance.getAllCaseDefinitions()];

    }

    async initialize(): Promise<void> {
        if (isInitializedState || !trainerInstance) return;

        try {
            await trainerInstance.initialize();
            isInitializedState = true;
            trainingDataState = { ... trainerInstance.trainingData };
            allCaseDefinitionsState = [... trainerInstance.getAllCaseDefinitions()];
        } catch (error) {
            console.error("Failed to initialize CMLL Trainer Store:", error);
            // Handle error appropriately in UI if needed
        }
    }

    get isInitialized() {
        return isInitializedState;
    }

    get trainingData() {
        return trainingDataState;
    }

    get allCaseDefinitions() {
        return allCaseDefinitionsState;
    }

    // Helper to update store after trainer methods modify data
    private syncStoreWithTrainer(): void {
        if (trainerInstance) {
            trainingDataState = { ...trainerInstance.trainingData };
        }
    };

    // --- Trainer Methods ---
    resetAllTrainingData() {
        trainerInstance?.resetAllTrainingData();
        this.syncStoreWithTrainer();
    }

    learnCase(id: string) {
        trainerInstance?.learnCase(id);
        this.syncStoreWithTrainer();
    }

    unlearnCase(id: string) {
        trainerInstance?.unlearnCase(id);
        this.syncStoreWithTrainer();
    }

    setPreferredAlgorithm(id: string, algorithm: string) {
        trainerInstance?.setPreferredAlgorithm(id, algorithm);
        this.syncStoreWithTrainer();
    }

    recordAttempt(id: string, outcome: 'success' | 'fail' | 'unsure') {
        trainerInstance?.recordAttempt(id, outcome);
        this.syncStoreWithTrainer();
    }

    selectNextCasesToPractice(count?: number, maxLearning?: number, maxMastered?: number): TrainingCase[] {
        return trainerInstance?.selectNextCasesToPractice(count, maxLearning, maxMastered) || [];
    }

    getCaseDefinition(id: string): CMLLCaseDefinition | undefined {
        return trainerInstance?.getCaseDefinition(id);
    }

    // This now directly accesses the reactive trainingDataState
    getTrainingCase(id: string): TrainingCase | undefined {
        return trainingDataState[id];
    }

    getAllTrainingCases(): TrainingCase[] {
        return Object.values(trainingDataState);
    }

    getStats() {
        const cases = Object.values(trainingDataState);
        return {
            totalCases: cases.length,
            wantToLearn: cases.filter(c => c.wantToLearn).length,
            learningMastered: cases.filter(c => c.wantToLearn && c.learningStatus === 'mastered').length,
            learningLearning: cases.filter(c => c.wantToLearn && c.learningStatus === 'learning').length,
            learningUnknown: cases.filter(c => c.wantToLearn && c.learningStatus === 'unknown').length,
            learningUnseen: cases.filter(c => c.wantToLearn && c.learningStatus === 'unseen').length,
            mastered: cases.filter(c => c.learningStatus === 'mastered').length,
            learning: cases.filter(c => c.learningStatus === 'learning').length,
            unknown: cases.filter(c => c.learningStatus === 'unknown').length,
            unseen: cases.filter(c => c.learningStatus === 'unseen').length,
            totalAttemts: cases.reduce((sum, c) => sum + c.totalSeen, 0),
            totalSuccess: cases.reduce((sum, c) => sum + c.totalSuccess, 0),
        };
    }

}

export const cmllTrainerStore = new CMLLTrainerStore();