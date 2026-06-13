import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getLatestItems } from '../services/jellyfin/jellyfinClient';
import { mapJellyfinItemToWuCinema } from '../services/jellyfin/jellyfinMappers';
import type { WuCinemaMediaItem } from '../services/jellyfin/jellyfinTypes';

interface NotificationContextType {
  latestItems: WuCinemaMediaItem[];
  unreadCount: number;
  markAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [latestItems, setLatestItems] = useState<WuCinemaMediaItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session) {
      setLatestItems([]);
      setUnreadCount(0);
      return;
    }

    async function fetchLatest() {
      try {
        const rawItems = await getLatestItems(
          session!.activeServerUrl,
          session!.accessToken,
          session!.userId,
          session!.deviceId,
          undefined,
          10
        );

        const mapped = rawItems.map(item =>
          mapJellyfinItemToWuCinema(item, session!.activeServerUrl)
        );

        setLatestItems(mapped);

        if (mapped.length > 0) {
          const lastReadId = localStorage.getItem('last_read_notification_item_id');
          if (!lastReadId) {
            // First time running the app, default to 3 unread
            setUnreadCount(Math.min(mapped.length, 3));
          } else {
            // Count how many items are newer than lastReadId
            const index = mapped.findIndex(item => item.id === lastReadId);
            if (index === -1) {
              // The saved ID is older than the current list, so all items in the list are new
              setUnreadCount(mapped.length);
            } else {
              setUnreadCount(index); // items at index 0 to index-1 are new
            }
          }
        }
      } catch (err) {
        console.error('Failed to poll latest items for notifications:', err);
      }
    }

    fetchLatest();
    // Poll every 60 seconds
    const interval = setInterval(fetchLatest, 60000);
    return () => clearInterval(interval);
  }, [session]);

  const markAsRead = () => {
    setUnreadCount(0);
    if (latestItems.length > 0) {
      localStorage.setItem('last_read_notification_item_id', latestItems[0].id);
    }
  };

  return (
    <NotificationContext.Provider value={{ latestItems, unreadCount, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
