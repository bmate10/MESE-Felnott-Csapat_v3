
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Player, Match, Lineup, MatchResult, AvailabilityStatus } from '../types';

interface LeagueContextType {
    year: number;
    players: Player[];
    matches: Match[];
    loading: boolean;
    addPlayer: (player: Omit<Player, 'id'>) => Promise<void>;
    updatePlayer: (playerId: string, player: Partial<Player>) => Promise<void>;
    deletePlayer: (playerId: string) => Promise<void>;
    addMatch: (match: Omit<Match, 'id' | 'availability' | 'lineup' | 'result' | 'mvpVotes'>) => Promise<void>;
    updateMatch: (matchId: string, match: Partial<Match>) => Promise<void>;
    deleteMatch: (matchId: string) => Promise<void>;
    updatePlayerAvailability: (matchId: string, playerId: string, status: AvailabilityStatus) => Promise<void>;
    updateMatchLineup: (matchId: string, lineup: Lineup) => Promise<void>;
    updateMatchResult: (matchId: string, result: MatchResult) => Promise<void>;
    addMvpVote: (matchId: string, playerId: string) => Promise<void>;
}

export const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

interface LeagueProviderProps {
    children: ReactNode;
    year: number;
}

export const LeagueProvider: React.FC<LeagueProviderProps> = ({ children, year }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const getCollectionRef = useCallback((collectionName: 'players' | 'matches') => {
        return collection(db, 'years', year.toString(), collectionName);
    }, [year]);

    useEffect(() => {
        setLoading(true);

        const playersQuery = query(getCollectionRef('players'), orderBy('rank'));
        const playersUnsubscribe = onSnapshot(playersQuery, (snapshot) => {
            const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
            setPlayers(playersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching players:", error);
            setLoading(false);
        });

        const matchesQuery = query(getCollectionRef('matches'), orderBy('date'));
        const matchesUnsubscribe = onSnapshot(matchesQuery, (snapshot) => {
            const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
            setMatches(matchesData);
        }, (error) => {
            console.error("Error fetching matches:", error);
        });

        return () => {
            playersUnsubscribe();
            matchesUnsubscribe();
        };
    }, [year, getCollectionRef]);

    const addPlayer = async (player: Omit<Player, 'id'>) => {
        await addDoc(getCollectionRef('players'), player);
    };

    const updatePlayer = async (playerId: string, player: Partial<Player>) => {
        const playerDoc = doc(db, 'years', year.toString(), 'players', playerId);
        await updateDoc(playerDoc, player);
    };

    const deletePlayer = async (playerId: string) => {
        const playerDoc = doc(db, 'years', year.toString(), 'players', playerId);
        await deleteDoc(playerDoc);
    };

    const addMatch = async (match: Omit<Match, 'id' | 'availability' | 'lineup' | 'result' | 'mvpVotes'>) => {
        const newMatch = {
            ...match,
            availability: {},
            lineup: { singles: Array(6).fill(null), doubles: Array(3).fill({ player1: null, player2: null }) },
            result: { ourScore: null, opponentScore: null },
            mvpVotes: {}
        };
        await addDoc(getCollectionRef('matches'), newMatch);
    };
    
    const updateMatch = async (matchId: string, match: Partial<Match>) => {
        const matchDoc = doc(db, 'years', year.toString(), 'matches', matchId);
        await updateDoc(matchDoc, match);
    };

    const deleteMatch = async (matchId: string) => {
        const matchDoc = doc(db, 'years', year.toString(), 'matches', matchId);
        await deleteDoc(matchDoc);
    };

    const updatePlayerAvailability = async (matchId: string, playerId: string, status: AvailabilityStatus) => {
        const matchDoc = doc(db, 'years', year.toString(), 'matches', matchId);
        await updateDoc(matchDoc, {
            [`availability.${playerId}`]: status
        });
    };
    
    const updateMatchLineup = async (matchId: string, lineup: Lineup) => {
        const matchDoc = doc(db, 'years', year.toString(), 'matches', matchId);
        await updateDoc(matchDoc, { lineup });
    };

    const updateMatchResult = async (matchId: string, result: MatchResult) => {
        const matchDoc = doc(db, 'years', year.toString(), 'matches', matchId);
        await updateDoc(matchDoc, { result });
    };

    const addMvpVote = async (matchId: string, playerId: string) => {
        const matchToUpdate = matches.find(m => m.id === matchId);
        if (!matchToUpdate) return;
        const currentVotes = matchToUpdate.mvpVotes[playerId] || 0;
        const matchDoc = doc(db, 'years', year.toString(), 'matches', matchId);
        await updateDoc(matchDoc, {
            [`mvpVotes.${playerId}`]: currentVotes + 1
        });
    };

    return (
        <LeagueContext.Provider value={{ year, players, matches, loading, addPlayer, updatePlayer, deletePlayer, addMatch, updateMatch, deleteMatch, updatePlayerAvailability, updateMatchLineup, updateMatchResult, addMvpVote }}>
            {children}
        </LeagueContext.Provider>
    );
};
