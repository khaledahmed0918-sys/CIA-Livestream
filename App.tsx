import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchChannelStatuses } from './services/kickService';
import type { KickApiResponse, Channel } from './types';
import { KICK_STREAMERS, POLLING_INTERVAL_SECONDS } from './constants';
import { StreamerCard } from './components/StreamerCard';
import { ThemeToggle } from './components/ThemeToggle';
import { TagFilter } from './components/TagFilter';
import { useLocalization } from './hooks/useLocalization';
import { requestNotificationPermission, registerServiceWorker, showLiveNotification } from './utils/notificationManager';
import { StreamerModal } from './StreamerModal';

// LanguageToggle Component
const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLocalization();
  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-full bg-black/10 dark:bg-white/10 text-black dark:text-white backdrop-blur-sm transition-colors"
      aria-label={`Switch to ${language === 'en' ? 'Arabic' : 'English'}`}
    >
      <span className="font-bold text-lg">{language === 'en' ? 'AR' : 'EN'}</span>
    </button>
  );
};

// NotificationsToggle Component
const NotificationsToggle: React.FC<{enabled: boolean, onToggle: (e: boolean) => void, permission: NotificationPermission | null}> = ({ enabled, onToggle, permission }) => {
  const { t } = useLocalization();
  const tooltipText = permission === 'denied' 
    ? t('notificationsBlocked') 
    : enabled ? t('notificationsDisable') : t('notificationsEnable');

  return (
    <div className="group relative">
      <button
        onClick={() => onToggle(!enabled)}
        disabled={permission === 'denied'}
        className="p-2 rounded-full bg-black/10 dark:bg-white/10 text-black dark:text-white backdrop-blur-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={tooltipText}
      >
        {enabled ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9m-9 4l18-18" />
          </svg>
        )}
      </button>
      <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 rounded bg-gray-800 p-2 text-xs text-white transition-all w-max max-w-xs text-center z-20">
        {tooltipText}
      </span>
    </div>
  );
};

