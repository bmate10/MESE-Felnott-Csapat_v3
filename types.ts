
import { Timestamp } from 'firebase/firestore';

export interface Player {
    id: string;
    name: string;
    rank: number;
}

export const AvailabilityOptions = ['Yes', 'No', 'If Needed'] as const;
export type AvailabilityStatus = typeof AvailabilityOptions[number];

export interface DoublesPair {
    player1: string | null;
    player2: string | null;
}

export interface Lineup {
    singles: (string | null)[];
    doubles: DoublesPair[];
}

export interface MatchResult {
    ourScore: number | null;
    opponentScore: number | null;
}

export interface Match {
    id: string;
    opponent: string;
    location: string;
    date: Timestamp;
    season: 'Spring' | 'Fall';
    availability: Record<string, AvailabilityStatus>;
    lineup: Lineup;
    result: MatchResult;
    mvpVotes: Record<string, number>;
}
