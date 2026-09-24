import RegionExpiryCleanup from "../../../src/effects/enhancers/Regions/RegionExpiryCleanup";
import { setMockSettings, resetMockSettings } from "../../_setup/foundryMocks";

// the real dialog extends dnd5e.applications.api.Dialog5e at evaluation time; confirms every
// offered template by default
const promptMock = vi.fn(async (entries: any[]) => entries.map((entry) => entry.uuid));
vi.mock("../../../src/effects/enhancers/Regions/RegionExpiryDialog", () => ({
  default: { prompt: (entries: any[]) => promptMock(entries) },
}));

function makeScene(regions: any[], id: string) {
  const scene: any = { uuid: `Scene.${id}`, id, grid: { units: "ft" }, view: vi.fn() };
  scene.regions = {
    [Symbol.iterator]: () => regions[Symbol.iterator](),
    has: (regionId: string) => regions.some((region) => region.id === regionId),
    get: (regionId: string) => regions.find((region) => region.id === regionId),
  };
  scene.tokens = [];
  for (const region of regions) region.parent = scene;
  return scene;
}

/** An activity-placed region whose activity is gone, so every sweep offers it. */
function makeOrphan(id: string, { brokenShapes = false } = {}) {
  const flags: Record<string, any> = { activity: `A.${id}`, item: null, origin: null };
  const region: any = {
    id,
    uuid: `Scene.x.Region.${id}`,
    name: id,
    behaviors: [],
    getFlag: (_scope: string, key: string) => flags[key],
    flags: { dnd5e: flags, ddbimporter: {} },
    parent: null,
  };
  // only the prompt's display data reads shapes, so the sweep still selects this region
  Object.defineProperty(region, "shapes", {
    get: () => {
      if (brokenShapes) throw new Error("malformed region");
      return [];
    },
  });
  return region;
}

describe("RegionExpiryCleanup queue", () => {
  const hooks: Record<string, (...args: any[]) => void> = {};
  const originalUser = (globalThis as any).game.user;
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);

  beforeAll(() => {
    vi.stubGlobal("Hooks", { on: (name: string, fn: (...args: any[]) => void) => (hooks[name] = fn) });
    // the flush is built lazily on first use, so this stands in for core's debounce throughout
    (foundry.utils as any).debounce = (fn: () => void, ms: number) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      return () => {
        clearTimeout(timer);
        timer = setTimeout(fn, ms);
      };
    };
    RegionExpiryCleanup.DEBOUNCE_MS = 0;
    RegionExpiryCleanup.registerHooks();
    process.on("unhandledRejection", onUnhandled);
  });

  afterAll(() => {
    process.off("unhandledRejection", onUnhandled);
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    setMockSettings({ "enable-region-expiry-cleanup": true });
    (globalThis as any).game.user = { id: "gm", isGM: true, isActiveGM: true };
    (globalThis as any).game.users = [];
    (globalThis as any).game.combats = [];
    (globalThis as any).fromUuidSync = () => null;
    (globalThis as any).ui = { notifications: { info: vi.fn(), warn: vi.fn() } };
    (foundry as any).documents ??= {};
    (foundry.documents as any).modifyBatch = vi.fn().mockResolvedValue([]);
    unhandled.length = 0;
  });

  afterEach(() => {
    promptMock.mockReset();
    promptMock.mockImplementation(async (entries: any[]) => entries.map((entry) => entry.uuid));
    RegionExpiryCleanup.forget();
    resetMockSettings();
    (globalThis as any).game.user = originalUser;
    delete (globalThis as any).fromUuidSync;
    delete (globalThis as any).canvas;
  });

  /** Show `scene` and let the canvasReady sweep queue its expired regions. */
  function viewScene(scene: any) {
    (globalThis as any).canvas = { scene };
    hooks.canvasReady();
  }

  const offered = (call: number) => promptMock.mock.calls[call][0].map((entry: any) => entry.uuid);

  it("still offers the rest of a sweep when one region cannot be prepared", async () => {
    const regions = [makeOrphan("good1"), makeOrphan("broken", { brokenShapes: true }), makeOrphan("good2")];
    viewScene(makeScene(regions, "one"));

    await vi.waitFor(() => expect(promptMock).toHaveBeenCalledTimes(1));
    expect(offered(0)).toEqual(["Scene.x.Region.good1", "Scene.x.Region.good2"]);
  });

  it("logs a failed prompt instead of leaving an unhandled rejection, and keeps flushing", async () => {
    promptMock.mockRejectedValueOnce(new Error("dialog broke"));
    viewScene(makeScene([makeOrphan("first")], "two"));
    await vi.waitFor(() => expect(promptMock).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(unhandled).toEqual([]);

    viewScene(makeScene([makeOrphan("second")], "three"));
    await vi.waitFor(() => expect(promptMock).toHaveBeenCalledTimes(2));
    expect(offered(1)).toEqual(["Scene.x.Region.second"]);
    await vi.waitFor(() => expect((foundry.documents as any).modifyBatch).toHaveBeenCalledTimes(1));
    expect(unhandled).toEqual([]);
  });

  it("offers what was queued while a manual scan's prompt was open once that prompt closes", async () => {
    let closeManual!: (uuids: string[]) => void;
    promptMock.mockImplementationOnce(() => new Promise((resolve) => (closeManual = resolve)));
    (globalThis as any).canvas = { scene: makeScene([makeOrphan("scanned")], "four") };
    const scan = RegionExpiryCleanup.scanCurrentScene();
    await vi.waitFor(() => expect(promptMock).toHaveBeenCalledTimes(1));

    // the sweep of the next scene is queued, and its flush skipped, while the scan prompt is open
    viewScene(makeScene([makeOrphan("waiting")], "five"));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(promptMock).toHaveBeenCalledTimes(1);

    closeManual([]);
    await scan;
    await vi.waitFor(() => expect(promptMock).toHaveBeenCalledTimes(2));
    expect(offered(1)).toEqual(["Scene.x.Region.waiting"]);
  });
});
