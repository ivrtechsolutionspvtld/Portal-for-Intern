'use client';

import { useEffect, useCallback } from 'react';

const SYNC_CHANNEL_NAME = 'ivr_portal_realtime_sync';
const SYNC_STORAGE_KEY = 'ivr_portal_sync_event';

/**
 * Triggers a real-time sync event across all browser tabs and components.
 * Broadcasts through BroadcastChannel, LocalStorage storage event, and CustomEvent.
 */
export function triggerPortalSync(eventType = 'GENERAL_UPDATE') {
  if (typeof window === 'undefined') return;

  const payload = {
    type: eventType,
    timestamp: Date.now(),
  };

  // 1. In-tab custom event
  try {
    window.dispatchEvent(new CustomEvent('ivr-portal-sync', { detail: payload }));
  } catch (err) {
    // Ignore in non-browser env
  }

  // 2. Cross-tab BroadcastChannel
  try {
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.postMessage(payload);
      bc.close();
    }
  } catch (err) {
    // Fallback gracefully
  }

  // 3. Cross-tab LocalStorage event
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // Fallback gracefully
  }
}

/**
 * React hook to listen for real-time portal updates and automatically refetch data.
 * Combines cross-tab BroadcastChannel, LocalStorage events, window focus, and polite auto-polling.
 */
export function usePortalSync(onRefresh: () => void | Promise<void>, pollIntervalMs = 6000) {
  const stableRefresh = useCallback(() => {
    try {
      onRefresh();
    } catch (err) {
      console.error('[Sync] Refresh error:', err);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // A. Listen for in-tab custom event
    const handleCustomEvent = () => {
      stableRefresh();
    };
    window.addEventListener('ivr-portal-sync', handleCustomEvent);

    // B. Listen for cross-tab BroadcastChannel
    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
        bc.onmessage = () => {
          stableRefresh();
        };
      } catch (err) {
        bc = null;
      }
    }

    // C. Listen for cross-tab LocalStorage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SYNC_STORAGE_KEY && e.newValue) {
        stableRefresh();
      }
    };
    window.addEventListener('storage', handleStorage);

    // D. Window focus and visibility change (instant fresh fetch when user returns to tab)
    const handleFocus = () => {
      stableRefresh();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        stableRefresh();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // E. Polite background polling interval (e.g., 6 seconds) for multi-device sync
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        stableRefresh();
      }
    }, pollIntervalMs);

    return () => {
      window.removeEventListener('ivr-portal-sync', handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
      if (bc) {
        try {
          bc.close();
        } catch {
          // Ignore
        }
      }
    };
  }, [stableRefresh, pollIntervalMs]);
}

