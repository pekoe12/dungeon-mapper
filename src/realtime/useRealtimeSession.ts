import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { drawBrushStroke } from '../utils/canvas';
import type { Point, Region } from '../types';

type Role = 'dm' | 'player';

type Op =
  | { type: 'map_replace'; image: string }
  | { type: 'draw_begin'; color: string; size: number; mode: 'brush' | 'eraser'; at: Point }
  | { type: 'draw_seg'; from: Point; to: Point; color?: string; size?: number; mode?: 'brush' | 'eraser' }
  | { type: 'draw_end' }
  | { type: 'fog_add_region'; points: Region }
  | { type: 'fog_reveal_indices'; indices: number[] }
  | { type: 'fog_reset' }
  | { type: 'fog_clear_all' };

type Incoming =
  | { type: 'state_full'; mapImage: string | null; fogRegions: Region[]; revealed: number[]; grid: boolean; gridSize: number; ops?: Op[] }
  | { type: 'op'; op: Op }
  | { type: 'presence'; count: number }
  | { type: 'ended' }
  | { type: 'error'; message: string };

class RealtimeClient {
  ws: WebSocket | null = null;
  roomCode: string | null = null;
  role: Role | null = null;
  dmSecret: string | null = null;
  status: 'idle' | 'connecting' | 'live' | 'ended' = 'idle';
  presenceCount = 0;
  listeners: Record<string, Set<(msg: any) => void>> = {};

  on(type: Incoming['type'], fn: (msg: any) => void) {
    if (!this.listeners[type]) this.listeners[type] = new Set();
    this.listeners[type]!.add(fn);
    return () => this.listeners[type]!.delete(fn);
  }

  emit(msg: Incoming) {
    const set = this.listeners[msg.type];
    if (!set) return;
    for (const fn of set) fn(msg as any);
  }

  async startHosting(origin: string): Promise<{ roomCode: string; dmSecret: string; shareUrl: string }> {
    if (this.status === 'live') throw new Error('already live');
    this.status = 'connecting';
    const res = await fetch('/api/session', { method: 'POST' });
    const { roomCode, dmSecret, shareUrl } = await res.json();
    this.roomCode = roomCode;
    this.dmSecret = dmSecret;
    this.role = 'dm';
    const wsUrl = this.buildWsUrl(origin, roomCode, 'dm', dmSecret);
    await this.connect(wsUrl);
    return { roomCode, dmSecret, shareUrl };
  }

  async endHosting(): Promise<void> {
    if (!this.roomCode || !this.dmSecret) return;
    await fetch(`/api/session/end?code=${encodeURIComponent(this.roomCode)}&secret=${encodeURIComponent(this.dmSecret)}`, { method: 'POST' });
    try { this.ws?.close(1000, 'ended'); } catch {}
    this.ws = null;
    this.status = 'ended';
  }

  async join(origin: string, roomCode: string): Promise<void> {
    this.roomCode = roomCode;
    this.role = 'player';
    this.status = 'connecting';
    const wsUrl = this.buildWsUrl(origin, roomCode, 'player');
    await this.connect(wsUrl);
  }

  buildWsUrl(origin: string, code: string, role: Role, secret?: string) {
    const url = new URL('/api/ws', origin);
    url.protocol = url.protocol.replace('http', 'ws');
    url.searchParams.set('code', code);
    url.searchParams.set('role', role);
    if (secret) url.searchParams.set('secret', secret);
    return url.toString();
  }

  async connect(url: string) {
    return new Promise<void>((resolve) => {
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.onopen = () => {
        this.status = 'live';
        resolve();
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as Incoming;
          if (msg.type === 'presence') this.presenceCount = msg.count;
          if (msg.type === 'ended') this.status = 'ended';
          this.emit(msg);
        } catch {}
      };
      ws.onclose = () => {
        if (this.status !== 'ended') this.status = 'idle';
      };
      ws.onerror = () => {};
    });
  }

  send(op: Op) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try { this.ws.send(JSON.stringify(op)); } catch {}
  }
}

let singleton: RealtimeClient | null = null;
export function getRealtime(): RealtimeClient {
  if (!singleton) singleton = new RealtimeClient();
  return singleton;
}

