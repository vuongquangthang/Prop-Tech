import { useEffect, useRef } from 'react';
import { notificationHub } from './signalr-service';

/**
 * Subscribes to one or more SignalR events and calls `onRefresh`
 * whenever any of them fires. Cleans up on unmount.
 *
 * Usage:
 *   useSignalRRefresh(['PaymentSuccess', 'PaymentFailed'], fetchData);
 */
export function useSignalRRefresh(events: string[], onRefresh: () => void): void {
  // Keep a stable ref to the latest onRefresh so the effect closure
  // doesn't stale-capture an older version.
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const handler = (..._args: any[]) => onRefreshRef.current();
    events.forEach(event => notificationHub.on(event, handler));
    return () => {
      events.forEach(event => notificationHub.off(event, handler));
    };
    // events array is expected to be stable (string literals at call site)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.join(',')]);
}
