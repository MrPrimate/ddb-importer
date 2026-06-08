import type { Socket } from "socket.io-client";
import logger from "../Logger";

export interface BaseStreamAuthBody {
  betaKey: string;
  cobalt: string;
  characterId?: string | number | null;
  campaignId?: string | number | null;
  referrer?: string;
}

export interface BaseStreamEvent {
  seq?: number | null;
  kind: string;
  payload?: any;
}

export interface BaseStreamHandlers<E extends BaseStreamEvent = BaseStreamEvent> {
  onEvent: (event: E) => void;
  onError?: (message: string, fatal: boolean) => void;
  onDone?: (summary: any) => void;
  onConnectError?: (err: Error) => void;
}

export interface StartAck {
  ok: boolean;
  jobId?: string;
  jobToken?: string;
  replayed?: number;
  message?: string;
}

export interface RunJobOptions<E extends BaseStreamEvent = BaseStreamEvent> {
  timeoutMs?: number;
  onEvent?: (event: E) => void;
}

/**
 * Shared websocket plumbing for the DDB streaming endpoints (spells / items /
 * monsters). The three content types only differ by namespace, log tag and the
 * structural param/event types, so everything else lives here.
 *
 * Designed for connection reuse: `connect()` + `auth()` once, then issue any
 * number of jobs over the same socket via `runJob()` (or `start()` directly).
 */
export default abstract class BaseStreamSocket<
  TStart = Record<string, any>,
  E extends BaseStreamEvent = BaseStreamEvent
> {
  socket: Socket | null = null;
  proxyUrl: string;
  jobId: string | null = null;
  jobToken: string | null = null;
  lastSeq = 0;
  handlers: BaseStreamHandlers<E> | null = null;
  authenticated = false;

  protected abstract get namespace(): string;
  protected abstract get logTag(): string;

  constructor(proxyUrl: string) {
    this.proxyUrl = proxyUrl.replace(/\/$/, "");
  }

  connect(handlers?: BaseStreamHandlers<E>) {
    this.handlers = handlers ?? null;
    const url = this.proxyUrl + this.namespace;
    this.socket = io(url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      logger.debug(`${this.logTag} connected ${this.socket?.id}`);
    });

    this.socket.on("connect_error", (err) => {
      logger.warn(`${this.logTag} connect_error: ${err.message}`);
      this.handlers?.onConnectError?.(err);
    });

    this.socket.on("event", (event: E) => {
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
      logger.info(`${this.logTag} reconnected, resuming jobId=${this.jobId} lastSeq=${this.lastSeq}`);
      if (this.jobId && this.jobToken) {
        await this.resume();
      }
    });
  }

  protected ensureConnected() {
    if (!this.socket) throw new Error(`${this.logTag} not connected, call connect() first`);
    return this.socket;
  }

  auth(body: BaseStreamAuthBody, timeoutMs = 20000): Promise<{ ok: boolean; message?: string }> {
    const socket = this.ensureConnected();
    // Fail fast if the socket can't connect (e.g. a custom/self-hosted proxy
    // that doesn't expose this namespace). Without this the auth ack callback
    // never fires and the caller hangs forever instead of falling back to HTTP.
    return new Promise((resolve) => {
      let settled = false;
      const finish = (res: { ok: boolean; message?: string }) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        socket.off("connect_error", onConnectError);
        this.authenticated = !!res?.ok;
        resolve(res);
      };

      const onConnectError = (err: Error) => {
        logger.warn(`${this.logTag} auth connect_error: ${err.message}`);
        finish({ ok: false, message: err.message || "connect error" });
      };

      const timer: ReturnType<typeof setTimeout> | null = timeoutMs && timeoutMs > 0
        ? setTimeout(() => finish({ ok: false, message: `${this.logTag} auth timed out` }), timeoutMs)
        : null;

      socket.on("connect_error", onConnectError);
      socket.emit("auth", body, (res: { ok: boolean; message?: string }) => {
        finish(res ?? { ok: false, message: "no ack" });
      });
    });
  }

  start(element: string, params: TStart): Promise<StartAck> {
    const socket = this.ensureConnected();
    // reset per-job state so a reused connection doesn't carry a prior job's seq
    this.lastSeq = 0;
    this.jobId = null;
    this.jobToken = null;
    return new Promise((resolve) => {
      socket.emit("start", { element, params }, (res: StartAck) => {
        if (res?.ok) {
          this.jobId = res.jobId ?? null;
          this.jobToken = res.jobToken ?? null;
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
      }, (res: { ok: boolean; replayed?: number; status?: string; message?: string }) =>
        resolve(res ?? { ok: false, message: "no ack" }));
    });
  }

  cancel(): Promise<{ ok: boolean; message?: string }> {
    const socket = this.ensureConnected();
    if (!this.jobId || !this.jobToken) {
      return Promise.resolve({ ok: false, message: "no active job" });
    }
    return new Promise((resolve) => {
      socket.emit("cancel", { jobId: this.jobId, jobToken: this.jobToken }, (res: { ok: boolean; message?: string }) => {
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

  /**
   * Run a single streaming job on an already-connected + authed socket and
   * resolve once the job's `done` event arrives. Rejects on fatal error,
   * connect error, or timeout. Re-points `this.handlers` at the active job, so
   * jobs must run sequentially on a given connection (await before the next).
   */
  runJob(element: string, params: TStart, options: RunJobOptions<E> = {}): Promise<any> {
    const { timeoutMs, onEvent } = options;
    return new Promise((resolve, reject) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const finish = (err: Error | null, summary: any) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        if (err) reject(err);
        else resolve(summary);
      };

      this.handlers = {
        onEvent: (event: E) => onEvent?.(event),
        onError: (message, fatal) => {
          if (fatal) finish(new Error(message), null);
          else logger.warn(`${this.logTag} non-fatal error: ${message}`);
        },
        onDone: (summary) => finish(null, summary),
        onConnectError: (err) => finish(err, null),
      };

      if (timeoutMs && timeoutMs > 0) {
        timer = setTimeout(() => finish(new Error(`${this.logTag} job timed out`), null), timeoutMs);
      }

      this.start(element, params)
        .then((startRes) => {
          if (!startRes.ok) {
            finish(new Error(`Start failed: ${startRes.message}`), null);
          } else {
            logger.debug(`${this.logTag} jobId=${startRes.jobId} replayed=${startRes.replayed}`);
          }
        })
        .catch((err) => finish(err as Error, null));
    });
  }
}
