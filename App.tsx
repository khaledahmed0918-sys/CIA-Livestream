
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchChannelStatuses } from './services/kickService';
// FIX: Import `KickApiResponse` to resolve 'Cannot find name' error.
import type { KickApiResponse, Channel } from './types';
import { KICK_STREAMERS, POLLING_INTERVAL_SECONDS } from './constants';
import { StreamerCard } from './components/StreamerCard';
import { ThemeToggle } from './components/ThemeToggle';
import { TagFilter } from './components/TagFilter';

const App: React.FC = () => {
  const [streamerData, setStreamerData] = useState<KickApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<'status' | 'viewers_desc'>('status');

  const allTags = useMemo(() => {
    const tags = KICK_STREAMERS.flatMap(streamer => streamer.tags);
    return [...new Set(tags)].sort();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchChannelStatuses(KICK_STREAMERS);
      setStreamerData(data);
      setLastUpdated(new Date(data.checked_at));
      setError(null);
    // FIX: Added a block statement `{}` to the catch clause to fix the syntax error.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, POLLING_INTERVAL_SECONDS * 1000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const sortedStreamers = useMemo(() => {
    if (!streamerData?.data) return [];
    
    const streamersToSort: Channel[] = [...streamerData.data];

    if (sortOption === 'viewers_desc') {
      streamersToSort.sort((a, b) => {
        // Live streamers before offline ones
        if (a.is_live && !b.is_live) return -1;
        if (!a.is_live && b.is_live) return 1;
        // If both are live, sort by viewer count descending
        if (a.is_live && b.is_live) {
          return (b.viewer_count ?? 0) - (a.viewer_count ?? 0);
        }
        // If both are offline, sort by username
        return a.username.localeCompare(b.username);
      });
    } else { // 'status' sort (default)
      streamersToSort.sort((a, b) => {
        if (a.is_live && !b.is_live) return -1;
        if (!a.is_live && b.is_live) return 1;
        if (a.is_live && b.is_live) {
          return new Date(b.live_since!).getTime() - new Date(a.live_since!).getTime();
        }
        return a.username.localeCompare(b.username);
      });
    }
    return streamersToSort;
  }, [streamerData, sortOption]);

  const filteredStreamers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    let streamers = sortedStreamers;

    if (selectedTags.length > 0) {
      streamers = streamers.filter(streamer =>
        streamer.tags && streamer.tags.some(tag => selectedTags.includes(tag))
      );
    }
    
    if (query) {
       streamers = streamers.filter(streamer => 
        streamer.username.toLowerCase().includes(query) ||
        streamer.display_name.toLowerCase().includes(query) ||
        (streamer.character && streamer.character.toLowerCase().includes(query))
      );
    }
    
    return streamers;
  }, [sortedStreamers, searchQuery, selectedTags]);

  return (
    <div className="min-h-screen w-full text-black/90 transition-colors duration-300 dark:text-white/90">
      <div className="fixed top-0 left-0 w-full h-full -z-10"></div>
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col items-center mb-12 relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <img 
            src="https://cdn.discordapp.com/attachments/1370075497559756962/1435254475970314311/00WZrbng.png?ex=690b4c64&is=6909fae4&hm=edacf00cf646f04b92089cea9f13160f87d13891b0590bed4b8aa508f25174d4&$0" 
            alt="CIA Logo" 
            className="w-24 h-24 rounded-full border-2 border-white/20 shadow-lg mb-4 transform -translate-x-3"
          />
          <h1 className="text-5xl font-bold tracking-[0.5em] text-black dark:text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
            C I A
          </h1>
          <h2 className="text-xl font-semibold text-black/80 dark:text-white/80 mt-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Live Streams
          </h2>

          <div className="w-full max-w-4xl mx-auto mt-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-1/3">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search streamer..."
                className="w-full py-3 pl-11 pr-4 text-black bg-white/20 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-black/20 dark:placeholder-gray-400 backdrop-blur-sm transition-all"
                aria-label="Filter streamers by name"
              />
            </div>
            <div className="w-full sm:w-1/3">
               <TagFilter
                 allTags={allTags}
                 selectedTags={selectedTags}
                 onSelectedTagsChange={setSelectedTags}
               />
            </div>
             <div className="relative w-full sm:w-1/3">
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as 'status' | 'viewers_desc')}
                    className="w-full py-3 pl-4 pr-10 text-black bg-white/20 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-black/20 backdrop-blur-sm transition-all appearance-none"
                    aria-label="Sort streamers"
                >
                    <option value="status">Sort by Status</option>
                    <option value="viewers_desc">Viewers (High to Low)</option>
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                    </svg>
                </span>
            </div>
          </div>

          {lastUpdated && (
             <p className="text-sm text-black/60 dark:text-white/60 mt-4">
               Last Updated: {lastUpdated.toLocaleTimeString()}
             </p>
          )}
        </header>

        {error && (
          <div className="text-center bg-red-500/20 text-red-300 p-4 rounded-lg mb-8">
            <p><strong>API Error:</strong> {error}</p>
            <p>Displaying last known data. Will retry automatically.</p>
          </div>
        )}

        {streamerData ? (
          <>
            <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStreamers.map((streamer) => (
                <StreamerCard key={streamer.username} streamer={streamer} />
              ))}
            </main>
            {filteredStreamers.length === 0 && (searchQuery || selectedTags.length > 0) && (
              <div className="text-center py-16 text-black/80 dark:text-white/80">
                <h3 className="text-2xl font-bold">No Streamers Found</h3>
                <p className="mt-2 text-base text-black/60 dark:text-white/60">Your filter criteria did not match any streamers.</p>
              </div>
            )}
          </>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-white/20 bg-white/5 p-5 shadow-lg backdrop-blur-lg animate-pulse">
                    <div className="flex items-center gap-4 mt-12">
                        <div className="h-16 w-16 rounded-full bg-black/20 dark:bg-white/10"></div>
                        <div className="flex-1 space-y-3">
                            <div className="h-4 w-3/4 rounded bg-black/20 dark:bg-white/10"></div>
                            <div className="h-3 w-1/2 rounded bg-black/20 dark:bg-white/10"></div>
                        </div>
                    </div>
                    <div className="mt-4 h-3 w-full rounded bg-black/20 dark:bg-white/10"></div>
                    <div className="mt-2 h-3 w-2/3 rounded bg-black/20 dark:bg-white/10"></div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default App;
