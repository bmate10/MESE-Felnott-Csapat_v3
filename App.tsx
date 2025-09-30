
import React, { useState, useMemo } from 'react';
import { LeagueProvider } from './context/LeagueContext';
import Header from './components/layout/Header';
import DashboardPage from './components/pages/DashboardPage';
import MatchesPage from './components/pages/MatchesPage';
import PlayersPage from './components/pages/PlayersPage';

type Page = 'dashboard' | 'matches' | 'players';

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

    const renderPage = () => {
        switch (currentPage) {
            case 'matches':
                return <MatchesPage />;
            case 'players':
                return <PlayersPage />;
            case 'dashboard':
            default:
                return <DashboardPage />;
        }
    };
    
    const years = useMemo(() => {
        const startYear = 2023;
        const endYear = new Date().getFullYear() + 1;
        return Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
    }, []);

    return (
        <LeagueProvider year={currentYear}>
            <div className="min-h-screen bg-gray-50 text-gray-800">
                <Header 
                    currentPage={currentPage} 
                    setCurrentPage={setCurrentPage} 
                    currentYear={currentYear}
                    setCurrentYear={setCurrentYear}
                    years={years}
                />
                <main className="p-4 sm:p-6 md:p-8">
                    {renderPage()}
                </main>
            </div>
        </LeagueProvider>
    );
};

export default App;
