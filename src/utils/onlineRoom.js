import mqtt from 'mqtt';

const BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
];

export function generateRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function connectOnlineRoom({ roomCode, clientId, onMessage, onStatus }) {
  const topic = `the-floor-trainer/v1/rooms/${roomCode}`;
  let brokerIdx = 0;
  let closed = false;
  let client = null;

  const connectNext = () => {
    if (closed) return;
    const url = BROKERS[brokerIdx % BROKERS.length];
    onStatus?.('connecting');

    client = mqtt.connect(url, {
      clientId: `tft-${clientId}-${Math.random().toString(36).slice(2, 6)}`,
      connectTimeout: 6000,
      reconnectPeriod: 3000,
      clean: true,
    });

    client.on('connect', () => {
      if (closed) return;
      client.subscribe(topic, { qos: 0 }, (err) => {
        if (!err) onStatus?.('connected');
      });
    });

    client.on('message', (_t, payload) => {
      if (closed) return;
      try {
        const msg = JSON.parse(payload.toString());
        if (msg && msg.senderId !== clientId) {
          onMessage?.(msg);
        }
      } catch {
        // Ignore malformed packets
      }
    });

    client.on('error', () => {
      if (closed) return;
      if (brokerIdx < BROKERS.length - 1) {
        brokerIdx += 1;
        client.end(true);
        connectNext();
      } else {
        onStatus?.('error');
      }
    });

    client.on('offline', () => {
      if (!closed) onStatus?.('reconnecting');
    });
  };

  connectNext();

  return {
    send(data) {
      if (client && client.connected) {
        client.publish(topic, JSON.stringify({ ...data, senderId: clientId }), { qos: 0 });
      }
    },
    close() {
      closed = true;
      if (client) {
        try {
          client.end(true);
        } catch {
          // Ignore close errors
        }
      }
    },
  };
}
