import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sun, Cloud, Users, Clock, Play } from 'lucide-react';
import { Header } from './Header';
import { GameState, MatchData } from '../App';

interface LobbyProps {
  gameState: GameState;
  updateGameState: (updates: Partial<GameState>) => void;
}

const generateRandomMatch = (isLive: boolean = false): MatchData => {
  const teams = [
    'Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Man United', 'Tottenham',
    'Barcelona', 'Real Madrid', 'Bayern Munich', 'PSG', 'Juventus', 'AC Milan',
    'Borussia Dortmund', 'Atletico Madrid', 'Inter Milan', 'Ajax'
  ];
  
  const homeTeam = teams[Math.floor(Math.random() * teams.length)];
  let awayTeam = teams[Math.floor(Math.random() * teams.length)];
  while (awayTeam === homeTeam) {
    awayTeam = teams[Math.floor(Math.random() * teams.length)];
  }

  // Generate realistic odds
  const homeOdds = Number((1.5 + Math.random() * 3).toFixed(2));
  const drawOdds = Number((3.0 + Math.random() * 2).toFixed(2));
  const awayOdds = Number((1.5 + Math.random() * 4).toFixed(2));

  // Generate live match data if it's a live match
  const homeScore = isLive ? Math.floor(Math.random() * 4) : 0;
  const awayScore = isLive ? Math.floor(Math.random() * 4) : 0;
  const timeElapsed = isLive ? Math.floor(Math.random() * 90) : 0;
  const playerCount = Math.floor(Math.random() * 150) + 25; // 25-174 players
  
  // Generate start time for upcoming matches (10-130 minutes from now)
  const startTime = !isLive ? (() => {
    const now = new Date();
    const startDate = new Date(now.getTime() + (Math.random() * 120 + 10) * 60000);
    return startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  })() : undefined;

  return {
    id: Date.now().toString() + Math.random(),
    homeTeam,
    awayTeam,
    homeOdds,
    drawOdds,
    awayOdds,
    homeScore,
    awayScore,
    status: isLive ? 'live' : 'not-started',
    timeElapsed,
    playerCount,
    startTime
  };
};

const formatMatchTime = (seconds: number): string => {
  if (seconds < 45 * 60) {
    // First half (0-45 minutes)
    const minutes = Math.floor(seconds / 60);
    return `${minutes}'`;
  } else if (seconds < 46 * 60) {
    // Half time
    return "HT";
  } else {
    // Second half (45-90 minutes)
    const totalMinutes = Math.floor(seconds / 60);
    const displayMinutes = Math.min(totalMinutes - 1, 90); // -1 to account for halftime, max 90
    return `${displayMinutes}'`;
  }
};



