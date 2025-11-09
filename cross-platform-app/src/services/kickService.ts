import { Platform } from 'react-native';
import type { Channel, KickApiResponse } from '../types';

const extractUsername = (input: string): string => {
    if (input.includes('kick.com/')) {
        return input.split('/').pop()?.split('?')[0].split('#')[0] || input;
    }
    return input;
};

const fetchKickChannel = async (originalUsername: string): Promise<Channel> => {
  const url = `https://kick.com/api/v1/channels/${originalUsername}`;
  try {
    const response = await fetch(url);

    if (response.status === 404) {
       throw new Error(`User not found: ${originalUsername}`);
    }
    if (!response.ok) {
      throw new Error(`API error for ${originalUsername}: ${response.status}`);
    }
    
    const data = await response.json();

    if (!data.user) {
        throw new Error(`User data not found for: ${originalUsername}`);
    }

    const isLive = data.livestream !== null;
    let lastStreamStartTime = null;

    if (!isLive && Platform.OS === 'web') {
      try {
        const videosUrl = `https://kick.com/api/v2/channels/${originalUsername}/videos`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(videosUrl)}`;
        const videosResponse = await fetch(proxyUrl);
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          if (videosData && videosData.length > 0 && videosData[0].created_at) {
            lastStreamStartTime = videosData[0].created_at;
          }
        }
      } catch (videoError) {
        console.error(`Failed to fetch recent videos for ${originalUsername}:`, videoError);
      }
    }
    
    if (!lastStreamStartTime && !isLive && data.previous_livestreams && data.previous_livestreams.length > 0) {
      lastStreamStartTime = data.previous_livestreams[0].start_time;
    }

    return {
      username: originalUsername,
      display_name: originalUsername,
      profile_pic: data.user.profile_pic || null,
      is_live: isLive,
      live_title: data.livestream?.session_title || null,
      viewer_count: data.livestream?.viewer_count ?? null,
      live_since: data.livestream?.start_time || null,
      last_stream_start_time: lastStreamStartTime,
      live_url: `https://kick.com/${originalUsername}`,
      profile_url: `https://kick.com/${originalUsername}`,
      bio: data.user.bio || null,
      followers_count: data.followers_count ?? null,
      banner_image: data.banner_image?.url || null,
      live_category: data.livestream?.category?.name || null,
    };
  } catch (error) {
    console.error(`Failed to fetch data for ${originalUsername}:`, error);
    return {
      username: originalUsername,
      display_name: originalUsername,
      profile_pic: null,
      is_live: false,
      live_title: null,
      viewer_count: null,
      live_since: null,
      last_stream_start_time: null,
      live_url: `https://kick.com/${originalUsername}`,
      profile_url: `https://kick.com/${originalUsername}`,
      error: true,
      last_checked_at: new Date().toISOString(),
      bio: null,
      followers_count: null,
      banner_image: null,
      live_category: null,
    };
  }
};

export const fetchChannelStatuses = async (streamers: { username: string; tags: string[]; character: string }[]): Promise<KickApiResponse> => {
  const channelDataPromises = streamers.map(async (streamerConfig) => {
    const username = extractUsername(streamerConfig.username);
    const channelData = await fetchKickChannel(username);
    return {
      ...channelData,
      tags: streamerConfig.tags,
      character: streamerConfig.character,
    };
  });
  const results = await Promise.all(channelDataPromises);

  return {
    checked_at: new Date().toISOString(),
    data: results,
  };
};
