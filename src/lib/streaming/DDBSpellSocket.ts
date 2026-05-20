import type { Socket } from "socket.io-client";
import logger from "../Logger";

export interface DDBSpellAuthBody {
  betaKey: string;
  cobalt: string;
  characterId?: string | number | null;
  campaignId?: string | number | null;
  referrer?: string;
}

export interface DDBSpellStartParams {
  className: string;
  rulesVersion: string;
  campaignId?: string | number | null;
  cobalt?: string;
}

export interface DDBSpellEvent {
  seq?: number | null;
  kind: string;
  payload?: any;
}

export interface DDBSpellHandlers {
  onEvent: (event: DDBSpellEvent) => void;
  onError?: (message: string, fatal: boolean) => void;
  onDone?: (summary: any) => void;
  onConnectError?: (err: Error) => void;
}

export default class DDBSpellSocket {
  socket: Socket | null = null;
  proxyUrl: string;
  jobId: string | null = null;
  jobToken: string | null = null;
  lastSeq = 0;
  handlers: DDBSpellHandlers | null = null;
  authenticated = false;

  constructor(proxyUrl: string) {
    this.proxyUrl = proxyUrl.replace(/\/$/, "");
  }

  connect(handlers: DDBSpellHandlers) {
    this.handlers = handlers;
    const url = this.proxyUrl + "/spells";
    this.socket = io(url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      logger.debug(`[DDBSpellSocket] connected ${this.socket?.id}`);
    });

    this.socket.on("connect_error", (err) => {
      logger.warn(`[DDBSpellSocket] connect_error: ${err.message}`);
      this.handlers?.onConnectError?.(err);
    });

    this.socket.on("event", (event: DDBSpellEvent) => {
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
      logger.info(`[DDBSpellSocket] reconnected, resuming jobId=${this.jobId} lastSeq=${this.lastSeq}`);
      if (this.jobId && this.jobToken) {
        await this.resume();
      }
    });
  }

  private ensureConnected() {
    if (!this.socket) throw new Error("DDBSpellSocket not connected, call connect() first");
    return this.socket;
  }

  auth(body: DDBSpellAuthBody): Promise<{ ok: boolean; message?: string }> {
    const socket = this.ensureConnected();
    return new Promise((resolve) => {
      socket.emit("auth", body, (res: { ok: boolean; message?: string }) => {
        this.authenticated = !!res?.ok;
        resolve(res ?? { ok: false, message: "no ack" });
      });
    });
  }

  start(element: string, params: DDBSpellStartParams): Promise<{ ok: boolean; jobId?: string; jobToken?: string; replayed?: number; message?: string }> {
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
