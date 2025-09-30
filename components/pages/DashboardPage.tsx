
import React from 'react';
import { useLeague } from '../../hooks/useLeague';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { Match } from '../../types';

const DashboardPage: React.FC = () => {
    const { matches, loading, year } = useLeague();
    const now = new Date();

    const upcomingMatches = matches
        .filter(match => match.date.toDate() > now)
        .sort((a, b) => a.date.toMillis() - b.date.toMillis());
        
    const pastMatches = matches
        .filter(match => match.date.toDate() <= now && match.result.ourScore !== null)
        .sort((a, b) => b.date.toMillis() - a.date.toMillis());

    const wins = pastMatches.filter(m => m.result.ourScore !== null && m.result.opponentScore !== null && m.result.ourScore > m.result.opponentScore).length;
    const losses = pastMatches.length - wins;
    const winRate = pastMatches.length > 0 ? ((wins / pastMatches.length) * 100).toFixed(0) : 0;

    const currentMonth = now.getMonth();
    const season = currentMonth >= 1 && currentMonth <= 6 ? 'Spring' : 'Fall';

    if (loading) return <Spinner />;

    const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
        <Card>
            <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
            {description && <p className="text-sm text-gray-500">{description}</p>}
        </Card>
    );

    const MatchListItem: React.FC<{match: Match}> = ({ match }) => (
        <li className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
            <div>
                <p className="font-semibold">{match.opponent}</p>
                <p className="text-sm text-gray-500">{match.location}</p>
            </div>
            <p className="text-sm text-gray-600">{match.date.toDate().toLocaleDateString()}</p>
        </li>
    );

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-lg text-gray-600">{year} {season} Season</p>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Win Rate" value={`${winRate}%`} description={`${wins} Wins / ${losses} Losses`}/>
                <StatCard title="Matches Played" value={pastMatches.length} />
                <StatCard title="Upcoming Matches" value={upcomingMatches.length} />
                <StatCard title="Current Season" value={season} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-xl font-semibold mb-4">Upcoming Matches</h2>
                    {upcomingMatches.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                           {upcomingMatches.slice(0, 5).map(match => <MatchListItem key={match.id} match={match} />)}
                        </ul>
                    ) : (
                        <p className="text-gray-500">No upcoming matches scheduled.</p>
                    )}
                </Card>
                <Card>
                    <h2 className="text-xl font-semibold mb-4">Recent Results</h2>
                    {pastMatches.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                           {pastMatches.slice(0, 5).map(match => (
                               <li key={match.id} className="flex justify-between items-center py-3">
                                   <div>
                                       <p className="font-semibold">{match.opponent}</p>
                                       <p className="text-sm text-gray-500">{match.date.toDate().toLocaleDateString()}</p>
                                   </div>
                                   <div className={`px-2 py-1 rounded-full text-sm font-medium ${match.result.ourScore! > match.result.opponentScore! ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                       {match.result.ourScore} - {match.result.opponentScore}
                                   </div>
                               </li>
                           ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">No matches played yet.</p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
