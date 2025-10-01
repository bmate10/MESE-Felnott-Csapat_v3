import React, { useState, useMemo, createContext, useEffect, ReactNode, useCallback, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";

// --- TYPES ---
interface Player { id: string; name: string; rank: number; }
type AvailabilityStatus = 'Yes' | 'No' | 'If Needed';
const AvailabilityOptions: AvailabilityStatus[] = ['Yes', 'No', 'If Needed'];
interface DoublesPair { player1: string | null; player2: string | null; }
interface Lineup { singles: (string | null)[]; doubles: DoublesPair[]; }
interface MatchResult { ourScore: number | null; opponentScore: number | null; }
interface Match { id: string; opponent: string; location: string; date: Timestamp; season: 'Spring' | 'Fall'; availability: Record<string, AvailabilityStatus>; lineup: Lineup; result: MatchResult; mvpVotes: Record<string, number>; }

// --- FIREBASE ---
const firebaseConfig = { apiKey: "AIzaSyAMghujncGAU2U04aG7kEI2BSh2YmEJVKw", authDomain: "budapest-tennis-league-app.firebaseapp.com", projectId: "budapest-tennis-league-app", storageBucket: "budapest-tennis-league-app.firebasestorage.app", messagingSenderId: "1016266790911", appId: "1:1016266790911:web:d31cf354fb078cb566b9ca", measurementId: "G-GLPW7E7M4D" };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- UI COMPONENTS ---
const Spinner: React.FC = () => ( <div className="flex justify-center items-center p-8"> <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div> </div> );

interface CardProps { children: ReactNode; className?: string; }
const Card: React.FC<CardProps> = ({ children, className }) => ( <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 ${className}`}> {children} </div> );

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { children: ReactNode; variant?: 'primary' | 'secondary' | 'danger'; size?: 'sm' | 'md' | 'lg'; }
const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const variantStyles = { primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500', secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400', danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500', };
    const sizeStyles = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base', };
    return <button className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>{children}</button>;
};

interface ModalProps { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; }
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between p-5 border-b rounded-t">
                    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                    <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" onClick={onClose}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </div>
                <div className="p-6 space-y-6">{children}</div>
            </div>
        </div>
    );
};

// --- LEAGUE CONTEXT & HOOK ---
interface LeagueContextType { year: number; players: Player[]; matches: Match[]; loading: boolean; addPlayer: (player: Omit<Player, 'id'>) => Promise<void>; updatePlayer: (playerId: string, player: Partial<Player>) => Promise<void>; deletePlayer: (playerId: string) => Promise<void>; addMatch: (match: Omit<Match, 'id' | 'availability' | 'lineup' | 'result' | 'mvpVotes'>) => Promise<void>; updateMatch: (matchId: string, match: Partial<Match>) => Promise<void>; deleteMatch: (matchId: string) => Promise<void>; updatePlayerAvailability: (matchId: string, playerId: string, status: AvailabilityStatus) => Promise<void>; updateMatchLineup: (matchId: string, lineup: Lineup) => Promise<void>; updateMatchResult: (matchId: string, result: MatchResult) => Promise<void>; addMvpVote: (matchId: string, playerId: string) => Promise<void>; }
const LeagueContext = createContext<LeagueContextType | undefined>(undefined);
interface LeagueProviderProps { children: ReactNode; year: number; }
const LeagueProvider: React.FC<LeagueProviderProps> = ({ children, year }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const getCollectionRef = useCallback((collectionName: 'players' | 'matches') => collection(db, 'years', year.toString(), collectionName), [year]);
    useEffect(() => {
        setLoading(true);
        const playersUnsubscribe = onSnapshot(query(getCollectionRef('players'), orderBy('rank')), (snapshot) => { setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player))); setLoading(false); }, (error) => { console.error("Error fetching players:", error); setLoading(false); });
        const matchesUnsubscribe = onSnapshot(query(getCollectionRef('matches'), orderBy('date')), (snapshot) => { setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match))); }, (error) => console.error("Error fetching matches:", error));
        return () => { playersUnsubscribe(); matchesUnsubscribe(); };
    }, [year, getCollectionRef]);
    const addPlayer = async (player: Omit<Player, 'id'>) => { await addDoc(getCollectionRef('players'), player); };
    const updatePlayer = async (playerId: string, player: Partial<Player>) => { await updateDoc(doc(db, 'years', year.toString(), 'players', playerId), player); };
    const deletePlayer = async (playerId: string) => { await deleteDoc(doc(db, 'years', year.toString(), 'players', playerId)); };
    const addMatch = async (match: Omit<Match, 'id' | 'availability' | 'lineup' | 'result' | 'mvpVotes'>) => { await addDoc(getCollectionRef('matches'), { ...match, availability: {}, lineup: { singles: Array(6).fill(null), doubles: Array(3).fill({ player1: null, player2: null }) }, result: { ourScore: null, opponentScore: null }, mvpVotes: {} }); };
    const updateMatch = async (matchId: string, match: Partial<Match>) => { await updateDoc(doc(db, 'years', year.toString(), 'matches', matchId), match); };
    const deleteMatch = async (matchId: string) => { await deleteDoc(doc(db, 'years', year.toString(), 'matches', matchId)); };
    const updatePlayerAvailability = async (matchId: string, playerId: string, status: AvailabilityStatus) => { await updateDoc(doc(db, 'years', year.toString(), 'matches', matchId), { [`availability.${playerId}`]: status }); };
    const updateMatchLineup = async (matchId: string, lineup: Lineup) => { await updateDoc(doc(db, 'years', year.toString(), 'matches', matchId), { lineup }); };
    const updateMatchResult = async (matchId: string, result: MatchResult) => { await updateDoc(doc(db, 'years', year.toString(), 'matches', matchId), { result }); };
    const addMvpVote = async (matchId: string, playerId: string) => {
        const matchToUpdate = matches.find(m => m.id === matchId); if (!matchToUpdate) return;
        const currentVotes = matchToUpdate.mvpVotes[playerId] || 0;
        await updateDoc(doc(db, 'years', year.toString(), 'matches', matchId), { [`mvpVotes.${playerId}`]: currentVotes + 1 });
    };
    const value = { year, players, matches, loading, addPlayer, updatePlayer, deletePlayer, addMatch, updateMatch, deleteMatch, updatePlayerAvailability, updateMatchLineup, updateMatchResult, addMvpVote };
    return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
};
const useLeague = () => { const context = useContext(LeagueContext); if (context === undefined) { throw new Error('useLeague must be used within a LeagueProvider'); } return context; };

// --- FORM COMPONENTS ---
interface PlayerFormProps { isOpen: boolean; onClose: () => void; player: Player | null; }
const PlayerForm: React.FC<PlayerFormProps> = ({ isOpen, onClose, player }) => {
    const { addPlayer, updatePlayer } = useLeague();
    const [name, setName] = useState('');
    const [rank, setRank] = useState<number | ''>('');
    useEffect(() => { if (player) { setName(player.name); setRank(player.rank); } else { setName(''); setRank(''); } }, [player, isOpen]);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!name || rank === '') return;
        const playerData = { name, rank: Number(rank) };
        if (player) { await updatePlayer(player.id, playerData); } else { await addPlayer(playerData); }
        onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={player ? 'Edit Player' : 'Add Player'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div> <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label> <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required /> </div>
                <div> <label htmlFor="rank" className="block text-sm font-medium text-gray-700">Rank</label> <input type="number" id="rank" value={rank} onChange={(e) => setRank(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required /> </div>
                <div className="flex justify-end space-x-2 pt-4"> <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button> <Button type="submit">{player ? 'Update' : 'Save'}</Button> </div>
            </form>
        </Modal>
    );
};

interface MatchFormProps { isOpen: boolean; onClose: () => void; match?: Match | null; }
const MatchForm: React.FC<MatchFormProps> = ({ isOpen, onClose, match }) => {
    const { addMatch, updateMatch } = useLeague();
    const [opponent, setOpponent] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [season, setSeason] = useState<'Spring' | 'Fall'>('Spring');
    useEffect(() => { if (match) { setOpponent(match.opponent); setLocation(match.location); setDate(match.date.toDate().toISOString().split('T')[0]); setSeason(match.season); } else { setOpponent(''); setLocation(''); setDate(''); setSeason('Spring'); } }, [match, isOpen]);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!opponent || !location || !date) return;
        const matchData = { opponent, location, date: Timestamp.fromDate(new Date(date)), season };
        if (match) { await updateMatch(match.id, matchData); } else { await addMatch(matchData); }
        onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={match ? 'Edit Match' : 'Add Match'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label htmlFor="opponent" className="block text-sm font-medium text-gray-700">Opponent</label><input type="text" id="opponent" value={opponent} onChange={e => setOpponent(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required /></div>
                <div><label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label><input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required /></div>
                <div><label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label><input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required /></div>
                <div><label htmlFor="season" className="block text-sm font-medium text-gray-700">Season</label><select id="season" value={season} onChange={e => setSeason(e.target.value as 'Spring' | 'Fall')} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"><option>Spring</option><option>Fall</option></select></div>
                <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">{match ? 'Update Match' : 'Add Match'}</Button></div>
            </form>
        </Modal>
    );
};


// --- MATCH CARD COMPONENTS ---
interface AvailabilitySelectorProps { match: Match; }
const AvailabilitySelector: React.FC<AvailabilitySelectorProps> = ({ match }) => {
    const { players, updatePlayerAvailability } = useLeague();
    const yesCount = Object.values(match.availability).filter(s => s === 'Yes').length;
    const ifNeededCount = Object.values(match.availability).filter(s => s === 'If Needed').length;
    const getStatusColor = (status: AvailabilityStatus) => { switch (status) { case 'Yes': return 'bg-green-100 text-green-800'; case 'No': return 'bg-red-100 text-red-800'; case 'If Needed': return 'bg-yellow-100 text-yellow-800'; default: return 'bg-gray-100 text-gray-800'; } };
    return (
        <div className="space-y-4">
            <div className="flex space-x-4">
                <div className="flex items-center space-x-2"><span className="text-lg font-bold text-green-600">{yesCount}</span><span className="text-sm text-gray-600">Available</span></div>
                <div className="flex items-center space-x-2"><span className="text-lg font-bold text-yellow-600">{ifNeededCount}</span><span className="text-sm text-gray-600">Reserves</span></div>
            </div>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                {players.map(player => (
                    <div key={player.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <span className="text-sm text-gray-800">{player.name}</span>
                        <select value={match.availability[player.id] || ''} onChange={(e) => updatePlayerAvailability(match.id, player.id, e.target.value as AvailabilityStatus)} className={`border-none rounded text-xs py-1 px-2 focus:ring-0 ${getStatusColor(match.availability[player.id])}`}>
                            <option value="" disabled>Select...</option>
                            {AvailabilityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface LineupSelectorProps { match: Match; }
const LineupSelector: React.FC<LineupSelectorProps> = ({ match }) => {
    const { players, updateMatchLineup } = useLeague();
    const availablePlayers = useMemo(() => players.filter(p => match.availability[p.id] === 'Yes' || match.availability[p.id] === 'If Needed'), [players, match.availability]);
    const handleLineupChange = (updatedLineup: Lineup) => { updateMatchLineup(match.id, updatedLineup); };
    const handleSinglesChange = (index: number, playerId: string) => { const newSingles = [...match.lineup.singles]; newSingles[index] = playerId || null; handleLineupChange({ ...match.lineup, singles: newSingles }); };
    const handleDoublesChange = (pairIndex: number, playerPosition: 'player1' | 'player2', playerId: string) => { const newDoubles = [...match.lineup.doubles]; newDoubles[pairIndex] = { ...newDoubles[pairIndex], [playerPosition]: playerId || null }; handleLineupChange({ ...match.lineup, doubles: newDoubles }); };
    const PlayerSelect: React.FC<{ value: string | null, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ value, onChange }) => (
        <select value={value || ''} onChange={onChange} className="mt-1 block w-full pl-2 pr-8 py-1.5 text-sm bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md">
            <option value="">- Select Player -</option>
            {availablePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
    );
    return (
        <div className="space-y-6">
            <div><h4 className="font-semibold text-gray-700">Singles</h4><div className="grid grid-cols-2 gap-4 mt-2">{Array.from({ length: 6 }).map((_, i) => (<div key={i}><label className="text-sm text-gray-500">S{i + 1}</label><PlayerSelect value={match.lineup.singles[i]} onChange={(e) => handleSinglesChange(i, e.target.value)} /></div>))}</div></div>
            <div><h4 className="font-semibold text-gray-700">Doubles</h4><div className="space-y-3 mt-2">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="p-2 border rounded-md"><label className="text-sm text-gray-500 font-medium">D{i + 1}</label><div className="grid grid-cols-2 gap-2 mt-1"><PlayerSelect value={match.lineup.doubles[i]?.player1} onChange={(e) => handleDoublesChange(i, 'player1', e.target.value)} /><PlayerSelect value={match.lineup.doubles[i]?.player2} onChange={(e) => handleDoublesChange(i, 'player2', e.target.value)} /></div></div>))}</div></div>
        </div>
    );
};

interface MatchResultFormProps { match: Match; }
const MatchResultForm: React.FC<MatchResultFormProps> = ({ match }) => {
    const { updateMatchResult } = useLeague();
    const [ourScore, setOurScore] = useState<number | ''>(match.result.ourScore ?? '');
    const [opponentScore, setOpponentScore] = useState<number | ''>(match.result.opponentScore ?? '');
    useEffect(() => { setOurScore(match.result.ourScore ?? ''); setOpponentScore(match.result.opponentScore ?? ''); }, [match.result]);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); updateMatchResult(match.id, { ourScore: ourScore === '' ? null : Number(ourScore), opponentScore: opponentScore === '' ? null : Number(opponentScore) }); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-4">
                <div className="flex-1"><label className="block text-sm font-medium text-gray-700">Our Score</label><input type="number" value={ourScore} onChange={(e) => setOurScore(e.target.value === '' ? '' : parseInt(e.target.value, 10))} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" /></div>
                <div className="pt-6 font-bold text-gray-600">-</div>
                <div className="flex-1"><label className="block text-sm font-medium text-gray-700">Opponent Score</label><input type="number" value={opponentScore} onChange={(e) => setOpponentScore(e.target.value === '' ? '' : parseInt(e.target.value, 10))} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" /></div>
            </div>
            <div className="text-right"><Button type="submit">Update Score</Button></div>
        </form>
    );
};

interface MvpVoterProps { match: Match; }
const MvpVoter: React.FC<MvpVoterProps> = ({ match }) => {
    const { players, addMvpVote } = useLeague();
    const lineupPlayerIds = useMemo(() => { const ids = new Set<string>(); match.lineup.singles.forEach(id => id && ids.add(id)); match.lineup.doubles.forEach(pair => { pair.player1 && ids.add(pair.player1); pair.player2 && ids.add(pair.player2); }); return Array.from(ids); }, [match.lineup]);
    const lineupPlayers = useMemo(() => players.filter(p => lineupPlayerIds.includes(p.id)), [players, lineupPlayerIds]);
    const sortedVotes = useMemo(() => Object.entries(match.mvpVotes || {}).map(([playerId, votes]) => ({ playerId, name: players.find(p => p.id === playerId)?.name || 'Unknown Player', votes: Number(votes) || 0, })).sort((a, b) => b.votes - a.votes), [match.mvpVotes, players]);
    const totalVotes = sortedVotes.reduce((sum, current) => sum + current.votes, 0);
    if (lineupPlayers.length === 0) { return <p className="text-sm text-gray-500">No lineup set for this match yet.</p>; }
    return (
        <div className="space-y-4">
            <div> <h4 className="font-semibold text-gray-700 mb-2">Vote for MVP</h4> <div className="grid grid-cols-2 sm:grid-cols-3 gap-2"> {lineupPlayers.map(player => (<Button key={player.id} variant="secondary" size="sm" onClick={() => addMvpVote(match.id, player.id)}>{player.name}</Button>))} </div> </div>
            <div> <h4 className="font-semibold text-gray-700 mb-2">Results</h4> {sortedVotes.length > 0 ? ( <div className="space-y-2"> {sortedVotes.map(item => ( <div key={item.playerId} className="text-sm"> <div className="flex justify-between items-center mb-1"> <span>{item.name}</span> <span className="font-medium">{item.votes}</span> </div> <div className="w-full bg-gray-200 rounded-full h-2"> <div className="bg-blue-600 h-2 rounded-full" style={{ width: totalVotes > 0 ? `${(item.votes / totalVotes) * 100}%` : '0%' }} ></div> </div> </div> ))} </div> ) : ( <p className="text-sm text-gray-500">No votes yet.</p> )} </div>
        </div>
    );
};

interface MatchCardProps { match: Match; }
const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
    const { deleteMatch } = useLeague();
    const [activeTab, setActiveTab] = useState('availability');
    const tabs = ['availability', 'lineup', 'result', 'mvp'];
    const isPastMatch = match.date.toDate() <= new Date();
    const renderTabContent = () => { switch (activeTab) { case 'lineup': return <LineupSelector match={match} />; case 'result': return <MatchResultForm match={match} />; case 'mvp': return <MvpVoter match={match} />; default: return <AvailabilitySelector match={match} />; } };
    return (
        <Card className="flex flex-col">
            <div className="flex justify-between items-start">
                <div> <h3 className="text-xl font-bold">{match.opponent}</h3> <p className="text-sm text-gray-500">{match.location}</p> <p className="text-sm text-gray-500">{match.date.toDate().toLocaleString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p> </div>
                {match.result.ourScore !== null && match.result.opponentScore !== null && ( <div className={`px-3 py-1.5 rounded-full text-md font-semibold ${match.result.ourScore > match.result.opponentScore ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}> {match.result.ourScore} - {match.result.opponentScore} </div> )}
            </div>
            <div className="mt-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs"> {tabs.map(tab => ( <button key={tab} onClick={() => setActiveTab(tab)} className={`${ activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' } capitalize whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`} > {tab} </button> ))} </nav>
            </div>
            <div className="py-4 flex-grow">{renderTabContent()}</div>
            {!isPastMatch && ( <div className="mt-auto pt-4 border-t border-gray-200 text-right"> <Button variant="danger" size="sm" onClick={() => deleteMatch(match.id)}>Delete Match</Button> </div> )}
        </Card>
    );
};

