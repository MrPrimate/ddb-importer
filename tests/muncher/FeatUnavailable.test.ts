// @vitest-environment jsdom

import DDBMuncher from "../../src/apps/DDBMuncher";
import DDBMuleHandler from "../../src/muncher/DDBMuleHandler";
import DDBSources from "../../src/lib/DDBSources";
import { resetMockSettings, setMockSettings } from "../_setup/foundryMocks";

/**
 * The proxy reports requested feat/background ids that the account's DDB catalog does not list
 * (no purchase, no campaign sharing). Those must reach the user by name rather than vanish, and
 * repeatable feats must count on the progress bar on top of the numbered chunks.
 */

const featCatalog = [
  { id: 1, name: "Grappler", sources: [{ sourceId: 145, sourceType: 1 }], isHomebrew: false },
  { id: 2, name: "Durable", sources: [{ sourceId: 145, sourceType: 1 }], isHomebrew: false },
  { id: 3, name: "Skilled", sources: [{ sourceId: 145, sourceType: 1 }], isHomebrew: false },
  { id: 4, name: "Skilled", sources: [{ sourceId: 145, sourceType: 1 }], isHomebrew: false },
] as IDDBMuleFeatDefinition[];

function makeMuncher() {
  const app = new DDBMuncher();
  app.characterId = "123";
  vi.spyOn(app, "autoRotateMessage").mockImplementation(() => {
    const timer = setTimeout(() => undefined, 0);
    clearTimeout(timer);
    return timer;
  });
  vi.spyOn(app, "notifier").mockImplementation(() => undefined);
  vi.spyOn(app, "notifierV2").mockImplementation(() => undefined);
  return app;
}

describe("mule feats unavailable to the account", () => {
  beforeEach(() => {
    resetMockSettings();
    setMockSettings({
      "munching-policy-character-class-rules-version": "2024",
      "munching-policy-character-dont-grab-existing": false, "munching-policy-character-fetch-homebrew": false,
      "munching-policy-character-only-homebrew": false, "munching-policy-character-url": "",
    });
    vi.spyOn(DDBSources, "getChosenCategoriesAndBooks").mockReturnValue([{ categoryId: 26, sourceIds: [145] }]);
    vi.spyOn(DDBSources, "is2014Source").mockImplementation((s) => s.sourceId !== 145);
    vi.spyOn(DDBMuleHandler, "getList").mockImplementation(async (type) => type === "feat" ? featCatalog : []);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    resetMockSettings();
  });

  it("names each unavailable feat once and still reports the import as finished", async () => {
    vi.spyOn(DDBMuleHandler.prototype, "process").mockImplementation(async function (this: DDBMuleHandler) {
      this._ingestIterationItem({ kind: "unavailable", payload: { element: "feat", ids: [2, 3, 4] } });
    });
    vi.spyOn(DDBMuleHandler.prototype, "hasImportableDocuments", "get").mockReturnValue(true);

    const notice = await makeMuncher()._parseWithMule("feat");

    expect(notice).toBe("Import finished. 2 feats were not imported because D&D Beyond does not make them "
      + "available to this account (your own purchases and content shared through the character's campaign): "
      + "Durable, Skilled.");
  });

  it("keeps the plain finished message when every feat was available", async () => {
    vi.spyOn(DDBMuleHandler.prototype, "process").mockResolvedValue(undefined);
    vi.spyOn(DDBMuleHandler.prototype, "hasImportableDocuments", "get").mockReturnValue(true);

    expect(await makeMuncher()._parseWithMule("feat")).toBeUndefined();
  });

  it("adds the unavailable feats to the empty-import message", async () => {
    vi.spyOn(DDBMuleHandler.prototype, "process").mockImplementation(async function (this: DDBMuleHandler) {
      this._ingestIterationItem({ kind: "unavailable", payload: { element: "feat", ids: [2] } });
    });
    vi.spyOn(DDBMuleHandler.prototype, "hasImportableDocuments", "get").mockReturnValue(false);

    const notice = await makeMuncher()._parseWithMule("feat");

    expect(notice).toMatch(/^No feats were available to import\..* 1 feat was not imported .*: Durable\.$/);
  });
});

