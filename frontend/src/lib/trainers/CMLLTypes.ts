export interface CMLLCaseDefinition {
    id: string; // e.g., "O1", "T2", etc.
    group: string; // e.g., "O", "Pi", etc.
    name: string; // Descriptive name of the case
    algorithms: string[]; // The standard algorithm for this case
    recommended?: number[]; // Indexes for recommended algorithms
    recognitionCues?: string[]; // e.g., "headlight", "opposites, etc.
    // You can add other properties from your CMLL-cases.json here
}

export type LearningStatus = "unseen" | "unknown" | "learning" | "mastered";

export interface TrainingCase {
    id: string;
    wantToLearn: boolean;
    totalSeen: number;
    totalSuccess: number;
    masteryLevel: 0 | 1 | 2 | 3; // 0: Unseen, 1: Unknown, 2: Learning, 3: Mastered
    learningStatus: LearningStatus;
    preferredAlgorithm: string;
    lastSeen?: number; // Timestamp of the last time this case was practiced
}

export type TrainingData = Record<string, TrainingCase>; // Maps case ID to TrainingCase

export const LOCAL_STORAGE_KEY = "CMLL_Training_Data"; // Key to localstorage for data
export const CMLL_CASES_JSON_PATH = "/CMLL-cases.json"; // Path to your JSON file in the public/static folder
