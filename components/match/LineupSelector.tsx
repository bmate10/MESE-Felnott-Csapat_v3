
import React, { useMemo } from 'react';
import { Match, Lineup } from '../../types';
import { useLeague } from '../../hooks/useLeague';
import Button from '../ui/Button';

interface LineupSelectorProps {
    match: Match;
}

const LineupSelector: React.FC<LineupSelectorProps> = ({ match }) => {
    const { players, updateMatchLineup } = useLeague();
    
    const availablePlayers = useMemo(() => {
        return players.filter(p => match.availability[p.id] === 'Yes' || match.availability[p.id] === 'If Needed');
    }, [players, match.availability]);

    const handleLineupChange = (updatedLineup: Lineup) => {
        updateMatchLineup(match.id, updatedLineup);
    };

    const handleSinglesChange = (index: number, playerId: string) => {
        const newSingles = [...match.lineup.singles];
        newSingles[index] = playerId || null;
        handleLineupChange({ ...match.lineup, singles: newSingles });
    };

    const handleDoublesChange = (pairIndex: number, playerPosition: 'player1' | 'player2', playerId: string) => {
        const newDoubles = [...match.lineup.doubles];
        newDoubles[pairIndex] = { ...newDoubles[pairIndex], [playerPosition]: playerId || null };
        handleLineupChange({ ...match.lineup, doubles: newDoubles });
    };

    const PlayerSelect: React.FC<{ value: string | null, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ value, onChange }) => (
         <select value={value || ''} onChange={onChange} className="mt-1 block w-full pl-2 pr-8 py-1.5 text-sm bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md">
            <option value="">- Select Player -</option>
            {availablePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
    );

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold text-gray-700">Singles</h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i}>
                            <label className="text-sm text-gray-500">S{i + 1}</label>
                            <PlayerSelect value={match.lineup.singles[i]} onChange={(e) => handleSinglesChange(i, e.target.value)} />
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-gray-700">Doubles</h4>
                <div className="space-y-3 mt-2">
                     {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-2 border rounded-md">
                             <label className="text-sm text-gray-500 font-medium">D{i + 1}</label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <PlayerSelect value={match.lineup.doubles[i]?.player1} onChange={(e) => handleDoublesChange(i, 'player1', e.target.value)} />
                                <PlayerSelect value={match.lineup.doubles[i]?.player2} onChange={(e) => handleDoublesChange(i, 'player2', e.target.value)} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LineupSelector;
