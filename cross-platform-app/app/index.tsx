
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Platform, Pressable, ActivityIndicator, TextInput, useWindowDimensions, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchChannelStatuses } from '../src/services/kickService';
import type { KickApiResponse, Channel } from '../src/types';
import { KICK_STREAMERS, POLLING_INTERVAL_SECONDS, ENABLE_APPLY_SECTION } from '../src/constants';
import { StreamerCard } from '../src/components/StreamerCard';
import { ThemeToggle } from '../src/components/ThemeToggle';
import { TagFilter } from '../src/components/TagFilter';
import { useLocalization } from '../src/hooks/useLocalization';
// import { requestNotificationPermission, registerServiceWorker, showLiveNotification } from '../src/utils/notificationManager';
import { StreamerModal } from '../src/components/StreamerModal';
import { quranicVerses } from '../src/data/quranicVerses';
import type { QuranicVerse as VerseType } from '../src/data/quranicVerses';
import { QuranicVerse } from '../src/components/QuranicVerse';
import { useTheme } from '../src/hooks/useTheme';

// Mocked notification functions for now
const requestNotificationPermission = async () => 'granted';
const showLiveNotification = (streamer: Channel, body: string) => console.log(`Notification for ${streamer.display_name}: ${body}`);


const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLocalization();
  const { theme } = useTheme();
  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

  return (
    <Pressable
      onPress={toggleLanguage}
      style={[styles.headerButton, { backgroundColor: theme.colors.cardBg }]}
      aria-label={t('switchToLang', { lang: language === 'en' ? t('lang_ar') : t('lang_en') })}
    >
      <Text style={[styles.langToggleText, { color: theme.colors.textStreamer }]}>{language === 'en' ? 'AR' : 'EN'}</Text>
    </Pressable>
  );
};

