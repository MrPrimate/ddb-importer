import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { queueSync } from "../../src/updater/syncQueue";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// Mirrors common/utils/semaphore.mjs. The shared mock in tests/_setup/foundryMocks.ts starts
// every task a microtask late, while Foundry starts an idle semaphore's task synchronously, and
// that timing decides whether the first call of a burst runs or is superseded.
class FoundrySemaphore {
  max: number;
  #queue: [(...args: any[]) => any, any[], (r: any) => void, (e: unknown) => void][] = [];
  #active = 0;
  constructor(max = 1) {
    this.max = max;
  }
  get remaining() {
    return this.#queue.length;
  }
  get active() {
    return this.#active;
  }
  add(fn: (...args: any[]) => any, ...args: any[]) {
    return new Promise((resolve, reject) => {
      this.#queue.push([fn, args, resolve, reject]);
      this.#try();
    });
  }
  async #try(): Promise<unknown> {
    if (this.#active === this.max || !this.#queue.length) return false;
    const [fn, args, resolve, reject] = this.#queue.shift()!;
    this.#active += 1;
    try {
      resolve(await fn(...args));
    } catch (err) {
      reject(err);
    }
    this.#active -= 1;
    return this.#try();
  }
}

const sharedSemaphore = foundry.utils.Semaphore;
beforeAll(() => {
  (foundry.utils as any).Semaphore = FoundrySemaphore;
});
afterAll(() => {
  (foundry.utils as any).Semaphore = sharedSemaphore;
});

describe("queueSync", () => {
  it("runs an idle key immediately", async () => {
    const result = await queueSync("idle", async () => "sent", "skipped");
    expect(result).toBe("sent");
  });

  it("runs one call at a time and skips queued calls superseded by a newer one", async () => {
    const first = deferred<string>();
    const calls: string[] = [];

    const a = queueSync("burst", () => {
      calls.push("a");
      return first.promise;
    }, "skipped");
    const b = queueSync("burst", async () => {
      calls.push("b");
      return "b";
    }, "skipped");
    const c = queueSync("burst", async () => {
      calls.push("c");
      return "c";
    }, "skipped");

    await flush();
    expect(calls).toEqual(["a"]);

    first.resolve("a");
    expect(await a).toBe("a");
    expect(await b).toBe("skipped");
    expect(await c).toBe("c");
    expect(calls).toEqual(["a", "c"]);
  });

  it("keeps separate keys independent", async () => {
    const blocked = deferred<string>();
    const calls: string[] = [];

    queueSync("actor:hitpoints", () => {
      calls.push("hp");
      return blocked.promise;
    }, "skipped");
    const slots = queueSync("actor:spellslots", async () => {
      calls.push("slots");
      return "slots";
    }, "skipped");

    expect(await slots).toBe("slots");
    expect(calls).toEqual(["hp", "slots"]);
    blocked.resolve("hp");
  });

  it("still runs the queued call when the running call fails", async () => {
    const first = deferred<string>();
    const a = queueSync("failure", () => first.promise, "skipped");
    const b = queueSync("failure", async () => "recovered", "skipped");

    first.reject(new Error("network"));
    await expect(a).rejects.toThrow("network");
    expect(await b).toBe("recovered");
  });

  it("runs again once the key is idle", async () => {
    await queueSync("drain", async () => "one", "skipped");
    const calls: string[] = [];
    const result = await queueSync("drain", async () => {
      calls.push("two");
      return "two";
    }, "skipped");
    expect(result).toBe("two");
    expect(calls).toEqual(["two"]);
  });
});
