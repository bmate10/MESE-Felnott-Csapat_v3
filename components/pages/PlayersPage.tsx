
import React, { useState } from 'react';
import { useLeague } from '../../hooks/useLeague';
import { Player } from '../../types';
import Spinner from '../ui/Spinner';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PlayerForm from '../player/PlayerForm';

const PlayersPage: React.FC = () => {
    const { players, loading, deletePlayer } = useLeague();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

    const handleEdit = (player: Player) => {
        setEditingPlayer(player);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingPlayer(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPlayer(null);
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Players</h1>
                    <p className="text-lg text-gray-600">Manage the team roster for the year.</p>
                </div>
                <Button onClick={handleAdd}>Add Player</Button>
            </div>
            {loading ? <Spinner /> : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {players.map(player => (
                                    <tr key={player.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.rank}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Button variant="secondary" size="sm" onClick={() => handleEdit(player)}>Edit</Button>
                                            <Button variant="danger" size="sm" onClick={() => deletePlayer(player.id)}>Delete</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
            <PlayerForm isOpen={isModalOpen} onClose={closeModal} player={editingPlayer} />
        </div>
    );
};

export default PlayersPage;
