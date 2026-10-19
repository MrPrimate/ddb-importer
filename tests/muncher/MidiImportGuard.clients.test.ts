import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import utils from "../../src/lib/Utils";
import { setMockModules, setMockSettings } from "../_setup/foundryMocks";
import type { DDBSocket } from "../../src/hooks/socket/sockets";

// Each GM client gets its own copy of the guard module, so in-memory state is per client while
// the world settings are shared, as they are in Foundry.

type TSocketFn = (this: { socketData: { userId: string } }, ...args: any[]) => unknown;

interface IClient {
  id: string;
  functions: Map<string, TSocketFn>;
  hooks: Map<string, (...args: any[]) => void>;
  guard: any;
}

const ORIGINAL = { midiDeadCondition: "dead", midiUnconsciousCondition: "unconscious", addDead: "all", addWounded: 25 };
const SAFE = { midiDeadCondition: "none", midiUnconsciousCondition: "none", addDead: "none", addWounded: 0 };

const g = globalThis as any;
let clients: Map<string, IClient>;
let users: { id: string; isGM: boolean; active: boolean }[];
let saved: Record<string, unknown>;

function midiConfig(): Record<string, unknown> {
  return utils.getSetting<Record<string, unknown>>("ConfigSettings", "midi-qol");
}

/** Runs fn as the given user, so `game.user` reads as that client. */
async function as<T>(userId: string, fn: () => T | Promise<T>): Promise<T> {
  const previous = g.game.user;
  const user = users.find((u) => u.id === userId)!;
  g.game.user = { id: user.id, isGM: user.isGM };
  try {
    return await fn();
  } finally {
    g.game.user = previous;
  }
}

async function connect(id: string): Promise<IClient> {
  users.find((u) => u.id === id)!.active = true;
  vi.resetModules();
  const guard = (await import("../../src/muncher/MidiImportGuard")).default;
  const client: IClient = { id, functions: new Map(), hooks: new Map(), guard };
  clients.set(id, client);
  await as(id, () => {
    g.Hooks = { on: (name: string, fn: (...args: any[]) => void) => client.hooks.set(name, fn) };
    guard.registerSocket({ register: (name: string, fn: TSocketFn) => client.functions.set(name, fn) } as unknown as DDBSocket);
  });
  await settle();
  return client;
}

async function disconnect(id: string) {
  users.find((u) => u.id === id)!.active = false;
  clients.delete(id);
  for (const client of clients.values()) {
    await as(client.id, () => client.hooks.get("userConnected")?.({ id }, false));
  }
  await settle();
}

async function settle() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

/** A socketlib stand-in: executeAsUser runs the handler on the target client, or throws when it is offline. */
function socket() {
  return {
    executeAsUser: async (name: string, target: string, ...args: unknown[]) => {
      const client = clients.get(target);
      if (!client) throw new Error(`user ${target} is not connected`);
      const caller = g.game.user.id;
      return as(target, () => client.functions.get(name)!.call({ socketData: { userId: caller } }, ...args));
    },
  };
}

async function begin(userId: string, importId: string) {
  const client = clients.get(userId)!;
  return as(userId, () => client.guard.begin(importId));
}

async function end(userId: string, holder: string, importId: string) {
  const client = clients.get(userId)!;
  return as(userId, () => client.guard.end(holder, importId));
}

describe("MidiImportGuard across clients", () => {

  beforeEach(() => {
    clients = new Map();
    saved = { set: g.game.settings.set, users: g.game.users, hooks: g.Hooks, importer: g.DDBImporter, user: g.game.user };
    users = [
      { id: "gmA", isGM: true, active: false },
      { id: "gmB", isGM: true, active: false },
      { id: "gm0", isGM: true, active: false },
      { id: "player1", isGM: false, active: false },
      { id: "player2", isGM: false, active: false },
    ];
    g.game.users = users;
    g.game.settings.set = async (moduleId: string, key: string, value: unknown) => {
      setMockSettings({ [`${moduleId}.${key}`]: value });
      return value;
    };
    g.DDBImporter = { ...g.DDBImporter, socket: socket() };
    setMockModules({ "midi-qol": { active: true } });
    setMockSettings({ "midi-qol.ConfigSettings": { ...ORIGINAL }, "midi-import-config-backup": {} });
  });

  afterEach(() => {
    g.game.settings.set = saved.set;
    g.game.users = saved.users;
    g.Hooks = saved.hooks;
    g.DDBImporter = saved.importer;
    g.game.user = saved.user;
  });

  it("restores Midi when the holding GM leaves mid-import and another GM is online", async () => {
    await connect("gmA");
    await connect("gmB");
    await connect("player1");
    const holder = await begin("player1", "import1");
    expect(holder).toBe("gmA");
    expect(midiConfig()).toEqual(SAFE);

    await disconnect("gmA");
    expect(midiConfig()).toEqual(SAFE);
    await end("player1", holder, "import1");
    expect(midiConfig()).toEqual(ORIGINAL);
  });

  it("restores Midi when the holding GM left and comes back after the import ended", async () => {
    await connect("gmA");
    await connect("gmB");
    await connect("player1");
    await begin("player1", "import1");
    await disconnect("gmA");
    await disconnect("player1");
    await connect("gmA");
    expect(midiConfig()).toEqual(ORIGINAL);
  });

  it("keeps Midi suspended until every import ends when a lower-id GM joins mid-import", async () => {
    await connect("gmA");
    await connect("player1");
    await connect("player2");
    const first = await begin("player1", "import1");
    expect(first).toBe("gmA");

    await connect("gm0");
    const second = await begin("player2", "import2");
    expect(second).toBe("gm0");
    await end("player2", second, "import2");
    expect(midiConfig()).toEqual(SAFE);

    await end("player1", first, "import1");
    expect(midiConfig()).toEqual(ORIGINAL);
  });

  it("restores Midi when the importing player leaves", async () => {
    await connect("gmA");
    await connect("player1");
    await begin("player1", "import1");
    await disconnect("player1");
    expect(midiConfig()).toEqual(ORIGINAL);
  });

  it("does not restore at GM startup while another client's import is still running", async () => {
    await connect("gmB");
    await connect("player1");
    await begin("player1", "import1");
    await connect("gmA");
    expect(midiConfig()).toEqual(SAFE);
  });

});
