import type { Channel, KickApiResponse } from '../types';

// --- IMPORTANT ---
// This is a client-side implementation and is NOT recommended for production.
// A backend proxy should be used to handle API keys, caching, and rate limits to avoid CORS issues and exposure of secrets.
// This implementation is for demonstration purposes only.

/**
 * Fetches data for a single Kick channel.
 * @param username The Kick username.
 * @returns A Promise that resolves to a Channel object.
 */
const fetchKickChannel = async (username: string): Promise<Channel> => {
  const url = `https://kick.com/api/v2/channels/${username.toLowerCase()}`;
  try {
    // We use a proxy to bypass potential CORS issues in a development/demo environment.
    // For a real application, this logic should be in a backend.
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error for ${username}: ${response.status}`);
    }
    
    const data = await response.json();

    if (!data.user) {
        throw new Error(`User not found: ${username}`);
    }

    const isLive = data.livestream?.is_live ?? false;

    let lastStreamStartTime = null;
    if (!isLive && data.previous_livestreams && data.previous_livestreams.length > 0) {
      lastStreamStartTime = data.previous_livestreams[0].start_time;
    }

    return {
      username: data.user.username,
      display_name: data.user.username.charAt(0).toUpperCase() + data.user.username.slice(1),
      profile_pic: data.user.profile_pic || null,
      is_live: isLive,
      live_title: data.livestream?.session_title || null,
      viewer_count: data.livestream?.viewer_count ?? null,
      live_since: data.livestream?.start_time || null,
      last_stream_start_time: lastStreamStartTime,
      live_url: `https://kick.com/${data.user.username}`,
      profile_url: `https://kick.com/${data.user.username}`,
      bio: data.user.bio || null,
      followers_count: data.followersCount ?? null,
    };
  } catch (error) {
    console.error(`Failed to fetch data for ${username}:`, error);
    // Return a default error state for this channel so the UI can handle it gracefully
    return {
      username: username,
      display_name: username.charAt(0).toUpperCase() + username.slice(1),
      profile_pic: null,
      is_live: false,
      live_title: 'Failed to load data',
      viewer_count: null,
      live_since: null,
      last_stream_start_time: null,
      live_url: `https://kick.com/${username}`,
      profile_url: `https://kick.com/${username}`,
      error: true, // Flag for the UI
      last_checked_at: new Date().toISOString(),
      bio: null,
      followers_count: null,
    };
  }
};

/**
 * Fetches statuses for multiple Kick channels in parallel.
 * @param streamers An array of Kick streamer objects, each with a username and tags.
 * @returns A Promise that resolves to a KickApiResponse object.
 */
export const fetchChannelStatuses = async (streamers: { username: string; tags: string[]; character: string }[]): Promise<KickApiResponse> => {
  // Fire off all API requests in parallel and wait for all of them to settle.
  const channelDataPromises = streamers.map(streamer => 
    fetchKickChannel(streamer.username).then(channelData => ({
      ...channelData,
      tags: streamer.tags, // Merge the predefined tags into the final channel data
      character: streamer.character, // Merge character data
    }))
  );
  const results = await Promise.all(channelDataPromises);

  return {
    checked_at: new Date().toISOString(),
    data: results,
  };
};