// --- PAGE COMPONENTS ---
const PlayersPage: React.FC = () => {
    const { players, loading, deletePlayer } = useLeague();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const handleEdit = (player: Player) => { setEditingPlayer(player); setIsModalOpen(true); };
    const handleAdd = () => { setEditingPlayer(null); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingPlayer(null); };
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold text-gray-900">Players</h1><p className="text-lg text-gray-600">Manage the team roster for the year.</p></div><Button onClick={handleAdd}>Add Player</Button></div>
            {loading ? <Spinner /> : (<Card><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th><th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{players.map(player => (<tr key={player.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.rank}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.name}</td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2"><Button variant="secondary" size="sm" onClick={() => handleEdit(player)}>Edit</Button><Button variant="danger" size="sm" onClick={() => deletePlayer(player.id)}>Delete</Button></td></tr>))}</tbody></table></div></Card>)}
            <PlayerForm isOpen={isModalOpen} onClose={closeModal} player={editingPlayer} />
        </div>
    );
};

const MatchesPage: React.FC = () => {
    const { matches, loading } = useLeague();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const now = new Date();
    const upcomingMatches = matches.filter(m => m.date.toDate() > now);
    const pastMatches = matches.filter(m => m.date.toDate() <= now);
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold text-gray-900">Matches</h1><p className="text-lg text-gray-600">View upcoming and past match details.</p></div><Button onClick={() => setIsModalOpen(true)}>Add Match</Button></div>
            {loading ? <Spinner /> : (<> <section> <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">Upcoming Matches</h2> {upcomingMatches.length > 0 ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {upcomingMatches.map(match => <MatchCard key={match.id} match={match} />)} </div> ) : ( <p className="text-gray-500 mt-4">No upcoming matches.</p> )} </section> <section> <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">Past Matches</h2> {pastMatches.length > 0 ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {pastMatches.map(match => <MatchCard key={match.id} match={match} />)} </div> ) : ( <p className="text-gray-500 mt-4">No past matches.</p> )} </section> </>)}
            <MatchForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

const DashboardPage: React.FC = () => {
    const { matches, loading, year, players } = useLeague();
    const now = new Date();
    const upcomingMatches = matches.filter(match => match.date.toDate() > now).sort((a, b) => a.date.toMillis() - b.date.toMillis());
    const pastMatches = matches.filter(match => match.date.toDate() <= now && match.result.ourScore !== null).sort((a, b) => b.date.toMillis() - a.date.toMillis());
    const wins = pastMatches.filter(m => m.result.ourScore !== null && m.result.opponentScore !== null && m.result.ourScore > m.result.opponentScore).length;
    const losses = pastMatches.length - wins;
    const winRate = pastMatches.length > 0 ? ((wins / pastMatches.length) * 100).toFixed(0) : 0;
    const season = now.getMonth() >= 1 && now.getMonth() <= 6 ? 'Spring' : 'Fall';
    if (loading) return <Spinner />;
    const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => ( <Card><h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3><p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>{description && <p className="text-sm text-gray-500">{description}</p>}</Card> );
    
    const MatchListItem: React.FC<{ match: Match }> = ({ match }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const getPlayerName = useCallback((playerId: string | null): React.ReactNode => {
            if (!playerId) return <span className="text-gray-400 italic">Empty</span>;
            const player = players.find(p => p.id === playerId);
            return player ? player.name : <span className="text-red-500">Unknown</span>;
        }, [players]);
    
        const hasLineup = useMemo(() =>
            match.lineup.singles.some(p => p !== null) ||
            match.lineup.doubles.some(p => p.player1 !== null || p.player2 !== null),
        [match.lineup]);
    
        return (
            <li className="py-4 border-b border-gray-200 last:border-b-0">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-gray-900">{match.opponent}</p>
                        <p className="text-sm text-gray-500">{match.location} &middot; {match.date.toDate().toLocaleDateString()}</p>
                    </div>
                    {hasLineup && (
                        <Button variant="secondary" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                            {isExpanded ? 'Hide' : 'Lineup'}
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ml-2 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </Button>
                    )}
                </div>
                {isExpanded && hasLineup && (
                    <div className="mt-4 pl-2 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Selected Lineup</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div>
                                <h5 className="font-medium text-gray-800 mb-1">Singles</h5>
                                <ol className="list-decimal list-inside space-y-1">
                                    {match.lineup.singles.map((playerId, index) => (
                                        <li key={`s-${index}`} className="ml-2">
                                            {getPlayerName(playerId)}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                            <div>
                                <h5 className="font-medium text-gray-800 mb-1">Doubles</h5>
                                <div className="space-y-2">
                                    {match.lineup.doubles.map((pair, index) => (
                                        <div key={`d-${index}`}>
                                            <p className="font-semibold text-gray-600">D{index + 1}</p>
                                            <div className="pl-4 text-gray-700">
                                                <p>{getPlayerName(pair.player1)}</p>
                                                <p>{getPlayerName(pair.player2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </li>
        );
    };

    return (
        <div className="space-y-8">
            <header><h1 className="text-3xl font-bold text-gray-900">Dashboard</h1><p className="text-lg text-gray-600">{year} {season} Season</p></header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"><StatCard title="Win Rate" value={`${winRate}%`} description={`${wins} Wins / ${losses} Losses`} /><StatCard title="Matches Played" value={pastMatches.length} /><StatCard title="Upcoming Matches" value={upcomingMatches.length} /><StatCard title="Current Season" value={season} /></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card><h2 className="text-xl font-semibold mb-4">Upcoming Matches</h2>{upcomingMatches.length > 0 ? (<ul className="divide-y divide-gray-200">{upcomingMatches.slice(0, 5).map(match => <MatchListItem key={match.id} match={match} />)}</ul>) : (<p className="text-gray-500">No upcoming matches scheduled.</p>)}</Card>
                <Card><h2 className="text-xl font-semibold mb-4">Recent Results</h2>{pastMatches.length > 0 ? (<ul className="divide-y divide-gray-200">{pastMatches.slice(0, 5).map(match => (<li key={match.id} className="flex justify-between items-center py-3"><div><p className="font-semibold">{match.opponent}</p><p className="text-sm text-gray-500">{match.date.toDate().toLocaleDateString()}</p></div><div className={`px-2 py-1 rounded-full text-sm font-medium ${match.result.ourScore! > match.result.opponentScore! ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{match.result.ourScore} - {match.result.opponentScore}</div></li>))}</ul>) : (<p className="text-gray-500">No matches played yet.</p>)}</Card>
            </div>
        </div>
    );
};

// --- LAYOUT & APP ---
type Page = 'dashboard' | 'matches' | 'players';
interface HeaderProps { currentPage: Page; setCurrentPage: (page: Page) => void; currentYear: number; setCurrentYear: (year: number) => void; years: number[]; }
const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, currentYear, setCurrentYear, years }) => {
    const navItems: { id: Page; label: string }[] = [{ id: 'dashboard', label: 'Dashboard' }, { id: 'matches', label: 'Matches' }, { id: 'players', label: 'Players' }];
    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 h-8 w-8"><path d="m12.33 15.3-3.33-3.3a2 2 0 1 1 3.4-2.75l.18.18a2 2 0 1 1-2.75 3.4Z"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 4.14 2.505 7.684 6 9.237V22Z"/><path d="M20 12h-2"/><path d="m18.5 16.9-1.4-1.4"/><path d="M12 6V4"/><path d="m5.5 16.9 1.4-1.4"/></svg><h1 className="text-xl font-bold text-gray-800">Team Tracker</h1><nav className="hidden md:flex space-x-4 ml-6">{navItems.map(item => (<button key={item.id} onClick={() => setCurrentPage(item.id)} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${ currentPage === item.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100' }`}>{item.label}</button>))}</nav></div>
                    <div className="flex items-center"><select value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))} className="block w-full pl-3 pr-10 py-2 text-base bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">{years.map(year => (<option key={year} value={year}>{year}</option>))}</select></div>
                </div>
                <div className="md:hidden flex space-x-2 pb-3">{navItems.map(item => (<button key={item.id} onClick={() => setCurrentPage(item.id)} className={`px-3 py-2 rounded-md text-sm font-medium w-full text-center ${ currentPage === item.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100' }`}>{item.label}</button>))}</div>
            </div>
        </header>
    );
};

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
    const renderPage = () => { switch (currentPage) { case 'matches': return <MatchesPage />; case 'players': return <PlayersPage />; default: return <DashboardPage />; } };
    const years = useMemo(() => { const startYear = 2023; const endYear = new Date().getFullYear() + 1; return Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i); }, []);
    return (
        <LeagueProvider year={currentYear}>
            <div className="min-h-screen bg-gray-50 text-gray-800">
                <Header currentPage={currentPage} setCurrentPage={setCurrentPage} currentYear={currentYear} setCurrentYear={setCurrentYear} years={years} />
                <main className="p-4 sm:p-6 md:p-8">{renderPage()}</main>
            </div>
        </LeagueProvider>
    );
};

// --- RENDER ---
const rootElement = document.getElementById('root');
if (!rootElement) { throw new Error("Could not find root element to mount to"); }
const root = ReactDOM.createRoot(rootElement);
root.render( <React.StrictMode> <App /> </React.StrictMode> );
