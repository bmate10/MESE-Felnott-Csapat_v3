
import React, { useState, useEffect } from 'react';
import { Player } from '../../types';
import { useLeague } from '../../hooks/useLeague';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface PlayerFormProps {
    isOpen: boolean;
    onClose: () => void;
    player: Player | null;
}

const PlayerForm: React.FC<PlayerFormProps> = ({ isOpen, onClose, player }) => {
    const { addPlayer, updatePlayer } = useLeague();
    const [name, setName] = useState('');
    const [rank, setRank] = useState<number | ''>('');

    useEffect(() => {
        if (player) {
            setName(player.name);
            setRank(player.rank);
        } else {
            setName('');
            setRank('');
        }
    }, [player, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || rank === '') return;
        
        const playerData = { name, rank: Number(rank) };
        if (player) {
            await updatePlayer(player.id, playerData);
        } else {
            await addPlayer(playerData);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={player ? 'Edit Player' : 'Add Player'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="rank" className="block text-sm font-medium text-gray-700">Rank</label>
                    <input
                        type="number"
                        id="rank"
                        value={rank}
                        onChange={(e) => setRank(e.target.value === '' ? '' : Number(e.target.value))}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">{player ? 'Update' : 'Save'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default PlayerForm;
