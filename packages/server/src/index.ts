import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import chokidar from 'chokidar';
import apiRoutes from './routes/api.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// WebSocket connections
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('WebSocket client connected');

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });

  // Send initial connection confirmation
  ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
});

// Broadcast to all connected clients
export function broadcast(message: object) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// File watcher for repository changes
let watcher: chokidar.FSWatcher | null = null;

export function setupWatcher(repoPath: string) {
  if (watcher) {
    watcher.close();
  }

  watcher = chokidar.watch(repoPath, {
    ignored: /(^|[\/\\])\..|node_modules|\.jj/,
    persistent: true,
    ignoreInitial: true,
  });

  watcher
    .on('add', (filePath) => broadcast({ type: 'file:added', path: filePath }))
    .on('change', (filePath) => broadcast({ type: 'file:changed', path: filePath }))
    .on('unlink', (filePath) => broadcast({ type: 'file:deleted', path: filePath }))
    .on('error', (error) => console.error('Watcher error:', error));
}

// Heartbeat mechanism for connection health
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

setInterval(() => {
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  });
}, HEARTBEAT_INTERVAL);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Jujutsu GUI Server running on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});
