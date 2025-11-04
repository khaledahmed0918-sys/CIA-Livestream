
export interface Channel {
  username: string;
  display_name: string;
  profile_pic: string | null;
  is_live: boolean;
  live_title: string | null;
  viewer_count: number | null;
  live_since: string | null; // ISO8601
  last_stream_start_time: string | null; // ISO8601
  live_url: string | null;
  profile_url: string;
  tags?: string[];
  character?: string;
  error?: boolean; // To indicate stale data
  last_checked_at?: string; // ISO8601 for stale data
  bio?: string;
  followers_count?: number;
}

export interface KickApiResponse {
  checked_at: string; // ISO8601
  data: Channel[];
}