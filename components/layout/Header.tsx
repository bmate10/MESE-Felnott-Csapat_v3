
import React from 'react';

type Page = 'dashboard' | 'matches' | 'players';

interface HeaderProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    currentYear: number;
    setCurrentYear: (year: number) => void;
    years: number[];
}

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, currentYear, setCurrentYear, years }) => {
    const navItems: { id: Page; label: string }[] = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'matches', label: 'Matches' },
        { id: 'players', label: 'Players' },
    ];

    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 h-8 w-8"><path d="m12.33 15.3-3.33-3.3a2 2 0 1 1 3.4-2.75l.18.18a2 2 0 1 1-2.75 3.4Z"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 4.14 2.505 7.684 6 9.237V22Z"/><path d="M20 12h-2"/><path d="m18.5 16.9-1.4-1.4"/><path d="M12 6V4"/><path d="m5.5 16.9 1.4-1.4"/></svg>
                        <h1 className="text-xl font-bold text-gray-800">Team Tracker</h1>
                        <nav className="hidden md:flex space-x-4 ml-6">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentPage(item.id)}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        currentPage === item.id 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center">
                        <select
                            value={currentYear}
                            onChange={(e) => setCurrentYear(Number(e.target.value))}
                            className="block w-full pl-3 pr-10 py-2 text-base bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
                 <div className="md:hidden flex space-x-2 pb-3">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentPage(item.id)}
                            className={`px-3 py-2 rounded-md text-sm font-medium w-full text-center ${
                                currentPage === item.id 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
};

export default Header;
