
import React, { useState } from 'react';
import type { Channel } from '../types';

interface StreamerCardProps {
  streamer: Channel;
}

const StatusBadge: React.FC<{ isLive: boolean; viewerCount: number | null }> = ({ isLive, viewerCount }) => (
  <div
    className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
    aria-label={isLive ? 'Live Status' : 'Offline Status'}
    role="status"
  >
    <span className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-green-400 animation-[pulse-live_2s_infinite]' : 'bg-red-500 animation-[slow-fade_3s_ease-in-out_infinite]'}`}></span>
    <span>{isLive ? 'Live' : 'Offline'}</span>
    {isLive && viewerCount !== null && (
      <>
        <span className="text-white/30">|</span>
        <div className="flex items-center gap-1 text-white/80">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          <span>{viewerCount.toLocaleString()}</span>
        </div>
      </>
    )}
  </div>
);

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <div className="group relative flex justify-center">
    {children}
    <span className="absolute -top-12 scale-0 rounded bg-gray-800 p-2 text-xs text-white transition-all group-hover:scale-100 dark:bg-gray-900 w-max max-w-xs text-center z-20">
      {text}
    </span>
  </div>
);

export const StreamerCard: React.FC<StreamerCardProps> = ({ streamer }) => {
  const [isCopied, setIsCopied] = useState(false);

  const humanizeTime = (isoString: string | null) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
  }
  
  const formatLastLiveTime = (isoString: string | null): string => {
    if (!isoString) return 'N/A';
    
    try {
        const lastLiveDate = new Date(isoString);
        if (isNaN(lastLiveDate.getTime())) return 'N/A';
        
        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        };

        return new Intl.DateTimeFormat('en-US', options).format(lastLiveDate);
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'N/A';
    }
  };
  
  const handleShareClick = async () => {
    try {
      await navigator.clipboard.writeText(streamer.profile_url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy link.');
    }
  };

  const tooltipText = streamer.is_live
    ? `Live since: ${new Date(streamer.live_since!).toLocaleString()}`
    : streamer.error 
      ? `Last check failed: ${new Date(streamer.last_checked_at!).toLocaleString()}`
      : `Last seen: ${streamer.last_stream_start_time ? new Date(streamer.last_stream_start_time).toLocaleString() : 'N/A'}`;

  return (
    <div className="group relative min-h-[160px] rounded-2xl border border-white/20 bg-white/5 p-5 text-black shadow-lg backdrop-blur-lg transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl dark:text-white dark:border-white/10 dark:bg-black/20 overflow-hidden">
      
      <div className="absolute left-[-30%] bottom-0 w-[160%] h-[120%] bg-gradient-to-t from-white/10 to-transparent transform-gpu translate-y-full rotate-[-8deg] opacity-0 transition-transform duration-700 ease-[cubic-bezier(.2,.9,.2,1)] group-hover:translate-y-[-20%] group-hover:opacity-100 dark:from-white/5"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <StatusBadge isLive={streamer.is_live} viewerCount={streamer.viewer_count} />

        <div className="flex items-center gap-4 mt-12">
           <Tooltip text={tooltipText}>
            <a href={streamer.profile_url} target="_blank" rel="noopener noreferrer" aria-label={`${streamer.display_name}'s profile`}>
                <img
                  src={streamer.profile_pic || 'https://picsum.photos/200'}
                  alt={`${streamer.display_name}'s avatar`}
                  className="h-16 w-16 rounded-full border-2 border-white/20 object-cover"
                />
            </a>
          </Tooltip>
          <div className="flex-1 overflow-hidden">
            <h3 className="truncate text-xl font-bold">{streamer.display_name}</h3>
            
            <div className="mt-1 space-y-1">
              {streamer.character && !streamer.error && (
                <p className="truncate text-sm text-black/70 dark:text-white/70">
                  <span className="font-semibold">Character:</span> {streamer.character}
                </p>
              )}
              {(streamer.followers_count !== null && !streamer.error) && (
                   <div className="flex items-center gap-1.5 text-sm text-black/70 dark:text-white/70">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span className="font-semibold">{streamer.followers_count.toLocaleString()}</span>
                      <span>followers</span>
                  </div>
              )}
              {streamer.error ? (
                  <Tooltip text={`Last check failed: ${new Date(streamer.last_checked_at!).toLocaleString()}`}>
                      <div className="flex w-fit items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-xs font-semibold text-orange-400 backdrop-blur-sm">
                          <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                          <span>Stale</span>
                      </div>
                  </Tooltip>
              ) : (
                  <p className="truncate text-sm text-black/70 dark:text-white/70">
                  {streamer.is_live
                      ? `Live for ${humanizeTime(streamer.live_since)}`
                      : `Offline`
                  }
                  </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-black/80 dark:text-white/80">
            {streamer.bio && !streamer.error && (
                <Tooltip text={streamer.bio}>
                    <p className="italic truncate cursor-default">"{streamer.bio}"</p>
                </Tooltip>
            )}
        </div>


        {streamer.tags && streamer.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {streamer.tags.map(tag => (
              <span key={tag} className="rounded-full bg-black/20 dark:bg-white/10 px-2.5 py-1 text-xs font-semibold">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex-grow" />

        <div className="flex items-end justify-between gap-4 mt-2">
            <div className="flex-1 min-w-0 text-sm">
                {streamer.is_live && streamer.live_title && !streamer.error && (
                    <Tooltip text={streamer.live_title}>
                    <p className="truncate cursor-default text-black/80 dark:text-white/80">
                        {streamer.live_title}
                    </p>
                    </Tooltip>
                )}
                 {!streamer.is_live && !streamer.error && streamer.last_stream_start_time && (
                    <p className="text-black/70 dark:text-white/70">
                        <span className="font-semibold">Last seen:</span> {formatLastLiveTime(streamer.last_stream_start_time)}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
               <Tooltip text={isCopied ? "Copied!" : "Share Profile"}>
                 <button
                   onClick={handleShareClick}
                   className="flex-shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                   aria-label="Share streamer profile"
                 >
                   {isCopied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                   ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                     </svg>
                   )}
                 </button>
               </Tooltip>
               <a
                   href={streamer.is_live ? streamer.live_url! : streamer.profile_url}
                   target="_blank"
                   rel="noopener noreferrer"
                   className={`flex-shrink-0 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50
                   ${streamer.is_live ? 'shadow-[0_0_15px_rgba(52,211,153,0.7)] hover:shadow-[0_0_20px_rgba(52,211,153,0.9)]' : ''}`}
               >
                   Link
               </a>
            </div>
        </div>
      </div>
    </div>
  );
};
