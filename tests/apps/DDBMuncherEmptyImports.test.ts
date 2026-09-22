// Adapted from main: this branch has no "don't grab existing" or species selection paths, and frames report through notifierV2.
// @vitest-environment jsdom

import DDBMuncher from "../../src/apps/DDBMuncher";
import DDBMuleHandler from "../../src/muncher/DDBMuleHandler";
import DDBItemsImporter from "../../src/muncher/DDBItemsImporter";
import DDBFrameImporter from "../../src/muncher/DDBFrameImporter";
import DDBMonsterFactory from "../../src/parser/DDBMonsterFactory";
import DDBVehicleFactory from "../../src/parser/DDBVehicleFactory";
import DDBSources from "../../src/lib/DDBSources";
import { DDBReferenceLinker } from "../../src/parser/lib/_module";
import * as spells from "../../src/muncher/spells";
import { resetMockSettings, setMockSettings } from "../_setup/foundryMocks";

const actions = [
  ["spells", "parseSpells"], ["items", "parseItems"], ["monsters", "parseMonsters"],
  ["vehicles", "parseVehicles"], ["frames", "parseFrames"], ["feats", "parseFeats"],
  ["backgrounds", "parseBackgrounds"], ["species", "parseSpecies"], ["classes", "parseClasses"],
] as const;
const source = { sourceId: 2, sourceType: 1 };
const klass = { id: 9, name: "Fighter", sources: [source] } as IDDBMuleClassDefinition;
const subclass = { id: 10, name: "Champion", sources: [source], isHomebrew: false } as IDDBMuleSubclassDefinition;
const feat = { id: 10, name: "Example", sources: [source] } as IDDBMuleFeatDefinition;
const species = { entityRaceId: 4, entityRaceTypeId: 1743923279, fullName: "Aarakocra", sources: [source] } as IDDBMuleSpeciesDefinition;

function makeMuncher() {
  const app = new DDBMuncher();
  app.characterId = "123";
  vi.spyOn(app, "_disableButtons").mockImplementation(() => undefined);
  vi.spyOn(app, "_enableButtons").mockImplementation(() => undefined);
  vi.spyOn(app, "awaitSettingUpdates").mockResolvedValue();
  vi.spyOn(app, "notifier").mockImplementation(() => undefined);
  vi.spyOn(app, "notifierV2").mockImplementation(() => undefined);
  vi.spyOn(app, "autoRotateMessage").mockImplementation(() => {
    const timer = setTimeout(() => undefined, 0);
    clearTimeout(timer);
    return timer;
  });
  return app;
}

function mockResults(count: number) {
  const documents = new Array(count).fill({}) as Awaited<ReturnType<typeof spells.parseSpells>>;
  vi.spyOn(spells, "parseSpells").mockResolvedValue(documents);
  vi.spyOn(DDBItemsImporter, "fetchAndImportItems").mockResolvedValue(documents);
  vi.spyOn(DDBMonsterFactory.prototype, "processIntoCompendium").mockResolvedValue(count);
  vi.spyOn(DDBVehicleFactory.prototype, "processIntoCompendium").mockResolvedValue(count);
  vi.spyOn(DDBFrameImporter, "parseFrames").mockResolvedValue(count);
  vi.spyOn(DDBMuleHandler.prototype, "process").mockImplementation(async function (this: DDBMuleHandler) {
    if (count === 0) return;
    if (this.type === "class") {
      this.pendingDocs.classes.set("test", { data: {}, name: "Fighter", className: "Fighter", versionStub: "2014" });
    } else {
      const type = this.type === "feat" ? "feats" : this.type === "background" ? "backgrounds" : "species";
      this.pendingDocs[type].set("test", { name: "Imported document" });
    }
  });
}

