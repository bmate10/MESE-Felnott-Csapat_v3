
import React from 'react';
import { Match, AvailabilityStatus, AvailabilityOptions } from '../../types';
import { useLeague } from '../../hooks/useLeague';

interface AvailabilitySelectorProps {
    match: Match;
}

const AvailabilitySelector: React.FC<AvailabilitySelectorProps> = ({ match }) => {
    const { players, updatePlayerAvailability } = useLeague();

    const yesCount = Object.values(match.availability).filter(s => s === 'Yes').length;
    const ifNeededCount = Object.values(match.availability).filter(s => s === 'If Needed').length;

    const getStatusColor = (status: AvailabilityStatus) => {
        switch (status) {
            case 'Yes': return 'bg-green-100 text-green-800';
            case 'No': return 'bg-red-100 text-red-800';
            case 'If Needed': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-green-600">{yesCount}</span>
                    <span className="text-sm text-gray-600">Available</span>
                </div>
                 <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-yellow-600">{ifNeededCount}</span>
                    <span className="text-sm text-gray-600">Reserves</span>
                </div>
            </div>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                {players.map(player => (
                    <div key={player.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <span className="text-sm text-gray-800">{player.name}</span>
                         <select
                            value={match.availability[player.id] || ''}
                            onChange={(e) => updatePlayerAvailability(match.id, player.id, e.target.value as AvailabilityStatus)}
                            className={`border-none rounded text-xs py-1 px-2 focus:ring-0 ${getStatusColor(match.availability[player.id])}`}
                        >
                            <option value="" disabled>Select...</option>
                            {AvailabilityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AvailabilitySelector;
