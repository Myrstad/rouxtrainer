export interface CMLLCaseDefinition {
    id: string; // e.g., "O1", "T2", etc.
    group: string; // e.g., "O", "Pi", etc.
    name: string; // Descriptive name of the case
    recognitionCues: string[]; // e.g., "headlight", "opposites, etc.
    algorithms: string[]; // The standard algorithm for this case
    recommended: number[]; // Indexes for recommended algorithms
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
    customAlgorithm?: string[];
    lastSeen?: number; // Timestamp of the last time this case was practiced
    nextReview?: number; // Timestamp
    currentInterval?: number; // Minutes
    streakSuccess?: number;
}

export type TrainingData = Record<string, TrainingCase>; // Maps case ID to TrainingCase

export interface CMLLSettings {
    id?: number;
    spacedRepition: boolean;        // 
    maintanence: boolean;           // if mastered should show
    masteredPercentage: number;     // maximum amount of mastered (percentage)
    trainerSessionCount: number;    // amount of cases per sessio
    topCubeColor: string;           // white, yellow, red, orange, green, blue
    frontCubeColor: string;         // white, yellow, red, orange, green, blue; except oposite color pair
    randomAUF: boolean;             // random U, U', U2 or none to help with regocnition
    defaultCubeState: "2D"|"3D";
    cameraEulerRadians : {x:number, y:number, z:number};
}

export const DEFAULT_CMLL_SETTINGS: CMLLSettings = {
    spacedRepition: true,
    maintanence: true,
    masteredPercentage: 0.2,
    trainerSessionCount: 5,
    topCubeColor: "yellow",
    frontCubeColor: "blue",
    randomAUF: false,
    defaultCubeState: "3D",
    cameraEulerRadians : {x: 0.3, y: -0.3, z: 0.3}
}



export const CMLL_CASES_JSON_PATH = "/CMLL-cases.json"; // Path to your JSON file in the public/static folder
