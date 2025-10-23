/// <reference path="./functions/types.d.ts" />
export interface Env {
  ROOMS: DurableObjectNamespace;
  ASSETS: Fetcher;
}

type Point = { x: number; y: number };
type Region = Point[];

interface StateFullPayload {
  type: 'state_full';
  mapImage: string | null;
  fogRegions: Region[];
  revealed: number[];
  grid: boolean;
  gridSize: number;
  ops?: any[];
}

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...(init || {}),
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });
}

function generateCode(length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function generateSecret(length = 32): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/session' && request.method === 'POST') {
      const roomCode = generateCode();
      const dmSecret = generateSecret(40);
      const id = env.ROOMS.idFromName(roomCode);
      const stub = env.ROOMS.get(id);
      await stub.fetch('https://do/init', {
        method: 'POST',
        body: JSON.stringify({ dmSecret }),
      });
      const origin = `${url.protocol}//${url.host}`;
      const shareUrl = `${origin}/?room=${roomCode}`;
      return json({ roomCode, dmSecret, shareUrl });
    }

    if (url.pathname === '/api/session/end' && request.method === 'POST') {
      const code = url.searchParams.get('code');
      const secret = url.searchParams.get('secret');
      if (!code || !secret) return new Response('Missing code/secret', { status: 400 });
      const id = env.ROOMS.idFromName(code);
      const stub = env.ROOMS.get(id);
      return await stub.fetch('https://do/end', {
        method: 'POST',
        body: JSON.stringify({ secret }),
      });
    }

    if (url.pathname === '/api/ws' && request.method === 'GET') {
      const code = url.searchParams.get('code') || '';
      const id = env.ROOMS.idFromName(code);
      const stub = env.ROOMS.get(id);
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};

export class Room {
  state: DurableObjectState;
  env: Env;
  sockets: Set<WebSocket> = new Set();
  socketRoles: WeakMap<WebSocket, 'dm' | 'player'> = new WeakMap();
  dmSecret: string | null = null;
  active = false;
  mapImage: string | null = null;
  fogRegions: Region[] = [];
  revealed: number[] = [];
  grid = true;
  gridSize = 25;
  recentOps: any[] = [];
  recentOpsLimit = 5000;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith('/init') && request.method === 'POST') {
      const { dmSecret } = await request.json() as any;
      this.dmSecret = dmSecret;
      this.active = true;
      this.mapImage = null;
      this.fogRegions = [];
      this.revealed = [];
      this.recentOps = [];
      return new Response('ok');
    }

    if (url.pathname.endsWith('/end') && request.method === 'POST') {
      const { secret } = await request.json() as any;
      if (!this.dmSecret || secret !== this.dmSecret) return new Response('forbidden', { status: 403 });
      this.broadcast({ type: 'ended' });
      for (const ws of this.sockets) try { ws.close(1000, 'ended'); } catch {}
      this.sockets.clear();
      this.active = false;
      this.dmSecret = null;
      this.recentOps = [];
      return new Response('ok');
    }

    if (url.pathname.endsWith('/api/ws')) {
      const role = url.searchParams.get('role');
      const secret = url.searchParams.get('secret') || '';

      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];

      server.accept();

      const isDm = role === 'dm' && !!this.dmSecret && secret === this.dmSecret;
      if (role === 'dm' && !isDm) {
        server.send(JSON.stringify({ type: 'error', message: 'unauthorized' }));
        server.close(1008, 'unauthorized');
        return new Response(null, { status: 101, webSocket: client });
      }

      if (!this.active) {
        server.send(JSON.stringify({ type: 'ended' }));
        server.close(1000, 'not active');
        return new Response(null, { status: 101, webSocket: client });
      }

      this.sockets.add(server);
      this.socketRoles.set(server, isDm ? 'dm' : 'player');

      const payload: StateFullPayload = {
        type: 'state_full',
        mapImage: this.mapImage,
        fogRegions: this.fogRegions,
        revealed: this.revealed,
        grid: this.grid,
        gridSize: this.gridSize,
        ops: this.recentOps,
      };
      server.send(JSON.stringify(payload));
      this.broadcastPresence();

      server.addEventListener('message', (evt) => {
        try {
          const msg = JSON.parse(typeof (evt as any).data === 'string' ? (evt as any).data : '');
          const roleOfSender = this.socketRoles.get(server);
          const isSenderDm = roleOfSender === 'dm';
          if (!isSenderDm) return;
          const op = this.applyOp(msg);
          if (op) this.broadcast({ type: 'op', op });
        } catch (e) {
          try { server.send(JSON.stringify({ type: 'error', message: 'bad_message' })); } catch {}
        }
      });

      const cleanup = () => {
        this.sockets.delete(server);
        this.broadcastPresence();
      };
      server.addEventListener('close', cleanup);
      server.addEventListener('error', cleanup);

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('not found', { status: 404 });
  }

  applyOp(msg: any): any | null {
    switch (msg.type) {
      case 'map_replace': {
        if (typeof msg.image === 'string') {
          this.mapImage = msg.image;
          this.recentOps = [];
          return { type: 'map_replace', image: this.mapImage };
        }
        return null;
      }
      case 'draw_begin':
      case 'draw_seg':
      case 'draw_end': {
        this.pushRecent(msg);
        return msg;
      }
      case 'fog_add_region': {
        const points = Array.isArray(msg.points) ? msg.points : [];
        if (points.length > 0) {
          this.fogRegions.push(points);
          this.pushRecent(msg);
          return { type: 'fog_add_region', points };
        }
        return null;
      }
      case 'fog_reveal_indices': {
        const idxs: number[] = Array.isArray(msg.indices) ? msg.indices : [];
        for (const i of idxs) if (!this.revealed.includes(i)) this.revealed.push(i);
        this.pushRecent({ type: 'fog_reveal_indices', indices: idxs });
        return { type: 'fog_reveal_indices', indices: idxs };
      }
      case 'fog_clear_all': {
        this.fogRegions = [];
        this.revealed = [];
        this.pushRecent({ type: 'fog_clear_all' });
        return { type: 'fog_clear_all' };
      }
      case 'fog_reset': {
        this.revealed = [];
        this.pushRecent({ type: 'fog_reset' });
        return { type: 'fog_reset' };
      }
    }
    return null;
  }

  pushRecent(op: any) {
    this.recentOps.push(op);
    if (this.recentOps.length > this.recentOpsLimit) this.recentOps.shift();
  }

  broadcastPresence() {
    const count = Array.from(this.sockets).filter((ws) => this.socketRoles.get(ws) === 'player').length;
    this.broadcast({ type: 'presence', count });
  }

  broadcast(payload: any) {
    const raw = JSON.stringify(payload);
    for (const ws of this.sockets) {
      try { (ws as any).send(raw); } catch {}
    }
  }
}