describe("muncher empty import notices", () => {
  beforeEach(() => {
    resetMockSettings();
    setMockSettings({
      "munching-policy-character-species": [], "munching-policy-character-classes": [9],
      "munching-policy-character-subclasses": {}, "munching-policy-character-class-rules-version": "2014",
      "munching-policy-character-dont-grab-existing": false, "munching-policy-character-fetch-homebrew": false,
      "munching-policy-character-only-homebrew": false,
    });
    vi.spyOn(DDBSources, "getChosenCategoriesAndBooks").mockReturnValue([{ categoryId: 26, sourceIds: [2] }]);
    vi.spyOn(DDBSources, "is2014Source").mockReturnValue(true);
    vi.spyOn(DDBMuleHandler, "getList").mockImplementation(async (type) =>
      type === "class" ? [klass] : type === "species" ? [species] : [feat]);
    vi.spyOn(DDBMuleHandler, "getSlimCharacters").mockResolvedValue([]);
    vi.spyOn(DDBMuleHandler, "getSubclassesCached").mockResolvedValue([subclass]);
    vi.spyOn(ui.notifications, "info");
    vi.spyOn(ui.notifications, "error");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetMockSettings();
  });

  it.each(actions)("reports an empty %s import without a success message", async (type, action) => {
    mockResults(0);
    const app = makeMuncher();
    await DDBMuncher[action].call(app, null, null);
    const notice = `No ${type} were available to import. Check your selections and import settings.`;
    expect(ui.notifications.info).toHaveBeenCalledWith(notice);
    expect(ui.notifications.error).not.toHaveBeenCalled();
    if (type === "frames") {
      expect(app.notifierV2).toHaveBeenCalledWith(expect.objectContaining({ section: "name", message: notice }));
      expect(vi.mocked(app.notifierV2).mock.calls.some(([data]) => String(data?.message ?? "").startsWith("Finished importing"))).toBe(false);
    } else {
      expect(app.notifier).toHaveBeenCalledWith(notice, { nameField: true });
    }
    expect(vi.mocked(app.notifier).mock.calls.some(([message]) => message.startsWith("Finished importing"))).toBe(false);
    expect(app._enableButtons).toHaveBeenCalled();
  });

  it.each(actions)("preserves successful %s completion", async (type, action) => {
    mockResults(1);
    const app = makeMuncher();
    await DDBMuncher[action].call(app, null, null);
    expect(ui.notifications.info).not.toHaveBeenCalled();
    expect(ui.notifications.error).not.toHaveBeenCalled();
    const counted = ["monsters", "vehicles", "frames"].includes(type) ? "1 " : "";
    if (type === "frames") {
      expect(app.notifierV2).toHaveBeenCalledWith(expect.objectContaining({ section: "name", message: "Finished importing 1 frames!" }));
    } else {
      expect(app.notifier).toHaveBeenCalledWith(`Finished importing ${counted}${type}!`, { nameField: true });
    }
  });

  it.each(["parseFeats", "parseBackgrounds", "parseSpecies", "parseClasses"] as const)("reports an empty buffered Mule response through %s", async (action) => {
    const app = makeMuncher();
    vi.spyOn(DDBReferenceLinker, "importCacheLoad").mockResolvedValue();
    vi.spyOn(DDBMuleHandler.prototype, "notifier").mockImplementation(() => undefined);
    const fetch = vi.spyOn(DDBMuleHandler.prototype, "_fetchMuleData").mockImplementation(async function (this: DDBMuleHandler) {
      await this._replayBufferedSourceThroughStreamProcessors();
    });
    await DDBMuncher[action].call(app, null, null);
    expect(vi.mocked(app.notifier).mock.calls).not.toContainEqual([expect.any(String), { message: true }]);
    expect(ui.notifications.error).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(ui.notifications.info).toHaveBeenCalledWith(expect.stringContaining("were available to import"));
    expect(vi.mocked(app.notifier).mock.calls.some(([message]) => message.startsWith("Finished importing"))).toBe(false);
  });

  it.each([
    { ids: [], notice: "Select at least one class to munch." },
    { ids: [999], notice: "No classes were available to import. Check your selections and import settings." },
  ])("reports unavailable class selections $ids before contacting the mule", async ({ ids, notice }) => {
    mockResults(1);
    setMockSettings({ "munching-policy-character-classes": ids });
    const app = makeMuncher();
    await DDBMuncher.parseClasses.call(app, null, null);
    expect(DDBMuleHandler.prototype.process).not.toHaveBeenCalled();
    expect(DDBMuleHandler.getSlimCharacters).not.toHaveBeenCalled();
    expect(ui.notifications.info).toHaveBeenCalledTimes(1);
    expect(ui.notifications.info).toHaveBeenCalledWith(notice);
    expect(app.notifier).toHaveBeenCalledWith(notice, { nameField: true });
    expect(app.notifier).not.toHaveBeenCalledWith("Finished importing classes!", { nameField: true });
  });

  it("reports no matching source books without sending an unfiltered request", async () => {
    mockResults(1);
    vi.mocked(DDBSources.getChosenCategoriesAndBooks).mockReturnValue([]);
    await DDBMuncher.parseFeats.call(makeMuncher(), null, null);
    expect(DDBMuleHandler.prototype.process).not.toHaveBeenCalled();
    expect(ui.notifications.info).toHaveBeenCalledWith(expect.stringContaining("No feats"));
  });

  it.each([0, 1])("handles homebrew-only class runs with %s eligible subclasses", async (count) => {
    mockResults(1);
    setMockSettings({ "munching-policy-character-fetch-homebrew": true, "munching-policy-character-only-homebrew": true });
    vi.mocked(DDBMuleHandler.getSubclassesCached).mockResolvedValue(count ? [{ ...subclass, isHomebrew: true }] : []);
    await DDBMuncher.parseClasses.call(makeMuncher(), null, null);
    expect(DDBMuleHandler.prototype.process).toHaveBeenCalledTimes(count);
    expect(ui.notifications.info).toHaveBeenCalledTimes(count === 0 ? 1 : 0);
  });

  it("reports an item import with no update results as empty", async () => {
    mockResults(0);
    vi.mocked(DDBItemsImporter.fetchAndImportItems).mockResolvedValue(null);
    await DDBMuncher.parseItems.call(makeMuncher(), null, null);
    expect(ui.notifications.info).toHaveBeenCalledWith(expect.stringContaining("No items"));
    expect(ui.notifications.error).not.toHaveBeenCalled();
  });

  it("reports download failures as errors instead of empty imports", async () => {
    mockResults(0);
    vi.mocked(spells.parseSpells).mockRejectedValue(new Error("download failed"));
    const app = makeMuncher();
    await DDBMuncher.parseSpells.call(app, null, null);
    expect(ui.notifications.error).toHaveBeenCalledWith("Spell import failed: download failed");
    expect(ui.notifications.info).not.toHaveBeenCalled();
    expect(app.notifier).not.toHaveBeenCalledWith("Finished importing spells!", { nameField: true });
  });

  it.each([
    ["parseFeats", false], ["parseBackgrounds", false], ["parseSpecies", false], ["parseClasses", false],
    ["parseFeats", true], ["parseBackgrounds", true], ["parseSpecies", true], ["parseClasses", true],
  ] as const)("retains one %s error with details (homebrew=%s)", async (action, homebrew) => {
    mockResults(0);
    setMockSettings({
      "munching-policy-character-fetch-homebrew": homebrew, "munching-policy-character-only-homebrew": homebrew,
    });
    vi.mocked(DDBMuleHandler.getList).mockImplementation(async (type) =>
      type === "class" ? [klass] : [{ ...feat, isHomebrew: homebrew }]);
    vi.mocked(DDBMuleHandler.getSubclassesCached).mockResolvedValue([{ ...subclass, isHomebrew: homebrew }]);
    const error = "Some entries could not be imported. See the console for details.";
    vi.mocked(DDBMuleHandler.prototype.process).mockRejectedValue(new Error(error));
    const app = makeMuncher();
    await DDBMuncher[action].call(app, null, null);
    expect(ui.notifications.info).not.toHaveBeenCalled();
    expect(DDBMuleHandler.prototype.process).toHaveBeenCalledTimes(1);
    expect(app.notifier).toHaveBeenCalledWith("Errors during munching: 1", { nameField: true });
    expect(app.notifier).toHaveBeenCalledWith(expect.stringContaining(`: ${error}`), { message: true });
    if (action === "parseClasses") expect(app.processErrors).toHaveLength(1);
    expect(vi.mocked(app.notifier).mock.calls.some(([message]) => message.startsWith("Finished importing"))).toBe(false);
    expect(app._enableButtons).toHaveBeenCalled();
  });
});
