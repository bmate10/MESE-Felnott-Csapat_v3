
import React, { useState, useEffect } from 'react';
import { Match } from '../../types';
import { useLeague } from '../../hooks/useLeague';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Timestamp } from 'firebase/firestore';

interface MatchFormProps {
    isOpen: boolean;
    onClose: () => void;
    match?: Match | null;
}

const MatchForm: React.FC<MatchFormProps> = ({ isOpen, onClose, match }) => {
    const { addMatch, updateMatch } = useLeague();
    const [opponent, setOpponent] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [season, setSeason] = useState<'Spring' | 'Fall'>('Spring');

    useEffect(() => {
        if (match) {
            setOpponent(match.opponent);
            setLocation(match.location);
            setDate(match.date.toDate().toISOString().split('T')[0]);
            setSeason(match.season);
        } else {
            setOpponent('');
            setLocation('');
            setDate('');
            setSeason('Spring');
        }
    }, [match, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!opponent || !location || !date) return;

        const matchData = {
            opponent,
            location,
            date: Timestamp.fromDate(new Date(date)),
            season,
        };
        
        if (match) {
            await updateMatch(match.id, matchData);
        } else {
            await addMatch(matchData);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={match ? 'Edit Match' : 'Add Match'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="opponent" className="block text-sm font-medium text-gray-700">Opponent</label>
                    <input type="text" id="opponent" value={opponent} onChange={e => setOpponent(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required />
                </div>
                 <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                    <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required />
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required />
                </div>
                 <div>
                    <label htmlFor="season" className="block text-sm font-medium text-gray-700">Season</label>
                    <select id="season" value={season} onChange={e => setSeason(e.target.value as 'Spring' | 'Fall')} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        <option>Spring</option>
                        <option>Fall</option>
                    </select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">{match ? 'Update Match' : 'Add Match'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default MatchForm;
