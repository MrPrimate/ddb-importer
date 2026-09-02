// @vitest-environment jsdom
// DDBMuncher.open() runs the pre-open checks and the first render behind the
// loading dialog. These pin the sequencing: the loader always closes, a cancel
// stops the sequence without an error toast, a failed cookie check hands off to
// the cookie dialog, concurrent opens share one load, and an open muncher is
// reused rather than duplicated.

import DDBMuncher from "../../src/apps/DDBMuncher";
import DDBMuncherLoader, { DDBMuncherLoadCancelled } from "../../src/apps/DDBMuncherLoader";
import DDBCookie from "../../src/apps/DDBCookie";
import { logger, PatreonHelper, Secrets } from "../../src/lib/_module";

interface IStubLoader {
  step: ReturnType<typeof vi.fn>;
  checkCancelled: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  cancelled: boolean;
}

/**
 * The ApplicationV2 and FormApplication stubs under test have no render, so install one on the
 * prototype for the spy to wrap; returns the function to restore afterwards.
 */
function installRender(proto: object) {
  Object.defineProperty(proto, "render", {
    value: async function (this: unknown) {
      return this;
    },
    configurable: true,
    writable: true,
  });
  return () => {
    delete (proto as Record<string, unknown>).render;
  };
}

function stubLoader(): IStubLoader {
  const loader: IStubLoader = {
    cancelled: false,
    step: vi.fn(),
    close: vi.fn(async () => undefined),
    checkCancelled: vi.fn(() => {
      if (loader.cancelled) throw new DDBMuncherLoadCancelled();
    }),
  };
  return loader;
}

describe("DDBMuncher.open", () => {

  let loader: IStubLoader;
  let renderSpy: ReturnType<typeof vi.spyOn>;
  let cookieRender: ReturnType<typeof vi.spyOn>;
  let checkCobalt: ReturnType<typeof vi.spyOn>;
  let isValidKey: ReturnType<typeof vi.spyOn>;
  let restore: (() => void)[] = [];
  let previousUi: unknown;

  beforeEach(() => {
    loader = stubLoader();
    restore = [installRender(DDBMuncher.prototype), installRender(DDBCookie.prototype)];
    vi.spyOn(DDBMuncherLoader, "open").mockImplementation(async () => loader as unknown as DDBMuncherLoader);
    renderSpy = vi.spyOn(DDBMuncher.prototype, "render");
    cookieRender = vi.spyOn(DDBCookie.prototype, "render");
    checkCobalt = vi.spyOn(Secrets, "checkCobalt").mockResolvedValue({ success: true, message: "" });
    isValidKey = vi.spyOn(PatreonHelper, "isValidKey").mockResolvedValue(true);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
    previousUi = (globalThis as any).ui;
    (globalThis as any).ui = { notifications: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } };
    (globalThis as any).foundry.applications.instances = new Map();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const fn of restore) fn();
    (globalThis as any).ui = previousUi;
  });

  it("checks the cookie, checks the key, renders, and closes the loader", async () => {
    const muncher = await DDBMuncher.open();

    expect(muncher).toBeInstanceOf(DDBMuncher);
    expect(checkCobalt).toHaveBeenCalledTimes(1);
    expect(isValidKey).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledWith({ force: true });
    expect(loader.step.mock.calls.map((c) => c[0])).toEqual([
      "Checking your D&D Beyond cookie...",
      "Checking your Patreon key...",
    ]);
    expect(loader.close).toHaveBeenCalledTimes(1);
    // the window is up, so later re-renders must not report to a closed dialog
    expect(muncher?.loader).toBeNull();
  });

  it("stops after the cookie check when cancelled, with no error toast", async () => {
    checkCobalt.mockImplementation(async () => {
      loader.cancelled = true;
      return { success: true, message: "" };
    });

    const muncher = await DDBMuncher.open();

    expect(muncher).toBeNull();
    expect(isValidKey).not.toHaveBeenCalled();
    expect(renderSpy).not.toHaveBeenCalled();
    expect(loader.close).toHaveBeenCalledTimes(1);
    expect((globalThis as any).ui.notifications.error).not.toHaveBeenCalled();
  });

  it("swallows a cancel thrown from the first render", async () => {
    renderSpy.mockRejectedValue(new DDBMuncherLoadCancelled());

    const muncher = await DDBMuncher.open();

    expect(muncher).toBeNull();
    expect(loader.close).toHaveBeenCalledTimes(1);
    expect((globalThis as any).ui.notifications.error).not.toHaveBeenCalled();
  });

  it("hands off to the cookie dialog when the cookie check fails", async () => {
    checkCobalt.mockResolvedValue({ success: false, message: "expired" });

    const muncher = await DDBMuncher.open();

    expect(muncher).toBeNull();
    expect(cookieRender).toHaveBeenCalledTimes(1);
    expect(isValidKey).not.toHaveBeenCalled();
    expect(loader.close).toHaveBeenCalledTimes(1);
  });

  it("returns null without rendering when the Patreon key is rejected", async () => {
    isValidKey.mockResolvedValue(false);

    const muncher = await DDBMuncher.open();

    expect(muncher).toBeNull();
    expect(renderSpy).not.toHaveBeenCalled();
    expect(loader.close).toHaveBeenCalledTimes(1);
  });

  it("reports a real failure and still closes the loader", async () => {
    checkCobalt.mockRejectedValue(new Error("proxy down"));

    const muncher = await DDBMuncher.open();

    expect(muncher).toBeNull();
    expect(loader.close).toHaveBeenCalledTimes(1);
    expect((globalThis as any).ui.notifications.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalled();
  });

  it("joins an open already in flight instead of starting another", async () => {
    // open() awaits the loader before it reaches the cookie check, so the gate is built up front
    // rather than captured inside the mock
    let release: (value: { success: boolean; message: string }) => void = () => undefined;
    const gate = new Promise<{ success: boolean; message: string }>((resolve) => {
      release = resolve;
    });
    checkCobalt.mockReturnValue(gate);

    const first = DDBMuncher.open();
    const second = DDBMuncher.open();
    release({ success: true, message: "" });
    const [a, b] = await Promise.all([first, second]);

    expect(a).toBe(b);
    expect(DDBMuncherLoader.open).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it("brings an already-open muncher to the front", async () => {
    const existing = Object.create(DDBMuncher.prototype) as DDBMuncher;
    const bringToFront = vi.fn();
    Object.defineProperty(existing, "rendered", { value: true });
    Object.defineProperty(existing, "bringToFront", { value: bringToFront });
    (globalThis as any).foundry.applications.instances.set(DDBMuncher.DEFAULT_OPTIONS.id, existing);

    const muncher = await DDBMuncher.open();

    expect(muncher).toBe(existing);
    expect(bringToFront).toHaveBeenCalledTimes(1);
    expect(DDBMuncherLoader.open).not.toHaveBeenCalled();
  });

});
