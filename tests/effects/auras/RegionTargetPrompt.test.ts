import { setMockSettings } from "../../_setup/foundryMocks";

beforeEach(() => setMockSettings({ "enable-ddb-macro-region-behaviors": true }));

import RegionTargetPrompt from "../../../src/effects/auras/RegionTargetPrompt";
import { DDBSocket } from "../../../src/hooks/socket/sockets";

const request: IRegionTargetRequest = {
  id: "request", actorUuid: "Actor.source", regionUuid: "Scene.s.Region.r", title: "Aura", instruction: "Choose a visible creature",
  tokenUuids: ["Token.a", "Token.b"], activities: [{ id: "save", name: "Save" }], max: 1,
};
const selected = { tokens: ["Token.a"], activity: "save" };

afterEach(() => {
  vi.restoreAllMocks(); vi.unstubAllGlobals(); 
});

describe("region recipient choice", () => {
  it("does not open a local or remote prompt while the master is off", async () => {
    setMockSettings({ "enable-ddb-macro-region-behaviors": false });
    const show = vi.spyOn(RegionTargetPrompt, "show");
    expect(await RegionTargetPrompt.choose(request, {} as Actor.Implementation, new AbortController().signal)).toBeNull();
    expect(show).not.toHaveBeenCalled();
  });

  it("validates recipients, target limits, duplicates and activities", () => {
    expect(RegionTargetPrompt.validate(selected, request)).toEqual(selected);
    for (const value of [null, {}, { ...selected, activity: "unknown" }, { ...selected, tokens: ["Token.x"] },
      { ...selected, tokens: [] }, { ...selected, tokens: ["Token.a", "Token.b"] }]) {
      expect(RegionTargetPrompt.validate(value, request)).toBeNull();
    }
    expect(RegionTargetPrompt.validate({ ...selected, tokens: ["Token.a", "Token.a"] }, request)).toEqual(selected);
    expect(RegionTargetPrompt.validate({ ...selected, tokens: ["Token.a", "Token.b"] }, {
      ...request, max: 2, activities: [{ id: "save", name: "Save", max: 1 }],
    })).toBeNull();
  });

  it("prefers the active assigned character owner, then stable user id; ignores GMs and offline users", () => {
    const actor = { uuid: "Actor.source", testUserPermission: (user: { permitted: boolean }) => user.permitted };
    const users = [
      { id: "a", active: true, isGM: false, permitted: true },
      { id: "c", active: true, isGM: false, permitted: true, character: actor },
      { id: "0", active: true, isGM: true, permitted: true },
      { id: "b", active: false, isGM: false, permitted: true },
    ];
    vi.stubGlobal("game", { ...game, users });
    expect(RegionTargetPrompt.owner(actor as unknown as Actor.Implementation)?.id).toBe("c");
    users[1].active = false;
    expect(RegionTargetPrompt.owner(actor as unknown as Actor.Implementation)?.id).toBe("a");
    users[0].permitted = false;
    expect(RegionTargetPrompt.owner(actor as unknown as Actor.Implementation)).toBeNull();
  });

  it("hides hidden and unrendered recipients on player clients", () => {
    const tokens = [{ uuid: "Token.a", actor: {}, hidden: true, object: { isVisible: true } },
      { uuid: "Token.b", actor: {}, hidden: false, object: { isVisible: false } }];
    vi.stubGlobal("game", { ...game, user: { isGM: false } });
    vi.stubGlobal("fromUuidSync", (uuid: string) => tokens.find((token) => token.uuid === uuid));
    expect(RegionTargetPrompt.visibleTokens(request)).toEqual([]);
    tokens[0].hidden = false;
    expect(RegionTargetPrompt.visibleTokens(request)).toEqual([tokens[0]]);
    Object.assign(game.user, { isGM: true });
    expect(RegionTargetPrompt.visibleTokens(request)).toEqual(tokens);
  });

  it("recognizes the assigned character behind an unlinked source token", () => {
    const actor = { id: "source", uuid: "Scene.s.Token.t.Actor.source", testUserPermission: () => true };
    const users = [{ id: "a", active: true, isGM: false },
      { id: "b", active: true, isGM: false, character: { id: "source", uuid: "Actor.source" } }];
    vi.stubGlobal("game", { ...game, users });
    expect(RegionTargetPrompt.owner(actor as unknown as Actor.Implementation)?.id).toBe("b");
  });

  function routing() {
    const actor = {} as Actor.Implementation;
    vi.spyOn(RegionTargetPrompt, "owner").mockReturnValue({ id: "player" } as User.Implementation);
    let answerPlayer!: (value: unknown) => void;
    let remoteSignal: AbortSignal;
    const socket = {
      executeAsUserWithSignal: vi.fn((_fn: string, _user: string, signal: AbortSignal) => {
        remoteSignal = signal;
        return new Promise<unknown>((resolve, reject) => {
          answerPlayer = resolve;
          signal.addEventListener("abort", () => reject(new Error("cancelled")));
        });
      }),
      notifyUser: vi.fn(),
    };
    vi.stubGlobal("DDBImporter", { socket });
    let answerGM!: (value: unknown) => void;
    const show = vi.spyOn(RegionTargetPrompt, "show").mockImplementation(async (_request, signal, waiting) => {
      if (!waiting) return selected;
      return new Promise((resolve) => {
        answerGM = resolve;
        signal.addEventListener("abort", () => resolve(null));
      });
    });
    const controller = new AbortController();
    const promise = RegionTargetPrompt.choose(request, actor, controller.signal);
    return { socket, show, controller, promise, answerPlayer: (value: unknown) => answerPlayer(value),
      answerGM: (value: unknown) => answerGM(value), aborted: () => remoteSignal.aborted };
  }

  it("returns the player's selection and closes the GM controls", async () => {
    const s = routing();
    s.answerPlayer(selected);
    expect(await s.promise).toEqual(selected);
    expect(s.show).toHaveBeenCalledOnce();
    expect(s.aborted()).toBe(true);
  });

  it("lets the GM take over and ignores a late player reply", async () => {
    const s = routing();
    s.answerGM("takeover");
    expect(await s.promise).toEqual(selected);
    s.answerPlayer({ tokens: ["Token.b"], activity: "save" });
    expect(s.show).toHaveBeenCalledTimes(2);
    expect(s.socket.notifyUser).toHaveBeenCalledWith("cancelRegionTargetPrompt", "player", "request");
  });

  it.each(["skip", "deleted"])("cancels pending work on %s", async (reason) => {
    const s = routing();
    if (reason === "skip") s.answerGM("skip");
    else s.controller.abort();
    expect(await s.promise).toBeNull();
    expect(s.aborted()).toBe(true);
  });

  it("keeps the GM controls open when the player cannot be reached", async () => {
    const s = routing();
    // A disconnected remote does not answer. No timeout is scheduled.
    await Promise.resolve();
    expect(s.show).toHaveBeenCalledTimes(1);
    s.answerGM("takeover");
    expect(await s.promise).toEqual(selected);
  });

  it.each([false, undefined])("closes a remote dialog after its requesting GM is gone (%s)", async (gmState) => {
    let activeGM: boolean | undefined = true;
    vi.stubGlobal("Hooks", { on: vi.fn() });
    vi.stubGlobal("game", { ...game, user: { id: "player" },
      users: { get: () => activeGM === undefined ? undefined : { isActiveGM: activeGM } },
      socket: { on: vi.fn(), emit: vi.fn() },
    });
    vi.stubGlobal("fromUuidSync", () => ({ testUserPermission: () => true }));
    let signal!: AbortSignal;
    vi.spyOn(RegionTargetPrompt, "show").mockImplementation((_request, abortSignal) => {
      signal = abortSignal;
      return new Promise((resolve) => abortSignal.addEventListener("abort", () => resolve(null)));
    });
    const socket = new DDBSocket();
    RegionTargetPrompt.registerSocket(socket);
    const pending = socket.functions.get("regionTargetPrompt")!.call({ socketData: { userId: "gm" } }, request);
    RegionTargetPrompt.cancelObsolete();
    expect(signal.aborted).toBe(false);
    activeGM = gmState;
    RegionTargetPrompt.cancelObsolete();
    expect(await pending).toBeNull();
    expect(signal.aborted).toBe(true);
  });
});

describe("cancellable DDB socket requests", () => {
  it("removes an abandoned request and ignores its late response", async () => {
    vi.stubGlobal("game", { ...game, userId: "gm", users: { get: () => ({ active: true }) },
      socket: { on: vi.fn(), emit: vi.fn() } });
    const socket = new DDBSocket();
    socket.register("prompt", () => null);
    const controller = new AbortController();
    const promise = socket.executeAsUserWithSignal("prompt", "player", controller.signal, request);
    const id = [...socket.requests.keys()][0];
    const rejected = expect(promise).rejects.toMatchObject({ name: "AbortError" });
    controller.abort();
    await rejected;
    expect(socket.requests.size).toBe(0);
    expect(() => socket._receiveResponse({ id, type: "RESULT", result: selected }, "player")).not.toThrow();
    socket.notifyUser("prompt", "player", request);
    expect(socket.requests.size).toBe(0);
  });
});
