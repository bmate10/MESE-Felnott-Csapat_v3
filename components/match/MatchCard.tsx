
import React, { useState } from 'react';
import { Match } from '../../types';
import Card from '../ui/Card';
import { useLeague } from '../../hooks/useLeague';
import AvailabilitySelector from './AvailabilitySelector';
import LineupSelector from './LineupSelector';
import MatchResultForm from './MatchResultForm';
import MvpVoter from './MvpVoter';
import Button from '../ui/Button';

interface MatchCardProps {
    match: Match;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
    const { deleteMatch } = useLeague();
    const [activeTab, setActiveTab] = useState('availability');
    
    const tabs = ['availability', 'lineup', 'result', 'mvp'];
    
    const isPastMatch = match.date.toDate() <= new Date();

    const renderTabContent = () => {
        switch (activeTab) {
            case 'lineup':
                return <LineupSelector match={match} />;
            case 'result':
                return <MatchResultForm match={match} />;
            case 'mvp':
                return <MvpVoter match={match} />;
            case 'availability':
            default:
                return <AvailabilitySelector match={match} />;
        }
    };

    return (
        <Card className="flex flex-col">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold">{match.opponent}</h3>
                    <p className="text-sm text-gray-500">{match.location}</p>
                    <p className="text-sm text-gray-500">{match.date.toDate().toLocaleString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {match.result.ourScore !== null && match.result.opponentScore !== null && (
                    <div className={`px-3 py-1.5 rounded-full text-md font-semibold ${match.result.ourScore > match.result.opponentScore ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {match.result.ourScore} - {match.result.opponentScore}
                    </div>
                )}
            </div>

            <div className="mt-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${
                                activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } capitalize whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="py-4 flex-grow">
                {renderTabContent()}
            </div>

            {!isPastMatch && (
                 <div className="mt-auto pt-4 border-t border-gray-200 text-right">
                    <Button variant="danger" size="sm" onClick={() => deleteMatch(match.id)}>Delete Match</Button>
                </div>
            )}
        </Card>
    );
};

export default MatchCard;
