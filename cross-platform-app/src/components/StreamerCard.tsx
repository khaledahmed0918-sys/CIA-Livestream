import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Linking } from 'react-native';
import type { Channel } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { humanizeTime, formatFullDateTime } from '../utils/time';
import { useTheme } from '../hooks/useTheme';

interface StreamerCardProps {
  streamer: Channel;
  onCardClick: () => void;
  isNotificationSubscribed: boolean;
  onNotificationToggle: (streamerName: string, enabled: boolean) => Promise<void>;
  notificationPermission: NotificationPermission | null;
  isFavorite: boolean;
  onToggleFavorite: (streamerName: string) => void;
}

const StatusBadge: React.FC<{ isLive: boolean; viewerCount: number | null; }> = ({ isLive, viewerCount }) => {
  const { t } = useLocalization();
  const { theme } = useTheme();

  return (
    <View style={[styles.statusBadge, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
      <View style={[styles.statusDot, { backgroundColor: isLive ? '#4ade80' : '#f87171' }]} />
      <Text style={styles.statusText}>{isLive ? t('live') : t('offline')}</Text>
      {isLive && viewerCount !== null && (
        <>
          <Text style={styles.statusDivider}>|</Text>
          <Text style={styles.statusText}>{viewerCount.toLocaleString()}</Text>
        </>
      )}
    </View>
  );
};

export const StreamerCard: React.FC<StreamerCardProps> = ({ streamer, onCardClick }) => {
  const { t, language } = useLocalization();
  const { theme } = useTheme();
  const firstCharacter = streamer.character?.split('|')[0].trim();

  return (
    <Pressable 
      onPress={onCardClick}
      style={[styles.card, { backgroundColor: theme.colors.cardBg }]}
    >
      <StatusBadge isLive={streamer.is_live} viewerCount={streamer.viewer_count} />

      <View style={styles.mainContent}>
        <Pressable onPress={() => Linking.openURL(streamer.profile_url)}>
          <Image
            source={{ uri: streamer.profile_pic || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
        </Pressable>
        <View style={styles.infoContainer}>
          <Text style={[styles.displayName, { color: theme.colors.textStreamer }]} numberOfLines={1}>
            {streamer.display_name}
          </Text>
          {firstCharacter && !streamer.error && (
            <Text style={[styles.characterText, { color: theme.colors.textStreamer, opacity: 0.7 }]} numberOfLines={1}>
              <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{t('character')}</Text> {firstCharacter}
            </Text>
          )}
        </View>
      </View>

      {streamer.tags && streamer.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {streamer.tags.slice(0, 3).map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.footerTextContainer}>
          {streamer.error ? (
            <Text style={styles.errorText}>{t('failedToLoadData')}</Text>
          ) : streamer.is_live && streamer.live_title ? (
            <Text style={[styles.footerText, { color: theme.colors.textStreamer }]} numberOfLines={1}>
              {streamer.live_title}
            </Text>
          ) : (
            <Text style={[styles.footerText, { color: theme.colors.textStreamer }]} numberOfLines={1}>
              <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{t('lastSeen')}</Text> {formatFullDateTime(streamer.last_stream_start_time, language)}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => Linking.openURL(streamer.is_live ? streamer.live_url! : streamer.profile_url)}
          style={[styles.linkButton, { backgroundColor: 'rgba(255,255,255,0.1)'}]}
        >
          <Text style={styles.linkButtonText}>{t('link')}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 180,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    zIndex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  statusDivider: {
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  displayName: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  characterText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 16,
    flex: 1,
  },
  footerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
  },
  errorText: {
    color: '#ef4444',
    fontStyle: 'italic',
  },
  linkButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 16,
  },
  linkButtonText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },
});
