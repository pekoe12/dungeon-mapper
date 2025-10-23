// Minimal Cloudflare Workers runtime types for Pages Functions (advanced mode)
// This is intentionally tiny to satisfy TypeScript for the root _worker.ts.

interface DurableObjectId {}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectStub {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

interface DurableObjectState {
  storage: DurableObjectStorage;
}

interface DurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | null>;
  put<T = unknown>(key: string, value: T): Promise<void>;
}

// Intentionally omit WebSocketPair declaration here to avoid redeclare with /functions/types.d.ts

// Add accept() on server WebSocket per Workers runtime
interface WebSocket {
  accept(): void;
}

// Allow upgrade Response with webSocket property
interface ResponseInit {
  webSocket?: WebSocket;
}

// Pages assets fetcher binding
interface Fetcher {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}