const App: React.FC = () => {
  const { t } = useLocalization();
  const [streamerData, setStreamerData] = useState<KickApiResponse | null>(null);
  const prevStreamerDataRef = useRef<KickApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortOption, setSortOption] = useState<'status' | 'viewers_desc'>('status');
  const [selectedStreamer, setSelectedStreamer] = useState<Channel | null>(null);
  const [isLinksCopied, setIsLinksCopied] = useState(false);
  
  // Notification State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [streamerNotificationSettings, setStreamerNotificationSettings] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    setNotificationPermission(typeof Notification !== 'undefined' ? Notification.permission : null);
    registerServiceWorker();
    const settings = JSON.parse(localStorage.getItem('streamerNotifications') || '{}');
    setStreamerNotificationSettings(settings);
  }, []);
  
  const updateStreamerNotificationSetting = async (streamerName: string, enabled: boolean) => {
    if (enabled) { // Trying to enable
        let permission = notificationPermission;
        if (permission !== 'granted') {
            permission = await requestNotificationPermission();
            setNotificationPermission(permission);
        }
        
        if (permission !== 'granted') {
            return; // User denied or dismissed, don't enable
        }
    }

    const newSettings = { ...streamerNotificationSettings, [streamerName]: enabled };
    setStreamerNotificationSettings(newSettings);
    localStorage.setItem('streamerNotifications', JSON.stringify(newSettings));
  };

  const handleToggleAllNotifications = async (enable: boolean) => {
      let permission = notificationPermission;
      if (enable && permission !== 'granted') {
          permission = await requestNotificationPermission();
          setNotificationPermission(permission);
      }
      
      if (permission !== 'granted' && enable) {
          return; // Don't enable if permission denied
      }

      const newSettings = { ...streamerNotificationSettings };
      KICK_STREAMERS.forEach(s => {
          newSettings[s.username] = enable;
      });
      setStreamerNotificationSettings(newSettings);
      localStorage.setItem('streamerNotifications', JSON.stringify(newSettings));
  };

  const areAnyNotificationsEnabled = useMemo(() => {
    return Object.values(streamerNotificationSettings).some(v => v === true);
  }, [streamerNotificationSettings]);

  const allTags = useMemo(() => {
    const tags = KICK_STREAMERS.flatMap(streamer => streamer.tags);
    return [...new Set(tags)].sort();
  }, []);

  const allCategories = useMemo(() => {
    if (!streamerData?.data) return [];
    const categories = streamerData.data
      .map(streamer => streamer.live_category)
      .filter((category): category is string => !!category && category.trim() !== '');
    return [...new Set(categories)].sort();
  }, [streamerData]);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchChannelStatuses(KICK_STREAMERS);
      
      if(prevStreamerDataRef.current) {
        data.data.forEach(currentStreamer => {
            const prevStreamer = prevStreamerDataRef.current?.data.find(s => s.username === currentStreamer.username);
            if(prevStreamer && !prevStreamer.is_live && currentStreamer.is_live) {
                showLiveNotification(currentStreamer);
            }
        });
      }
      prevStreamerDataRef.current = data;

      setStreamerData(data);
      setLastUpdated(new Date(data.checked_at));
      setError(null);
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
    const liveStreamers = streamersToSort.filter(s => s.is_live);
    const offlineStreamers = streamersToSort.filter(s => !s.is_live);

    if (sortOption === 'status') {
        liveStreamers.sort((a, b) => (b.viewer_count ?? 0) - (a.viewer_count ?? 0));
        offlineStreamers.sort((a, b) => {
          const dateA = a.last_stream_start_time ? new Date(a.last_stream_start_time).getTime() : 0;
          const dateB = b.last_stream_start_time ? new Date(b.last_stream_start_time).getTime() : 0;
          return dateB - dateA;
        });
        return [...liveStreamers, ...offlineStreamers];
    } else { // 'viewers_desc'
        streamersToSort.sort((a, b) => {
            if (a.is_live && !b.is_live) return -1;
            if (!a.is_live && b.is_live) return 1;
            if (a.is_live && b.is_live) {
              return (b.viewer_count ?? 0) - (a.viewer_count ?? 0);
            }
            return a.username.localeCompare(b.username);
      });
      return streamersToSort;
    }
  }, [streamerData, sortOption]);

  const filteredStreamers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let streamers = sortedStreamers;

    if (selectedCategory) {
      streamers = streamers.filter(streamer => streamer.live_category === selectedCategory);
    }

    if (selectedTags.length > 0) {
      streamers = streamers.filter(streamer =>
        streamer.tags && streamer.tags.some(tag => selectedTags.includes(tag))
      );
    }
    
    if (query) {
       streamers = streamers.filter(streamer => {
        const firstCharacter = streamer.character?.split('|')[0].trim().toLowerCase() || '';
        const liveTitle = streamer.live_title?.toLowerCase() || '';
        return streamer.username.toLowerCase().includes(query) ||
               (streamer.character && firstCharacter.includes(query)) ||
               (streamer.is_live && liveTitle.includes(query));
       });
    }
    
    return streamers;
  }, [sortedStreamers, searchQuery, selectedTags, selectedCategory]);

  const liveStreamersInFilter = useMemo(() => filteredStreamers.filter(s => s.is_live), [filteredStreamers]);

  const handleCopyLinks = useCallback(() => {
    let urlsToCopy: (string | null)[];

    if (liveStreamersInFilter.length > 0) {
        urlsToCopy = liveStreamersInFilter.map(s => s.live_url);
    } else {
        urlsToCopy = filteredStreamers.map(s => s.profile_url);
    }

    const urlsString = urlsToCopy.filter(Boolean).join('\n');

    if (urlsString) {
        navigator.clipboard.writeText(urlsString).then(() => {
            setIsLinksCopied(true);
            setTimeout(() => setIsLinksCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy links: ', err);
            alert('Could not copy links to clipboard.');
        });
    }
  }, [filteredStreamers, liveStreamersInFilter]);
  
  const copyButtonText = liveStreamersInFilter.length > 0 ? t('copyLiveLinks') : t('copyProfileLinks');

  return (
    <div className="min-h-screen w-full text-black/90 transition-colors duration-300 dark:text-white/90">
      <div className="fixed top-0 left-0 w-full h-full -z-10"></div>
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col items-center mb-12 relative">
          <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 flex items-center gap-2">
            <NotificationsToggle enabled={areAnyNotificationsEnabled} onToggle={handleToggleAllNotifications} permission={notificationPermission} />
            <LanguageToggle />
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
            {t('liveStreams')}
          </h2>

          <div className="w-full max-w-6xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-center gap-4">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-4 rtl:pl-0 rtl:pr-4 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchStreamer')}
                className="w-full py-3 pl-11 pr-4 rtl:pl-4 rtl:pr-11 text-black bg-white/20 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-black/20 dark:placeholder-gray-400 backdrop-blur-sm transition-all"
                aria-label={t('searchStreamer')}
              />
            </div>
            <div className="w-full">
               <TagFilter
                 allTags={allTags}
                 selectedTags={selectedTags}
                 onSelectedTagsChange={setSelectedTags}
               />
            </div>
            <div className="relative w-full">
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full py-3 pl-4 pr-10 rtl:pl-10 rtl:pr-4 text-black bg-white/20 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-black/20 backdrop-blur-sm transition-all appearance-none disabled:opacity-50"
                    aria-label={t('filterByCategory')}
                    disabled={allCategories.length === 0}
                >
                    <option value="">{t('allCategories')}</option>
                    {allCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
                <span className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center pr-4 rtl:pr-0 rtl:pl-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </span>
            </div>
             <div className="relative w-full">
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as 'status' | 'viewers_desc')}
                    className="w-full py-3 pl-4 pr-10 rtl:pl-10 rtl:pr-4 text-black bg-white/20 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-black/20 backdrop-blur-sm transition-all appearance-none"
                    aria-label={t('sortBy')}
                >
                    <option value="status">{t('sortByStatus')}</option>
                    <option value="viewers_desc">{t('viewersHighToLow')}</option>
                </select>
                <span className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center pr-4 rtl:pr-0 rtl:pl-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                    </svg>
                </span>
            </div>
          </div>

          {lastUpdated && (
             <p className="text-sm text-black/60 dark:text-white/60 mt-4">
               {t('lastUpdated', { time: lastUpdated.toLocaleTimeString() })}
             </p>
          )}
        </header>

        {streamerData && filteredStreamers.length > 0 && (
            <div className="flex justify-center mb-6 -mt-6">
                <button
                    onClick={handleCopyLinks}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                    {isLinksCopied ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{t('copied')}</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>{copyButtonText}</span>
                        </>
                    )}
                </button>
            </div>
        )}

        {error && (
          <div className="text-center bg-red-500/20 text-red-300 p-4 rounded-lg mb-8">
            <p><strong>{t('apiErrorTitle')}</strong> {error}</p>
            <p>{t('apiErrorBody')}</p>
          </div>
        )}

        {streamerData ? (
          <>
            <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStreamers.map((streamer) => (
                <StreamerCard 
                  key={streamer.username} 
                  streamer={streamer} 
                  onCardClick={() => setSelectedStreamer(streamer)}
                  isNotificationSubscribed={!!streamerNotificationSettings[streamer.username]}
                  onNotificationToggle={updateStreamerNotificationSetting}
                  notificationPermission={notificationPermission}
                />
              ))}
            </main>
            {filteredStreamers.length === 0 && (searchQuery || selectedTags.length > 0 || selectedCategory) && (
              <div className="text-center py-16 text-black/80 dark:text-white/80">
                <h3 className="text-2xl font-bold">{t('noStreamersFoundTitle')}</h3>
                <p className="mt-2 text-base text-black/60 dark:text-white/60">{t('noStreamersFoundBody')}</p>
              </div>
            )}
          </>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-white/20 bg-white/5 p-5 shadow-lg backdrop-blur-lg animate-pulse">
                    <div className="absolute left-4 top-4 rtl:left-auto rtl:right-4 h-8 w-24 rounded-full bg-black/20 dark:bg-white/10"></div>
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
      <StreamerModal streamer={selectedStreamer} onClose={() => setSelectedStreamer(null)} />
    </div>
  );
};

export default App;