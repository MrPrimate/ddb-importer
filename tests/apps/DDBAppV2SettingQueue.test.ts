// @vitest-environment jsdom
// Pins queueSettingUpdate: ordering, coalescing, when the follow-up render is allowed to run, and
// the multi-select state carried across a render that lands anyway.
//
// Removing several multi-select tags quickly fires change events faster than a world settings write
// (a server round trip) can complete. A render landing between two of those clicks rebuilds the
// control from a setting the later clicks have already moved past, so a removed tag reappears - and
// the next click is then computed from that resurrected value and writes it straight back, which is
// how a burst of four removals used to end up keeping two.

// the lib barrel imports app dialogs that extend DDBAppV2, so pulling it in for
// real here would be a circular import; only logger is needed
vi.mock("../../src/lib/_module", () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import DDBAppV2 from "../../src/apps/DDBAppV2";

type TQueueApp = DDBAppV2 & {
  element: HTMLElement;
  render: ReturnType<typeof vi.fn>;
  rendered: boolean;
  lastInteractionAt: number;
  pendingSettingUpdates: number;
  settingRenderPromise: Promise<void> | null;
  queueSettingUpdate: (update: () => Promise<void>, options?: { key?: string | null; render?: boolean }) => Promise<void>;
  trackInteractions: () => void;
  canRunQueuedRender: () => boolean;
  _preSyncPartState: (partId: string, newElement: HTMLElement, priorElement: HTMLElement, state: any) => void;
  _syncPartState: (partId: string, newElement: HTMLElement, priorElement: HTMLElement, state: any) => void;
};

// jsdom in this setup has no CSS.escape, which the selector builder uses
(globalThis as any).CSS ??= { escape: (value: string) => value };

// the mixin base is a bare class under test, so give the two part-state hooks something to super to
const base = Object.getPrototypeOf(DDBAppV2.prototype);
base._preSyncPartState = vi.fn();
base._syncPartState = vi.fn();

// DDBAppV2 is abstract and its constructor needs foundry globals, so exercise the queue
// against a plain object carrying the state and the markup the methods touch
function buildApp(markup = ""): TQueueApp {
  const element = document.createElement("div");
  element.innerHTML = markup;
  document.body.append(element);
  const proto = DDBAppV2.prototype as any;
  const app = {
    element,
    rendered: true,
    render: vi.fn(async () => Promise.resolve()),
    settingUpdateChain: Promise.resolve(),
    pendingSettingUpdates: 0,
    latestSettingUpdates: new Map<string, symbol>(),
    settingRenderPromise: null,
    // shortened so the tests do not sit through the real 400ms quiet period
    settingRenderIdleMs: 30,
    settingRenderPollMs: 5,
    lastInteractionAt: 0,
    interactionElement: null,
    queueSettingUpdate: proto.queueSettingUpdate,
    awaitSettingUpdates: proto.awaitSettingUpdates,
    isUserEditingControl: proto.isUserEditingControl,
    trackInteractions: proto.trackInteractions,
    canRunQueuedRender: proto.canRunQueuedRender,
    scheduleSettingRender: proto.scheduleSettingRender,
    _preSyncPartState: proto._preSyncPartState,
    _syncPartState: proto._syncPartState,
  };
  return app as unknown as TQueueApp;
}

// the render is scheduled off the write chain, so tests wait for it separately
async function settle(app: TQueueApp) {
  await app.settingRenderPromise;
  await Promise.resolve();
}

function defer() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

// a stand-in for Foundry's <multi-select>, which is not defined in jsdom
function buildMultiSelect(id: string, options: string[], selected: string[]) {
  const element = document.createElement("multi-select");
  element.id = id;
  for (const option of options) {
    const el = document.createElement("option");
    el.value = option;
    element.append(el);
  }
  Object.assign(element, { _value: new Set(selected), _refresh: vi.fn() });
  return element as HTMLElement & { _value: Set<string>; _refresh: ReturnType<typeof vi.fn> };
}

describe("DDBAppV2 setting update queue", () => {

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("writes queued updates in order and renders once, after the last one", async () => {
    const app = buildApp();
    const setting: string[][] = [];
    const writes = [["a", "b"], ["a"], []];

    await Promise.all(writes.map((value) => app.queueSettingUpdate(async () => {
      await Promise.resolve();
      setting.push(value);
    })));
    await settle(app);

    expect(setting).toEqual(writes);
    expect(app.render).toHaveBeenCalledTimes(1);
  });

  it("applies only the last queued write for a key", async () => {
    const app = buildApp();
    const setting: string[][] = [];
    const held = defer();

    // an unrelated write occupies the chain so the keyed ones queue up behind it
    const blocker = app.queueSettingUpdate(async () => held.promise);
    const keyed = [["a", "b"], ["a"], []].map((value) => app.queueSettingUpdate(async () => {
      setting.push(value);
    }, { key: "sources" }));

    held.resolve();
    await Promise.all([blocker, ...keyed]);
    await settle(app);

    // the two superseded writes are skipped: they hold values the user has moved on from
    expect(setting).toEqual([[]]);
    expect(app.render).toHaveBeenCalledTimes(1);
  });

  it("keeps writes for different keys, and unkeyed writes always run", async () => {
    const app = buildApp();
    const setting: string[] = [];
    const held = defer();

    const blocker = app.queueSettingUpdate(async () => held.promise);
    const queued = [
      app.queueSettingUpdate(async () => {
        setting.push("sources");
      }, { key: "sources" }),
      app.queueSettingUpdate(async () => {
        setting.push("categories");
      }, { key: "categories" }),
      app.queueSettingUpdate(async () => {
        setting.push("unkeyed-1");
      }),
      app.queueSettingUpdate(async () => {
        setting.push("unkeyed-2");
      }),
    ];

    held.resolve();
    await Promise.all([blocker, ...queued]);
    await settle(app);

    expect(setting).toEqual(["sources", "categories", "unkeyed-1", "unkeyed-2"]);
  });

  it("does not render while a later update is still queued", async () => {
    const app = buildApp();
    const held = defer();
    const renderCallsWhenSecondRan: number[] = [];

    const slow = app.queueSettingUpdate(async () => held.promise);
    const fast = app.queueSettingUpdate(async () => {
      renderCallsWhenSecondRan.push(app.render.mock.calls.length);
    });

    held.resolve();
    await Promise.all([slow, fast]);
    await settle(app);

    // the first update must not have rendered before the second one wrote
    expect(renderCallsWhenSecondRan).toEqual([0]);
    expect(app.render).toHaveBeenCalledTimes(1);
  });

  it("holds the render until the user stops clicking", async () => {
    const app = buildApp(`<multi-select id="sources"></multi-select>`);
    app.trackInteractions();
    const sources = app.element.querySelector("multi-select")!;

    // a burst of tag removals: each click resets the quiet period the render waits for
    for (let i = 0; i < 4; i++) {
      sources.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      await app.queueSettingUpdate(async () => Promise.resolve(), { key: "sources" });
      expect(app.render).not.toHaveBeenCalled();
    }

    await settle(app);
    expect(app.render).toHaveBeenCalledTimes(1);
  });

  it("holds the render while a control in the app has focus", async () => {
    const app = buildApp(`<multi-select id="sources"><select><option value="a">A</option></select></multi-select>`);
    const select = app.element.querySelector("select")!;
    // an open <select> popup keeps focus on the select
    select.focus();

    await app.queueSettingUpdate(async () => Promise.resolve());
    expect(app.canRunQueuedRender()).toBe(false);
    expect(app.render).not.toHaveBeenCalled();

    select.blur();
    await settle(app);
    expect(app.render).toHaveBeenCalledTimes(1);
  });

  it("stops waiting to render once the app is closed", async () => {
    const app = buildApp();
    app.lastInteractionAt = Date.now();
    const queued = app.queueSettingUpdate(async () => Promise.resolve());
    app.rendered = false;

    await queued;
    await settle(app);
    expect(app.render).not.toHaveBeenCalled();
  });

  it("carries live multi-select values across a render that lands mid-write", async () => {
    const app = buildApp();
    const prior = document.createElement("div");
    const next = document.createElement("div");
    // the user has removed b and c; only the write for b has reached the setting so far
    prior.append(buildMultiSelect("sources", ["a", "b", "c", "d"], ["a", "d"]));
    const rendered = buildMultiSelect("sources", ["a", "b", "c", "d"], ["a", "c", "d"]);
    next.append(rendered);

    app.pendingSettingUpdates = 1;
    const state: any = {};
    app._preSyncPartState("settings", next, prior, state);
    app._syncPartState("settings", next, prior, state);

    expect(Array.from(rendered._value)).toEqual(["a", "d"]);
    expect(rendered._refresh).toHaveBeenCalled();
  });

  it("drops carried values the re-render no longer offers as options", async () => {
    const app = buildApp();
    const prior = document.createElement("div");
    const next = document.createElement("div");
    prior.append(buildMultiSelect("sources", ["a", "b"], ["a", "b"]));
    // a category change narrowed the book list, so b is no longer selectable
    const rendered = buildMultiSelect("sources", ["a"], ["a"]);
    next.append(rendered);

    app.pendingSettingUpdates = 1;
    const state: any = {};
    app._preSyncPartState("settings", next, prior, state);
    app._syncPartState("settings", next, prior, state);

    expect(Array.from(rendered._value)).toEqual(["a"]);
  });

  it("leaves the rendered value alone when no write is in flight", async () => {
    const app = buildApp();
    const prior = document.createElement("div");
    const next = document.createElement("div");
    prior.append(buildMultiSelect("sources", ["a", "b"], ["a"]));
    const rendered = buildMultiSelect("sources", ["a", "b"], ["a", "b"]);
    next.append(rendered);

    const state: any = {};
    app._preSyncPartState("settings", next, prior, state);
    app._syncPartState("settings", next, prior, state);

    // the setting is authoritative here, so the render wins
    expect(Array.from(rendered._value)).toEqual(["a", "b"]);
    expect(rendered._refresh).not.toHaveBeenCalled();
  });

  it("keeps the queue moving when an update throws", async () => {
    const app = buildApp();
    const after = vi.fn(async () => Promise.resolve());

    await Promise.all([
      app.queueSettingUpdate(async () => {
        throw new Error("settings write failed");
      }),
      app.queueSettingUpdate(after),
    ]);
    await settle(app);

    expect(after).toHaveBeenCalled();
    expect(app.render).toHaveBeenCalledTimes(1);
  });

  it("skips the render when the caller asks for none", async () => {
    const app = buildApp();
    await app.queueSettingUpdate(async () => Promise.resolve(), { render: false });
    await settle(app);
    expect(app.render).not.toHaveBeenCalled();
  });

});