const App: React.FC = () => {
  const { t } = useLocalization();
  const { theme, themeName } = useTheme();
  const { width } = useWindowDimensions();

  const [streamerData, setStreamerData] = useState<KickApiResponse | null>(null);
  const prevStreamerDataRef = useRef<KickApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<'status' | 'viewers_desc' | 'live_duration_desc' | 'last_seen_desc'>('status');
  const [selectedStreamer, setSelectedStreamer] = useState<Channel | null>(null);
  const [randomVerse, setRandomVerse] = useState<VerseType | null>(null);
  
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [streamerNotificationSettings, setStreamerNotificationSettings] = useState<{ [key: string]: boolean }>({});
  
  useEffect(() => {
    const verseSource = quranicVerses;
    if (verseSource.length > 0) {
        setRandomVerse(verseSource[Math.floor(Math.random() * verseSource.length)]);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchChannelStatuses(KICK_STREAMERS);
      if(prevStreamerDataRef.current) {
        data.data.forEach(currentStreamer => {
            const prevStreamer = prevStreamerDataRef.current?.data.find(s => s.username === currentStreamer.username);
            if(prevStreamer && !prevStreamer.is_live && currentStreamer.is_live) {
                const notificationBody = currentStreamer.live_title || t('isNowLive', { name: currentStreamer.display_name });
                showLiveNotification(currentStreamer, notificationBody);
            }
        });
      }
      prevStreamerDataRef.current = data;
      setStreamerData(data);
      setLastUpdated(new Date(data.checked_at));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, POLLING_INTERVAL_SECONDS * 1000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const allTags = useMemo(() => {
    const tags = KICK_STREAMERS.flatMap(streamer => streamer.tags);
    return [...new Set(tags)].sort();
  }, []);
  
  const tagCounts = useMemo(() => {
    if (!streamerData?.data) return {};
    const counts: { [key: string]: number } = {};
    KICK_STREAMERS.forEach(streamerInfo => {
        const streamerOnline = streamerData.data.find(s => s.username.toLowerCase() === streamerInfo.username.toLowerCase());
        if (streamerOnline) {
            streamerInfo.tags?.forEach(tag => {
                counts[tag] = (counts[tag] || 0) + 1;
            });
        }
    });
    return counts;
  }, [streamerData]);

  const sortedStreamers = useMemo(() => {
    if (!streamerData?.data) return [];
    
    const streamersToSort: Channel[] = [...streamerData.data];
    const liveStreamers = streamersToSort.filter(s => s.is_live);
    const offlineStreamers = streamersToSort.filter(s => !s.is_live);

    switch (sortOption) {
      case 'status':
      default:
        liveStreamers.sort((a, b) => (b.viewer_count ?? 0) - (a.viewer_count ?? 0));
        offlineStreamers.sort((a, b) => {
          const dateA = a.last_stream_start_time ? new Date(a.last_stream_start_time).getTime() : 0;
          const dateB = b.last_stream_start_time ? new Date(b.last_stream_start_time).getTime() : 0;
          return dateB - dateA;
        });
        return [...liveStreamers, ...offlineStreamers];
    }
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
       streamers = streamers.filter(streamer => {
        const firstCharacter = streamer.character?.split('|')[0].trim().toLowerCase() || '';
        const liveTitle = streamer.live_title?.toLowerCase() || '';
        return streamer.username.toLowerCase().includes(query) ||
               (streamer.character && firstCharacter.includes(query)) ||
               (streamer.is_live && liveTitle.includes(query));
       });
    }
    
    return streamers;
  }, [sortedStreamers, searchQuery, selectedTags]);

  const liveCount = useMemo(() => filteredStreamers.filter(s => s.is_live).length, [filteredStreamers]);
  const offlineCount = useMemo(() => filteredStreamers.filter(s => !s.is_live).length, [filteredStreamers]);
  
  const numColumns = width < 600 ? 1 : (width < 900 ? 2 : (width < 1200 ? 3 : 4));

  const renderContent = () => {
    if (isLoading && !streamerData) {
      return <ActivityIndicator size="large" color={theme.colors.textTitle} style={{ marginTop: 50 }} />;
    }
    if (error) {
      return (
        <View style={[styles.errorContainer, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
          <Text style={[styles.errorText, {color: '#ef4444'}]}>
            <Text style={{fontFamily: 'Inter_700Bold'}}>{t('apiErrorTitle')}</Text> {error}
          </Text>
          <Text style={[styles.errorText, {color: '#ef4444'}]}>{t('apiErrorBody')}</Text>
        </View>
      );
    }

    if (filteredStreamers.length === 0) {
        return (
            <View style={styles.emptyStateContainer}>
                <Text style={[styles.emptyStateTitle, { color: theme.colors.textTitle }]}>{t('noStreamersFoundTitle')}</Text>
                <Text style={[styles.emptyStateBody, { color: theme.colors.textBody }]}>{t('noStreamersFoundBody')}</Text>
            </View>
        );
    }

    return (
        <FlatList
          key={numColumns}
          data={filteredStreamers}
          renderItem={({ item }) => (
             <View style={{ flex: 1/numColumns, margin: 8 }}>
                <StreamerCard
                    streamer={item}
                    onCardClick={() => setSelectedStreamer(item)}
                    isNotificationSubscribed={false}
                    onNotificationToggle={async () => {}}
                    notificationPermission={notificationPermission}
                    isFavorite={false}
                    onToggleFavorite={() => {}}
                />
            </View>
          )}
          keyExtractor={(item) => item.username}
          numColumns={numColumns}
          contentContainerStyle={styles.grid}
        />
    )
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
              <View style={styles.headerButtonsLeft}>
                 <ThemeToggle />
              </View>
              <View style={styles.headerButtonsRight}>
                 <LanguageToggle />
              </View>
              <Text style={[styles.title, { color: theme.colors.textTitle }]}>
                C I A
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textTitle }]}>
                {t('liveStreams')}
              </Text>

              {randomVerse && <QuranicVerse verse={randomVerse} />}

              {lastUpdated && (
                 <Text style={[styles.lastUpdatedText, { color: theme.colors.textBody, opacity: 0.7 }]}>
                   {t('lastUpdated', { time: lastUpdated.toLocaleTimeString() })}
                 </Text>
              )}
            </View>

            <View style={styles.controlsContainer}>
              <TextInput 
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('searchStreamer')}
                placeholderTextColor={theme.colors.textBody}
                style={[styles.searchInput, { 
                    backgroundColor: theme.colors.cardBg,
                    color: theme.colors.textStreamer
                }]}
              />
              <TagFilter
                allTags={allTags}
                selectedTags={selectedTags}
                onSelectedTagsChange={setSelectedTags}
                tagCounts={tagCounts}
              />
              <View style={styles.statsContainer}>
                <Text style={[styles.statText, {color: theme.colors.textBody}]}>
                    <View style={[styles.dot, {backgroundColor: '#4ade80'}]} /> {t('liveCount', { count: liveCount })}
                </Text>
                <Text style={[styles.statText, {color: theme.colors.textBody}]}>
                    <View style={[styles.dot, {backgroundColor: '#f87171'}]} /> {t('offlineCount', { count: offlineCount })}
                </Text>
              </View>
            </View>

            {renderContent()}

        </ScrollView>
       <StreamerModal streamer={selectedStreamer} onClose={() => setSelectedStreamer(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerButtonsLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    gap: 8,
  },
   headerButtonsRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 8
  },
  lastUpdatedText: {
    fontSize: 12,
    marginTop: 16,
  },
  controlsContainer: {
    marginBottom: 16,
    gap: 16,
  },
  searchInput: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'transparent',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    flexDirection: 'row',
    alignItems: 'center'
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  grid: {
    paddingHorizontal: Platform.OS === 'web' ? 8 : 0,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center'
  },
  errorText: {
    textAlign: 'center'
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langToggleText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  emptyStateBody: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
});

export default App;
