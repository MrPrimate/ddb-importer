import type { Socket } from "socket.io-client";
import logger from "../Logger";

export interface DDBMonsterAuthBody {
  betaKey: string;
  cobalt: string;
  characterId?: string | number | null;
  campaignId?: string | number | null;
  referrer?: string;
}

export interface DDBMonsterStartParams {
  searchTerm?: string;
  search?: string;
  sources?: number[];
  excludedCategories?: number[];
  monsterTypes?: string[];
  homebrew?: boolean;
  homebrewOnly?: boolean;
  excludeLegacy?: boolean;
  exactMatch?: boolean;
  cobalt?: string;
}

export interface DDBMonsterEvent {
  seq?: number | null;
  kind: string;
  payload?: any;
}

export interface DDBMonsterHandlers {
  onEvent: (event: DDBMonsterEvent) => void;
  onError?: (message: string, fatal: boolean) => void;
  onDone?: (summary: any) => void;
  onConnectError?: (err: Error) => void;
}

export default class DDBMonsterSocket {
  socket: Socket | null = null;
  proxyUrl: string;
  jobId: string | null = null;
  jobToken: string | null = null;
  lastSeq = 0;
  handlers: DDBMonsterHandlers | null = null;
  authenticated = false;

  constructor(proxyUrl: string) {
    this.proxyUrl = proxyUrl.replace(/\/$/, "");
  }

  connect(handlers: DDBMonsterHandlers) {
    this.handlers = handlers;
    const url = this.proxyUrl + "/monsters";
    this.socket = io(url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      logger.debug(`[DDBMonsterSocket] connected ${this.socket?.id}`);
    });

    this.socket.on("connect_error", (err) => {
      logger.warn(`[DDBMonsterSocket] connect_error: ${err.message}`);
      this.handlers?.onConnectError?.(err);
    });

    this.socket.on("event", (event: DDBMonsterEvent) => {
      if (event.seq != null && event.seq > this.lastSeq) this.lastSeq = event.seq;
      if (event.kind === "error") {
        const payload = event.payload ?? {};
        this.handlers?.onError?.(payload.message ?? "Unknown error", !!payload.fatal);
      } else if (event.kind === "done") {
        this.handlers?.onDone?.(event.payload);
      }
      this.handlers?.onEvent(event);
    });

    this.socket.on("reconnect", async () => {
      logger.info(`[DDBMonsterSocket] reconnected, resuming jobId=${this.jobId} lastSeq=${this.lastSeq}`);
      if (this.jobId && this.jobToken) {
        await this.resume();
      }
    });
  }

  private ensureConnected() {
    if (!this.socket) throw new Error("DDBMonsterSocket not connected, call connect() first");
    return this.socket;
  }

  auth(body: DDBMonsterAuthBody): Promise<{ ok: boolean; message?: string }> {
    const socket = this.ensureConnected();
    return new Promise((resolve) => {
      socket.emit("auth", body, (res: { ok: boolean; message?: string }) => {
        this.authenticated = !!res?.ok;
        resolve(res ?? { ok: false, message: "no ack" });
      });
    });
  }

  start(element: string, params: DDBMonsterStartParams): Promise<{ ok: boolean; jobId?: string; jobToken?: string; replayed?: number; message?: string }> {
    const socket = this.ensureConnected();
    return new Promise((resolve) => {
      socket.emit("start", { element, params }, (res: any) => {
        if (res?.ok) {
          this.jobId = res.jobId;
          this.jobToken = res.jobToken;
        }
        resolve(res ?? { ok: false, message: "no ack" });
      });
    });
  }

  resume(): Promise<{ ok: boolean; replayed?: number; status?: string; message?: string }> {
    const socket = this.ensureConnected();
    if (!this.jobId || !this.jobToken) {
      return Promise.resolve({ ok: false, message: "no active job to resume" });
    }
    return new Promise((resolve) => {
      socket.emit("resume", {
        jobId: this.jobId,
        jobToken: this.jobToken,
        lastSeq: this.lastSeq,
      }, (res: any) => resolve(res ?? { ok: false, message: "no ack" }));
    });
  }

  cancel(): Promise<{ ok: boolean; message?: string }> {
    const socket = this.ensureConnected();
    if (!this.jobId || !this.jobToken) {
      return Promise.resolve({ ok: false, message: "no active job" });
    }
    return new Promise((resolve) => {
      socket.emit("cancel", { jobId: this.jobId, jobToken: this.jobToken }, (res: any) => {
        resolve(res ?? { ok: false, message: "no ack" });
      });
    });
  }

  close() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlers = null;
    this.jobId = null;
    this.jobToken = null;
    this.lastSeq = 0;
    this.authenticated = false;
  }
}
