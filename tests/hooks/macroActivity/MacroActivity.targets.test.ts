import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// The macro activity's subsequent actions hand its macro the targets. Region automation runs them
// on the GM, often for a scene the GM is not viewing, so a usage config that names its recipients
// must win over the GM's canvas targets.

vi.mock("../../../src/hooks/macroActivity/MacroActivityData", () => ({ default: class {} }));
vi.mock("../../../src/hooks/macroActivity/MacroSheet", () => ({ default: class {} }));

let MacroActivity: any;

beforeAll(async () => {
  const dnd5e = (globalThis as any).dnd5e;
  dnd5e.documents ??= {};
  dnd5e.documents.activity ??= {};
  dnd5e.documents.activity.ActivityMixin ??= (Base: any) => class extends Base {
    static LOCALIZATION_PREFIXES: string[] = [];
    static metadata = {};
  };
  MacroActivity = (await import("../../../src/hooks/macroActivity/MacroActivity")).default;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as any).fromUuidSync;
});

function activity(fn: string) {
  const instance = Object.create(MacroActivity.prototype);
  instance.macro = { function: fn };
  instance._executeDDBMacro = vi.fn();
  instance._executeFoundryMacro = vi.fn();
  return instance;
}

describe("MacroActivity subsequent actions", () => {
  const gmTarget = { document: { uuid: "Scene.s.Token.gmPick" } };

  it("hands a ddb macro the named recipients instead of the user's targets", async () => {
    (globalThis as any).game.user.targets = new Set([gmTarget]);
    const macro = activity("ddb.generic.light");
    await macro._triggerSubsequentActions({ ddbTargetUuids: ["Scene.s.Token.tok1"], ddbMacroParameters: "{}" }, {});
    expect(macro._executeDDBMacro).toHaveBeenCalledWith(["Scene.s.Token.tok1"], "{}", undefined);
  });

  it("resolves named recipients to tokens for a Foundry macro, using the document off-canvas", async () => {
    (globalThis as any).game.user.targets = new Set([gmTarget]);
    const drawn = { id: "drawn" };
    (globalThis as any).fromUuidSync = vi.fn((uuid: string) => (uuid.endsWith("tok1") ? { object: drawn } : { uuid, object: null }));
    const macro = activity("My Macro");
    await macro._triggerSubsequentActions({ ddbTargetUuids: ["Scene.s.Token.tok1", "Scene.other.Token.tok2"] }, {});
    expect(macro._executeFoundryMacro).toHaveBeenCalledWith(
      [drawn, { uuid: "Scene.other.Token.tok2", object: null }], undefined, undefined,
    );
  });

  it("falls back to the user's targets when the caller names none", async () => {
    (globalThis as any).game.user.targets = new Set([gmTarget]);
    const macro = activity("ddb.generic.light");
    await macro._triggerSubsequentActions({}, {});
    expect(macro._executeDDBMacro).toHaveBeenCalledWith(["Scene.s.Token.gmPick"], undefined, undefined);
  });
});
