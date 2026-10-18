import { afterEach, beforeEach, describe, expect, it } from "vitest";
import MidiImportGuard from "../../src/muncher/MidiImportGuard";
import utils from "../../src/lib/Utils";
import { setMockModules, setMockSettings } from "../_setup/foundryMocks";
import type { DDBSocket } from "../../src/hooks/socket/sockets";

type TSocketFn = (this: { socketData: { userId: string } }, ...args: any[]) => unknown;

const ORIGINAL = { midiDeadCondition: "dead", midiUnconsciousCondition: "unconscious", addDead: "all", addWounded: 25, other: 1 };
const SAFE = { midiDeadCondition: "none", midiUnconsciousCondition: "none", addDead: "none", addWounded: 0 };

const g = globalThis as any;
let functions: Map<string, TSocketFn>;
let hooks: Map<string, (...args: any[]) => void>;
let originalSet: unknown;
let originalUsers: unknown;
let originalHooks: unknown;

function midiConfig(): Record<string, unknown> {
  return utils.getSetting<Record<string, unknown>>("ConfigSettings", "midi-qol");
}

function backup(): Record<string, unknown> {
  return utils.getSetting<Record<string, unknown>>("midi-import-config-backup");
}

function register() {
  MidiImportGuard.registerSocket({
    register: (name: string, fn: TSocketFn) => functions.set(name, fn),
  } as unknown as DDBSocket);
}

function acquire(importId: string, userId = "player1") {
  return functions.get("midiImportGuardAcquire")!.call({ socketData: { userId } }, importId);
}

function release(importId: string, userId = "player1") {
  return functions.get("midiImportGuardRelease")!.call({ socketData: { userId } }, importId);
}

describe("MidiImportGuard", () => {

  beforeEach(() => {
    functions = new Map();
    hooks = new Map();
    originalSet = g.game.settings.set;
    originalUsers = g.game.users;
    originalHooks = g.Hooks;
    g.game.settings.set = async (moduleId: string, key: string, value: unknown) => {
      setMockSettings({ [`${moduleId}.${key}`]: value });
      return value;
    };
    g.game.users = [{ id: "testUser", isGM: true, active: true }];
    g.Hooks = { on: (name: string, fn: (...args: any[]) => void) => hooks.set(name, fn) };
    setMockModules({ "midi-qol": { active: true } });
    setMockSettings({ "midi-qol.ConfigSettings": { ...ORIGINAL }, "midi-import-config-backup": {} });
  });

  afterEach(() => {
    g.game.settings.set = originalSet;
    g.game.users = originalUsers;
    g.Hooks = originalHooks;
  });

  it("suspends dead/unconscious handling until the last overlapping import ends", async () => {
    register();
    expect(await acquire("a")).toBe("testUser");
    expect(midiConfig()).toEqual({ ...ORIGINAL, ...SAFE });

    await acquire("b", "player2");
    await release("a");
    expect(midiConfig().addDead).toBe("none");

    await release("b", "player2");
    expect(midiConfig()).toEqual(ORIGINAL);
    expect(backup()).toEqual({});
  });

  it("keeps other midi settings changed during the import", async () => {
    register();
    await acquire("a");
    setMockSettings({ "midi-qol.ConfigSettings": { ...midiConfig(), other: 2 } });
    await release("a");
    expect(midiConfig()).toEqual({ ...ORIGINAL, other: 2 });
  });

  it("releases the imports of a player who disconnects", async () => {
    register();
    await acquire("a");
    hooks.get("userConnected")!({ id: "player1" }, false);
    await release("unrelated");
    expect(midiConfig()).toEqual(ORIGINAL);
  });

  it("restores a backup left by a GM client that went away mid-import", async () => {
    setMockSettings({
      "midi-qol.ConfigSettings": { ...ORIGINAL, ...SAFE },
      "midi-import-config-backup": { midiDeadCondition: "dead", midiUnconsciousCondition: "unconscious", addDead: "all", addWounded: 25 },
    });
    register();
    await release("unrelated");
    expect(midiConfig()).toEqual(ORIGINAL);
    expect(backup()).toEqual({});
  });

  it("does nothing on a player client", async () => {
    g.game.user.isGM = false;
    try {
      register();
      expect(await acquire("a")).toBeNull();
      expect(midiConfig()).toEqual(ORIGINAL);
      expect(hooks.size).toBe(0);
    } finally {
      g.game.user.isGM = true;
    }
  });

  it("sends a GM's own import to the coordinating GM rather than holding it locally", async () => {
    g.game.users = [
      { id: "testUser", isGM: true, active: true },
      { id: "gmA", isGM: true, active: true },
      { id: "gm0", isGM: true, active: false },
    ];
    const calls: unknown[][] = [];
    const originalImporter = g.DDBImporter;
    g.DDBImporter = { ...originalImporter, socket: { executeAsUser: async (...args: unknown[]) => {
      calls.push(args);
      return args[1];
    } } };
    try {
      expect(await MidiImportGuard.begin("a")).toBe("gmA");
      expect(calls).toEqual([["midiImportGuardAcquire", "gmA", "a"]]);
      expect(midiConfig()).toEqual(ORIGINAL);
    } finally {
      g.DDBImporter = originalImporter;
    }
  });

  it("skips the suspension when no GM is online", async () => {
    g.game.user.isGM = false;
    g.game.users = [{ id: "player1", isGM: false, active: true }];
    try {
      expect(await MidiImportGuard.begin("a")).toBeNull();
    } finally {
      g.game.user.isGM = true;
    }
  });

});
