
import React, { useState, useEffect } from 'react';
import { Match } from '../../types';
import { useLeague } from '../../hooks/useLeague';
import Button from '../ui/Button';

interface MatchResultFormProps {
    match: Match;
}

const MatchResultForm: React.FC<MatchResultFormProps> = ({ match }) => {
    const { updateMatchResult } = useLeague();
    const [ourScore, setOurScore] = useState<number | ''>(match.result.ourScore ?? '');
    const [opponentScore, setOpponentScore] = useState<number | ''>(match.result.opponentScore ?? '');

    useEffect(() => {
        setOurScore(match.result.ourScore ?? '');
        setOpponentScore(match.result.opponentScore ?? '');
    }, [match.result]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMatchResult(match.id, {
            ourScore: ourScore === '' ? null : Number(ourScore),
            opponentScore: opponentScore === '' ? null : Number(opponentScore)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Our Score</label>
                    <input
                        type="number"
                        value={ourScore}
                        onChange={(e) => setOurScore(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <div className="pt-6 font-bold text-gray-600">-</div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Opponent Score</label>
                    <input
                        type="number"
                        value={opponentScore}
                        onChange={(e) => setOpponentScore(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
            </div>
            <div className="text-right">
                <Button type="submit">Update Score</Button>
            </div>
        </form>
    );
};

export default MatchResultForm;
