import type { Channel } from '../types';

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY'; // This is not used for client-side notifications but is required for push subscriptions.

// Function to register the service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Function to request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.error('This browser does not support desktop notification.');
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  return permission;
};

// Function to show a notification when a streamer goes live
export const showLiveNotification = async (streamer: Channel, bodyText: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return; // Silently exit if notifications aren't supported or permission isn't granted
  }

  const streamerNotifications = JSON.parse(localStorage.getItem('streamerNotifications') || '{}');

  // Check if notifications are enabled for this specific streamer
  if (!streamerNotifications[streamer.username]) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    console.error('No service worker registered to show notification.');
    return;
  }
  
  const notificationTitle = streamer.display_name;
  const notificationOptions: NotificationOptions = {
    body: bodyText,
    icon: streamer.profile_pic || '/vite.svg',
    data: {
      url: streamer.live_url,
    },
  };

  await registration.showNotification(notificationTitle, notificationOptions);
};