export const useRealtimeSession = () => {
  const {
    mapCanvasRef,
    setFogRegions,
    setRevealedRegions,
    setShowGrid,
    setGridSize,
    canvasWidth,
    canvasHeight,
  } = useAppContext();

  const client = useMemo(() => getRealtime(), []);
  const [status, setStatus] = useState(client.status);
  const [players, setPlayers] = useState(0);
  const [roomCode, setRoomCode] = useState<string | null>(client.roomCode);
  const roleRef = useRef<Role | null>(client.role);

  useEffect(() => {
    const unsub1 = client.on('presence', (m) => setPlayers(m.count));
    const unsub2 = client.on('ended', () => setStatus('ended'));
    const unsub3 = client.on('state_full', (m) => {
      applyStateFull(m);
      setStatus('live');
    });
    const unsub4 = client.on('op', (m) => applyOp(m.op));
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [client]);

  // Apply full state to canvases and state
  const applyStateFull = (m: Extract<Incoming, { type: 'state_full' }>) => {
    const mapCanvas = mapCanvasRef.current;
    if (mapCanvas && m.mapImage) {
      const ctx = mapCanvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = m.mapImage;
      }
    }
    setFogRegions(m.fogRegions || []);
    setRevealedRegions(new Set(m.revealed || []));
    setShowGrid(m.grid);
    setGridSize(m.gridSize);
    if (m.ops && m.ops.length > 0) m.ops.forEach(applyOp);
  };

  const applyOp = (op: Op) => {
    const mapCanvas = mapCanvasRef.current;
    if (!mapCanvas) return;
    const ctx = mapCanvas.getContext('2d');
    if (!ctx) return;
    switch (op.type) {
      case 'map_replace': {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
          ctx.drawImage(img, 0, 0);
        };
        img.src = op.image;
        break;
      }
      case 'draw_begin': {
        ctx.save();
        ctx.globalCompositeOperation = op.mode === 'eraser' ? 'destination-out' : 'source-over';
        ctx.fillStyle = op.color;
        ctx.beginPath();
        ctx.arc(op.at.x, op.at.y, (op.size || 5) / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'draw_seg': {
        const color = op.color as string | undefined;
        const size = (op.size as number | undefined) ?? 5;
        const isEraser = op.mode === 'eraser';
        drawBrushStroke(ctx, op.from, op.to, color || '#000000', size, isEraser);
        break;
      }
      case 'draw_end':
        break;
      case 'fog_add_region': {
        setFogRegions((prev) => [...prev, op.points]);
        break;
      }
      case 'fog_reveal_indices': {
        setRevealedRegions((prev) => {
          const next = new Set(prev);
          op.indices.forEach((i) => next.add(i));
          return next;
        });
        break;
      }
      case 'fog_clear_all': {
        setFogRegions([]);
        setRevealedRegions(new Set());
        break;
      }
      case 'fog_reset': {
        setRevealedRegions(new Set());
        break;
      }
    }
  };

  const startHosting = async () => {
    const origin = window.location.origin;
    const res = await client.startHosting(origin);
    setRoomCode(res.roomCode);
    roleRef.current = 'dm';
    setStatus('live');
    // Immediately mirror current canvas to players
    const mapCanvas = mapCanvasRef.current;
    if (mapCanvas) {
      try {
        const image = mapCanvas.toDataURL('image/webp', 0.9);
        client.send({ type: 'map_replace', image });
      } catch {}
    }
    return res;
  };

  const stopHosting = async () => {
    await client.endHosting();
    setStatus('ended');
  };

  const joinWithCode = async (code: string) => {
    const origin = window.location.origin;
    await client.join(origin, code);
    setRoomCode(code);
    roleRef.current = 'player';
    setStatus('live');
  };

  const send = (op: Op) => client.send(op);

  return {
    status,
    players,
    roomCode,
    role: roleRef.current as Role | null,
    isHosting: roleRef.current === 'dm' && status === 'live',
    startHosting,
    stopHosting,
    joinWithCode,
    send,
    client,
  };
};