describe("mule campaign mismatch warnings", () => {
  const warning = "The muncher lists content using campaign 1, but mule character 123 is in campaign 2.";

  beforeEach(() => {
    resetMockSettings();
    setMockSettings({
      "munching-policy-character-class-rules-version": "2024",
      "munching-policy-character-dont-grab-existing": false, "munching-policy-character-fetch-homebrew": false,
      "munching-policy-character-only-homebrew": false, "munching-policy-character-url": "",
    });
    vi.spyOn(DDBSources, "getChosenCategoriesAndBooks").mockReturnValue([{ categoryId: 26, sourceIds: [145, 146] }]);
    vi.spyOn(DDBSources, "is2014Source").mockReturnValue(false);
    vi.spyOn(DDBMuleHandler, "getList").mockResolvedValue([
      ...featCatalog,
      { id: 5, name: "Tough", sources: [{ sourceId: 146, sourceType: 1 }], isHomebrew: false },
    ] as IDDBMuleFeatDefinition[]);
    vi.spyOn(DDBMuleHandler.prototype, "hasImportableDocuments", "get").mockReturnValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    resetMockSettings();
  });

  it("shows a warning repeated by every source pass once and adds it to the result", async () => {
    vi.spyOn(DDBMuleHandler.prototype, "process").mockImplementation(async function (this: DDBMuleHandler) {
      this._ingestIterationItem({ kind: "warning", payload: { code: "campaignMismatch", message: warning } });
    });
    const warn = vi.spyOn(ui.notifications, "warn");

    const notice = await makeMuncher()._parseWithMule("feat");

    expect(DDBMuleHandler.prototype.process).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(warning);
    expect(notice).toBe(`Import finished. ${warning}`);
  });

  it("keeps the warning from a source pass that failed", async () => {
    vi.spyOn(DDBMuleHandler.prototype, "process").mockImplementation(async function (this: DDBMuleHandler) {
      this._ingestIterationItem({ kind: "warning", payload: { code: "campaignMismatch", message: warning } });
      throw new Error("mule failed");
    });
    const warn = vi.spyOn(ui.notifications, "warn");

    // a failed pass reports its errors instead of a notice
    expect(await makeMuncher()._parseWithMule("feat")).toBeNull();
    expect(warn).toHaveBeenCalledWith(warning);
  });
});

describe("mule repeatable feat progress", () => {
  beforeEach(() => {
    vi.spyOn(DDBSources, "getChosenSourceIdSet").mockReturnValue(new Set([145]));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("counts repeatable feats on top of the numbered chunk total", async () => {
    const handler = new DDBMuleHandler({ characterId: "123", type: "feat", sources: [145] });
    const progress: { message?: string; current?: number; total?: number }[] = [];
    vi.spyOn(handler, "notifier").mockImplementation(({ message, progress: p, progressBar }) => {
      if (progressBar === "secondary") progress.push({ message, current: p?.current, total: p?.total });
    });
    vi.spyOn(handler, "_processStreamFeatOption").mockResolvedValue(undefined);

    handler._scheduleStreamProcessing({ kind: "featOptions", payload: {}, index: 1, total: 1 });
    handler._scheduleStreamProcessing({
      kind: "featOptions", payload: {}, repeatable: true, name: "Skilled", repeatableIndex: 1, repeatableTotal: 2,
    });
    // an older proxy sends repeatable events without a name or counters
    handler._scheduleStreamProcessing({ kind: "featOptions", payload: {}, repeatable: true });
    await handler._drainStreamProcessing();

    expect(progress).toEqual([
      { message: "Imported feat chunk 1", current: 1, total: 3 },
      { message: "Imported repeatable feat Skilled", current: 2, total: 3 },
      { message: "Imported repeatable feat 2", current: 3, total: 3 },
    ]);
  });
});
