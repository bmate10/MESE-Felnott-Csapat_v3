
import React, { useState } from 'react';
import { useLeague } from '../../hooks/useLeague';
import MatchCard from '../match/MatchCard';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';
import MatchForm from '../match/MatchForm';

const MatchesPage: React.FC = () => {
    const { matches, loading } = useLeague();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const now = new Date();
    const upcomingMatches = matches.filter(m => m.date.toDate() > now);
    const pastMatches = matches.filter(m => m.date.toDate() <= now);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Matches</h1>
                    <p className="text-lg text-gray-600">View upcoming and past match details.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>Add Match</Button>
            </div>
            
            {loading ? <Spinner /> : (
                <>
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">Upcoming Matches</h2>
                        {upcomingMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcomingMatches.map(match => <MatchCard key={match.id} match={match} />)}
                            </div>
                        ) : (
                            <p className="text-gray-500 mt-4">No upcoming matches.</p>
                        )}
                    </section>
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">Past Matches</h2>
                         {pastMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pastMatches.map(match => <MatchCard key={match.id} match={match} />)}
                            </div>
                        ) : (
                            <p className="text-gray-500 mt-4">No past matches.</p>
                        )}
                    </section>
                </>
            )}
            <MatchForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default MatchesPage;
