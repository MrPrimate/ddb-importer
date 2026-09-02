// @vitest-environment jsdom
// Pins queueSettingUpdate: ordering, coalescing and when the follow-up render is allowed to run.
// Removing several multi-select tags quickly fires change events faster than a settings write plus
// a re-render round trip; unserialised, an earlier click's render rebuilt the element from a stale
// value and the next change event wrote that stale value back, silently restoring removed entries.
// The render also has to hold off while the user has a dropdown open, or it closes it under them.

// the lib barrel imports app dialogs that extend DDBAppV2, so pulling it in for
// real here would be a circular import; only logger is needed
vi.mock("../../src/lib/_module", () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import DDBAppV2 from "../../src/apps/DDBAppV2";

type TQueueApp = DDBAppV2 & {
  element: HTMLElement;
  render: ReturnType<typeof vi.fn>;
  settingRenderPromise: Promise<void> | null;
  queueSettingUpdate: (update: () => Promise<void>, options?: { key?: string | null; render?: boolean }) => Promise<void>;
  awaitSettingUpdates: () => Promise<void>;
};

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
    settingIdleWaiters: new Set<() => void>(),
    queueSettingUpdate: proto.queueSettingUpdate,
    awaitSettingUpdates: proto.awaitSettingUpdates,
    isUserEditingControl: proto.isUserEditingControl,
    awaitControlIdle: proto.awaitControlIdle,
    scheduleSettingRender: proto.scheduleSettingRender,
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

describe("DDBAppV2 setting update queue", () => {

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("awaitSettingUpdates resolves only once the queued writes have landed", async () => {
    const app = buildApp();
    const held = defer();
    let written = false;

    void app.queueSettingUpdate(async () => {
      await held.promise;
      written = true;
    }, { render: false });

    let idle = false;
    const waiter = app.awaitSettingUpdates().then(() => {
      idle = true;
    });
    await Promise.resolve();
    expect(idle).toBe(false);

    held.resolve();
    await waiter;
    expect(written).toBe(true);
    expect(idle).toBe(true);
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
    const first = defer();

    const blocker = app.queueSettingUpdate(async () => {
      await first.promise;
    });
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

    first.resolve();
    await Promise.all([blocker, ...queued]);
    await settle(app);

    expect(setting).toEqual(["sources", "categories", "unkeyed-1", "unkeyed-2"]);
  });

  it("does not render while a later update is still queued", async () => {
    const app = buildApp();
    const first = defer();
    const renderCallsWhenSecondRan: number[] = [];

    const slow = app.queueSettingUpdate(async () => first.promise);
    const fast = app.queueSettingUpdate(async () => {
      renderCallsWhenSecondRan.push(app.render.mock.calls.length);
    });

    first.resolve();
    await Promise.all([slow, fast]);
    await settle(app);

    // the first update must not have rendered before the second one wrote
    expect(renderCallsWhenSecondRan).toEqual([0]);
    expect(app.render).toHaveBeenCalledTimes(1);
  });

  it("holds the render while a control in the app has focus, and runs it on focusout", async () => {
    const app = buildApp(`<multi-select id="sources"><select><option value="a">A</option></select></multi-select>`);
    const select = app.element.querySelector("select")!;
    // an open <select> popup keeps focus on the select
    select.focus();

    await app.queueSettingUpdate(async () => Promise.resolve());
    await Promise.resolve();
    expect(app.render).not.toHaveBeenCalled();

    select.blur();
    select.dispatchEvent(new Event("focusout", { bubbles: true }));
    await vi.waitFor(() => expect(app.render).toHaveBeenCalledTimes(1));
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
