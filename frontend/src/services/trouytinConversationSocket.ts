import {
  mapConversation,
  type RoomConversation,
  type TrouytinConversation,
  type TrouytinMessage,
} from './roomConversationService';

const TROUYTIN_API_BASE_URL = (import.meta.env.VITE_TROUYTIN_API_BASE_URL || 'http://localhost:8090').replace(/\/+$/, '');
const TROUYTIN_WS_URL = import.meta.env.VITE_TROUYTIN_WS_URL || `${TROUYTIN_API_BASE_URL.replace(/^http/, 'ws')}/ws/conversations`;
const TROUYTIN_INTERNAL_API_KEY = import.meta.env.VITE_TROUYTIN_INTERNAL_API_KEY || 'dev-internal-key';

type ConversationRealtimeEvent = {
  type: string;
  conversation?: TrouytinConversation;
  message?: TrouytinMessage | null;
};

type Frame = {
  command: string;
  headers: Record<string, string>;
  body: string;
};

type Params = {
  partnerUserId: string;
  onConversation: (conversation: RoomConversation, event: ConversationRealtimeEvent) => void;
  onConnectionChange?: (connected: boolean) => void;
};

export function connectPropTechConversationSocket(params: Params) {
  if (!params.partnerUserId) {
    return {
      disconnect() {},
      isConnected: () => false,
    };
  }

  let socket: WebSocket | null = null;
  let connected = false;
  let stopped = false;
  let reconnectTimer: number | undefined;
  let subscriptionSeq = 0;

  const sendFrame = (command: string, headers: Record<string, string>, body = '') => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`);
    socket.send([command, ...headerLines, '', body].join('\n') + '\0');
  };

  const subscribe = () => {
    sendFrame('SUBSCRIBE', {
      id: `sub-${++subscriptionSeq}`,
      destination: `/topic/proptech/${params.partnerUserId}/conversations`,
      ack: 'auto',
    });
  };

  const scheduleReconnect = () => {
    if (stopped || reconnectTimer) return;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = undefined;
      open();
    }, 3000);
  };

  const open = () => {
    socket = new WebSocket(TROUYTIN_WS_URL);

    socket.onopen = () => {
      sendFrame('CONNECT', {
        'accept-version': '1.2',
        'heart-beat': '0,0',
        'X-Internal-Api-Key': TROUYTIN_INTERNAL_API_KEY,
        'X-PropTech-Partner-Id': params.partnerUserId,
      });
    };

    socket.onmessage = (message) => {
      parseFrames(String(message.data)).forEach((frame) => {
        if (frame.command === 'CONNECTED') {
          connected = true;
          params.onConnectionChange?.(true);
          subscribe();
          return;
        }

        if (frame.command === 'MESSAGE') {
          try {
            const event = JSON.parse(frame.body) as ConversationRealtimeEvent;
            if (event.conversation) {
              params.onConversation(mapConversation(event.conversation), event);
            }
          } catch {
            // Ignore malformed realtime payloads and keep listening.
          }
          return;
        }

        if (frame.command === 'ERROR') {
          socket?.close();
        }
      });
    };

    socket.onclose = () => {
      connected = false;
      params.onConnectionChange?.(false);
      scheduleReconnect();
    };

    socket.onerror = () => {
      connected = false;
      params.onConnectionChange?.(false);
      socket?.close();
    };
  };

  open();

  return {
    disconnect() {
      stopped = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (connected) {
        sendFrame('DISCONNECT', {});
      }
      socket?.close();
    },
    isConnected: () => connected,
  };
}

function parseFrames(raw: string): Frame[] {
  return raw
    .replace(/\r/g, '')
    .split('\0')
    .filter(Boolean)
    .map((text) => {
      const separatorIndex = text.indexOf('\n\n');
      const head = separatorIndex >= 0 ? text.slice(0, separatorIndex) : text;
      const body = separatorIndex >= 0 ? text.slice(separatorIndex + 2) : '';
      const lines = head.split('\n').filter(Boolean);
      const command = lines.shift() || '';
      const headers = Object.fromEntries(
        lines.map((line) => {
          const index = line.indexOf(':');
          return index >= 0 ? [line.slice(0, index), line.slice(index + 1)] : [line, ''];
        })
      );

      return { command, headers, body };
    });
}