export function Lobby({ gameState, updateGameState }: LobbyProps) {
  const [matches, setMatches] = useState<MatchData[]>([]);

  useEffect(() => {
    // Generate initial matches (mix of live and upcoming)
    const initialMatches = [
      generateRandomMatch(true),   // Live match
      generateRandomMatch(true),   // Live match
      generateRandomMatch(false),  // Upcoming match
      generateRandomMatch(false),  // Upcoming match
      generateRandomMatch(true),   // Live match
    ];
    setMatches(initialMatches);

    // Update live matches every 3 seconds
    const interval = setInterval(() => {
      setMatches(prevMatches => 
        prevMatches.map(match => {
          if (match.status === 'live') {
            // Randomly update scores and time
            const shouldUpdateScore = Math.random() < 0.1; // 10% chance
            const newHomeScore = shouldUpdateScore && Math.random() < 0.5 
              ? Math.min(match.homeScore + 1, 5) 
              : match.homeScore;
            const newAwayScore = shouldUpdateScore && Math.random() < 0.5 && !shouldUpdateScore
              ? Math.min(match.awayScore + 1, 5)
              : match.awayScore;
            
            return {
              ...match,
              homeScore: newHomeScore,
              awayScore: newAwayScore,
              timeElapsed: Math.min(match.timeElapsed + Math.floor(Math.random() * 3), 90),
              playerCount: Math.max(20, match.playerCount + Math.floor(Math.random() * 10) - 5)
            };
          }
          return {
            ...match,
            playerCount: Math.max(20, match.playerCount + Math.floor(Math.random() * 6) - 3)
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const startMatch = (matchData: MatchData) => {
    const newMatch = {
      ...matchData,
      status: 'not-started' as const,
      homeScore: 0,
      awayScore: 0,
      timeElapsed: 0
    };
    
    updateGameState({
      currentMatch: newMatch,
      phase: 'match'
    });
  };



  const totalPlayersOnline = matches.reduce((total, match) => total + match.playerCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <Header gameState={gameState} totalPlayersOnline={totalPlayersOnline} updateGameState={updateGameState} />
      
      <div className="max-w-md mx-auto space-y-4 relative z-10 p-3">

        {/* Live Matches Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-gray-300/80 font-normal" style={{ textShadow: '0 1px 0 rgba(255, 255, 255, 0.05), 0 -1px 0 rgba(0, 0, 0, 0.4)' }}>Current Live Matches</h2>
          </div>
          
          {matches.filter(match => match.status === 'live').map((match, index) => (
            <div 
              key={match.id} 
              className="backdrop-blur-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-4 border border-blue-400/30 shadow-xl hover:shadow-2xl hover:bg-blue-500/25 transition-all duration-300"
            >
              {/* Header with team info and join button */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  {index % 2 === 0 ? (
                    <div className="p-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full backdrop-blur-sm border border-yellow-400/30">
                      <Sun size={16} className="text-yellow-400" />
                    </div>
                  ) : (
                    <div className="p-2 bg-gradient-to-r from-gray-400/20 to-slate-400/20 rounded-full backdrop-blur-sm border border-gray-400/30">
                      <Cloud size={16} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm mb-1">
                      {match.homeTeam} v {match.awayTeam}
                    </p>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-blue-500/20 border-blue-400/30 text-blue-300 text-xs">
                        LIVE
                      </Badge>
                      <div className="flex items-center gap-1 text-gray-300 text-xs">
                        <Clock size={12} />
                        {formatMatchTime(match.timeElapsed * 60)}
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => startMatch(match)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 px-6 py-2 rounded-lg font-semibold ml-3 h-10 min-w-[80px]"
                >
                  Join
                </Button>
              </div>

              {/* Score and odds in unified container */}
              <div className="backdrop-blur-sm bg-white/5 rounded-xl p-3 border border-white/10 space-y-3">
                {/* Live Score */}
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">{match.homeTeam}</p>
                    <p className="text-white text-2xl font-bold">{match.homeScore}</p>
                  </div>
                  <div className="text-gray-400 text-lg">-</div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">{match.awayTeam}</p>
                    <p className="text-white text-2xl font-bold">{match.awayScore}</p>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="border-t border-white/10"></div>
                
                {/* Match Odds */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-gray-400 text-xs truncate">{match.homeTeam}</p>
                    <p className="text-white font-bold">{match.homeOdds}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Draw</p>
                    <p className="text-white font-bold">{match.drawOdds}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs truncate">{match.awayTeam}</p>
                    <p className="text-white font-bold">{match.awayOdds}</p>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-center mt-2">
                <div className="flex items-center gap-1 text-gray-300 text-xs">
                  <Users size={12} />
                  {match.playerCount} players betting
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Matches Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h2 className="text-gray-300/80 font-normal" style={{ textShadow: '0 1px 0 rgba(255, 255, 255, 0.05), 0 -1px 0 rgba(0, 0, 0, 0.4)' }}>Upcoming Matches</h2>
          </div>
          
          {matches.filter(match => match.status === 'not-started').map((match, index) => (
            <div 
              key={match.id} 
              className="backdrop-blur-md bg-gradient-to-r from-white/10 to-white/5 rounded-2xl p-4 border border-white/20 shadow-xl hover:shadow-2xl hover:bg-white/15 transition-all duration-300"
            >
              {/* Header with team info and status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  {index % 2 === 0 ? (
                    <div className="p-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full backdrop-blur-sm border border-yellow-400/30">
                      <Sun size={16} className="text-yellow-400" />
                    </div>
                  ) : (
                    <div className="p-2 bg-gradient-to-r from-gray-400/20 to-slate-400/20 rounded-full backdrop-blur-sm border border-gray-400/30">
                      <Cloud size={16} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm mb-1">
                      {match.homeTeam} v {match.awayTeam}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-gray-300 text-xs">
                        <Users size={12} />
                        {match.playerCount} players waiting
                      </div>
                      <div className="flex items-center gap-1 text-blue-300 text-xs">
                        <Clock size={12} />
                        Kicks off {match.startTime}
                      </div>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-500/20 border-blue-400/30 text-blue-300 text-xs px-2 py-1">
                  Upcoming
                </Badge>
              </div>

              {/* Odds container */}
              <div className="backdrop-blur-sm bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-gray-400 text-xs truncate">{match.homeTeam}</p>
                    <p className="text-white font-bold">{match.homeOdds}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Draw</p>
                    <p className="text-white font-bold">{match.drawOdds}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs truncate">{match.awayTeam}</p>
                    <p className="text-white font-bold">{match.awayOdds}</p>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="text-center mt-2">
                <p className="text-gray-400 text-xs">
                  Match starting at {match.startTime}
                </p>
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
}