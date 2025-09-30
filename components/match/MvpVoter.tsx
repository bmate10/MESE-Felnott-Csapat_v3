import React, { useMemo } from 'react';
import { Match } from '../../types';
import { useLeague } from '../../hooks/useLeague';
import Button from '../ui/Button';

interface MvpVoterProps {
    match: Match;
}

const MvpVoter: React.FC<MvpVoterProps> = ({ match }) => {
    const { players, addMvpVote } = useLeague();

    const lineupPlayerIds = useMemo(() => {
        const ids = new Set<string>();
        match.lineup.singles.forEach(id => id && ids.add(id));
        match.lineup.doubles.forEach(pair => {
            pair.player1 && ids.add(pair.player1);
            pair.player2 && ids.add(pair.player2);
        });
        return Array.from(ids);
    }, [match.lineup]);

    const lineupPlayers = useMemo(() => {
        return players.filter(p => lineupPlayerIds.includes(p.id));
    }, [players, lineupPlayerIds]);

    const sortedVotes = useMemo(() => {
        return Object.entries(match.mvpVotes || {})
            .map(([playerId, votes]) => ({
                playerId,
                name: players.find(p => p.id === playerId)?.name || 'Unknown Player',
                // Fix: Ensure votes are always treated as a number to prevent type errors in subsequent arithmetic operations.
                votes: Number(votes) || 0,
            }))
            .sort((a, b) => b.votes - a.votes);
    }, [match.mvpVotes, players]);
    
    const totalVotes = sortedVotes.reduce((sum, current) => sum + current.votes, 0);

    if (lineupPlayers.length === 0) {
        return <p className="text-sm text-gray-500">No lineup set for this match yet.</p>;
    }

    return (
        <div className="space-y-4">
            <div>
                <h4 className="font-semibold text-gray-700 mb-2">Vote for MVP</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {lineupPlayers.map(player => (
                        <Button
                            key={player.id}
                            variant="secondary"
                            size="sm"
                            onClick={() => addMvpVote(match.id, player.id)}
                        >
                            {player.name}
                        </Button>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-gray-700 mb-2">Results</h4>
                {sortedVotes.length > 0 ? (
                    <div className="space-y-2">
                        {sortedVotes.map(item => (
                            <div key={item.playerId} className="text-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span>{item.name}</span>
                                    <span className="font-medium">{item.votes}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: totalVotes > 0 ? `${(item.votes / totalVotes) * 100}%` : '0%' }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No votes yet.</p>
                )}
            </div>
        </div>
    );
};

export default MvpVoter;
