import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { LeagueService, League } from '@/services/LeagueService';
import { useSearchParams, useLocation } from 'react-router-dom';

interface LeagueContextType {
  activeLeagueId: string | null;
  activeLeague: League | null;
  userLeagues: League[];
  setActiveLeagueId: (leagueId: string | null) => void;
  loading: boolean;
  error: string | null;
  refreshLeagues: () => Promise<void>;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
};

interface LeagueProviderProps {
  children: ReactNode;
}

export const LeagueProvider: React.FC<LeagueProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  const [activeLeagueId, setActiveLeagueIdState] = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract league_id from URL params if present
  const urlLeagueId = searchParams.get('league');

  // Load user's leagues
  const loadUserLeagues = async () => {
    if (!user) {
      setUserLeagues([]);
      setActiveLeagueIdState(null);
      setActiveLeague(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { leagues, error: leaguesError } = await LeagueService.getUserLeagues(user.id);
      
      if (leaguesError) {
        setError('Failed to load your leagues');
        setLoading(false);
        return;
      }

      setUserLeagues(leagues || []);

      // Determine active league:
      // 1. Use league_id from URL if present and valid
      // 2. Otherwise use first league
      // 3. Otherwise null
      let selectedLeagueId: string | null = null;
      
      if (urlLeagueId && leagues?.some(l => l.id === urlLeagueId)) {
        selectedLeagueId = urlLeagueId;
      } else if (leagues && leagues.length > 0) {
        selectedLeagueId = leagues[0].id;
        // Update URL if no league param but we have leagues
        if (!urlLeagueId) {
          const newParams = new URLSearchParams(searchParams);
          newParams.set('league', selectedLeagueId);
          setSearchParams(newParams, { replace: true });
        }
      }

      setActiveLeagueIdState(selectedLeagueId);
      
      // Load full league details
      if (selectedLeagueId) {
        const selectedLeague = leagues?.find(l => l.id === selectedLeagueId);
        setActiveLeague(selectedLeague || null);
      } else {
        setActiveLeague(null);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading leagues:', err);
      setError('Failed to load leagues');
      setLoading(false);
    }
  };

  // Set active league and update URL
  const setActiveLeagueId = (leagueId: string | null) => {
    setActiveLeagueIdState(leagueId);
    
    if (leagueId) {
      const league = userLeagues.find(l => l.id === leagueId);
      setActiveLeague(league || null);
      
      // Update URL param
      const newParams = new URLSearchParams(searchParams);
      newParams.set('league', leagueId);
      setSearchParams(newParams, { replace: true });
    } else {
      setActiveLeague(null);
      // Remove league param from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('league');
      setSearchParams(newParams, { replace: true });
    }
  };

  // Refresh leagues list
  const refreshLeagues = async () => {
    await loadUserLeagues();
  };

  // Load leagues on mount and when user changes
  useEffect(() => {
    loadUserLeagues();
  }, [user]);

  // Update active league when URL param changes
  useEffect(() => {
    if (urlLeagueId && urlLeagueId !== activeLeagueId) {
      const league = userLeagues.find(l => l.id === urlLeagueId);
      if (league) {
        setActiveLeagueIdState(urlLeagueId);
        setActiveLeague(league);
      }
    }
  }, [urlLeagueId, userLeagues]);

  const value: LeagueContextType = {
    activeLeagueId,
    activeLeague,
    userLeagues,
    setActiveLeagueId,
    loading,
    error,
    refreshLeagues,
  };

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
};

