// @vitest-environment jsdom

import DDBMuncher from "../../src/apps/DDBMuncher";
import DDBMuleHandler from "../../src/muncher/DDBMuleHandler";
import MuncherSettings from "../../src/lib/MuncherSettings";
import DDBSources from "../../src/lib/DDBSources";
import PatreonHelper from "../../src/lib/PatreonHelper";
import CompendiumHelper from "../../src/lib/CompendiumHelper";
import { speciesKey } from "../../src/lib/SpeciesIdentity";
import { resetMockSettings, setMockSettings } from "../_setup/foundryMocks";

const pairs = [
  [4, "Aarakocra", "Mountain Dwarf"],
  [28, "Kenku", "Variant Feral Tiefling"],
  [25, "Firbolg", "Drow Half-Elf"],
  [30, "Tabaxi", "Eladrin (Variant)"],
] as const;
const catalog: IDDBMuleSpeciesDefinition[] = pairs.flatMap(([id, name, subrace]) => [
  { entityRaceId: id, entityRaceTypeId: 1743923279, baseRaceId: id, fullName: name, sources: [{ sourceId: 15, sourceType: 1 }] },
  { entityRaceId: id, entityRaceTypeId: 1228963568, baseRaceId: 13, fullName: subrace, sources: [{ sourceId: 2, sourceType: 1 }] },
]) as IDDBMuleSpeciesDefinition[];
catalog.push(
  { entityRaceId: 100, entityRaceTypeId: 1743923279, fullName: "Modern species", sources: [{ sourceId: 145, sourceType: 1 }] } as IDDBMuleSpeciesDefinition,
  { entityRaceId: 101, entityRaceTypeId: 1743923279, fullName: "Homebrew species", isHomebrew: true, sources: [] } as unknown as IDDBMuleSpeciesDefinition,
);

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

describe("mule species selection", () => {
  beforeEach(() => {
    resetMockSettings();
    setMockSettings({
      "munching-policy-character-species": [], "munching-policy-character-classes": [],
      "munching-policy-character-subclasses": {}, "munching-policy-character-class-rules-version": "2014",
      "munching-policy-character-dont-grab-existing": false, "munching-policy-character-fetch-homebrew": false,
      "munching-policy-character-only-homebrew": false, "munching-policy-character-url": "",
    });
    vi.spyOn(PatreonHelper, "getPatreonTier").mockReturnValue("GOD" as ReturnType<typeof PatreonHelper.getPatreonTier>);
    vi.spyOn(PatreonHelper, "calculateAccessMatrix").mockReturnValue({ experimentalMid: true } as ReturnType<typeof PatreonHelper.calculateAccessMatrix>);
    vi.spyOn(DDBSources, "getChosenSourceIdSet").mockReturnValue(new Set([2, 15, 145]));
    vi.spyOn(DDBSources, "getChosenCategoriesAndBooks").mockReturnValue([{ categoryId: 26, sourceIds: [2, 15, 145] }]);
    vi.spyOn(DDBSources, "is2014Source").mockImplementation((s) => s.sourceId !== 145);
    vi.spyOn(DDBMuleHandler, "getList").mockImplementation(async (type) => type === "species" ? catalog : []);
  });
  afterEach(() => {
    vi.restoreAllMocks(); resetMockSettings(); 
  });

  it.each(pairs)("preserves both selections for %s: %s / %s across reopening", async (id, name, subrace) => {
    for (const keys of [[`1743923279:${id}`], [`1228963568:${id}`], [`1743923279:${id}`, `1228963568:${id}`]]) {
      setMockSettings({ "munching-policy-character-species": keys });
      for (let render = 0; render < 2; render++) {
        const context = await MuncherSettings.getCharacterMuncherSettings();
        const options = context.selectedSpecies.filter((s) => s.selected);
        expect(options.map((s) => s.id).sort()).toEqual([...keys].sort());
        expect(options.every((s) => s.label.startsWith(s.id.startsWith("174") ? name : subrace))).toBe(true);
        expect(context.speciesMunchEnabled).toBe(true);
        expect(new Set(context.selectedSpecies.map((s) => s.id)).size).toBe(context.selectedSpecies.length);
      }
    }
  });

  it("keeps unavailable typed selections removable without broadening an empty match", async () => {
    setMockSettings({ "munching-policy-character-species": ["1743923279:999"], "munching-policy-character-fetch-homebrew": true });
    const context = await MuncherSettings.getCharacterMuncherSettings();
    expect(context.selectedSpecies.filter((s) => s.selected)).toEqual([
      { id: "1743923279:999", label: "Unavailable species (1743923279:999)", selected: "selected" },
    ]);
    expect(context.speciesMunchEnabled).toBe(true);
    const process = vi.spyOn(DDBMuleHandler.prototype, "process").mockResolvedValue();
    const info = vi.spyOn(ui.notifications, "info");
    const app = makeMuncher();
    vi.spyOn(app, "_disableButtons").mockImplementation(() => undefined);
    vi.spyOn(app, "_enableButtons").mockImplementation(() => undefined);
    vi.spyOn(app, "awaitSettingUpdates").mockResolvedValue();
    await DDBMuncher.parseSpecies.call(app, null, null);
    const notice = "No selected species are available in the catalogue. Please reselect species.";
    expect(info).toHaveBeenCalledWith(notice);
    expect(app.notifier).toHaveBeenCalledWith(notice, { nameField: true });
    expect(app.notifier).not.toHaveBeenCalledWith("Finished importing species!", { nameField: true });
    expect(process).not.toHaveBeenCalled();
    expect(app._enableButtons).toHaveBeenCalled();
  });

  it("skips unavailable selections while still importing available selections", async () => {
    setMockSettings({ "munching-policy-character-species": ["1743923279:999", "1743923279:4"] });
    const requests: (string[] | undefined)[] = [];
    vi.spyOn(DDBMuleHandler.prototype, "process").mockImplementation(async function (this: DDBMuleHandler) {
      requests.push(this.speciesKeys);
    });
    await makeMuncher()._parseWithMule("species");
    expect(requests).toEqual([["1743923279:4"]]);
  });

  it("rejects malformed saved selections if the ready migration has not run", async () => {
    setMockSettings({ "munching-policy-character-species": [4] });
    const process = vi.spyOn(DDBMuleHandler.prototype, "process").mockResolvedValue();
    await expect(makeMuncher()._parseWithMule("species")).rejects.toThrow(/Invalid species selection/);
    expect(process).not.toHaveBeenCalled();
  });

  it("narrows requests by full identity and the selected species' source", async () => {
    setMockSettings({ "munching-policy-character-species": ["1743923279:4", "1228963568:28"] });
    const requests: { keys?: string[]; sources: number[] }[] = [];
    vi.spyOn(DDBMuleHandler.prototype, "process").mockImplementation(async function (this: DDBMuleHandler) {
      requests.push({ keys: this.speciesKeys, sources: this.allowedSourceIds });
    });
    await makeMuncher()._parseWithMule("species");
    expect(requests).toEqual([
      { keys: ["1228963568:28"], sources: [2] }, { keys: ["1743923279:4"], sources: [15] },
    ]);
  });

  it("keeps intentional empty selection and modern rules behavior", async () => {
    const requests: (string[] | undefined)[] = [];
    vi.spyOn(DDBMuleHandler.prototype, "process").mockImplementation(async function (this: DDBMuleHandler) {
      requests.push(this.speciesKeys); 
    });
    await makeMuncher()._parseWithMule("species");
    expect(requests).toEqual([[], [], []]);
    setMockSettings({ "munching-policy-character-class-rules-version": "2024" });
    expect((await MuncherSettings.getCharacterMuncherSettings()).selectedSpecies.map((s) => s.id)).toEqual(["1743923279:100"]);
  });

  it("limits a homebrew pass to selected homebrew identities", async () => {
    setMockSettings({ "munching-policy-character-species": ["1743923279:101"], "munching-policy-character-fetch-homebrew": true });
    const requests: { keys?: string[]; homebrew: boolean }[] = [];
    vi.spyOn(DDBMuleHandler.prototype, "process").mockImplementation(async function (this: DDBMuleHandler) {
      requests.push({ keys: this.speciesKeys, homebrew: this.allowedHomebrew });
    });
    expect((await MuncherSettings.getCharacterMuncherSettings()).selectedSpecies.some((s) => s.id === "1743923279:101")).toBe(true);
    await makeMuncher()._parseWithMule("species");
    expect(requests).toEqual([{ keys: ["1743923279:101"], homebrew: true }]);
  });

  it("does not let an existing subrace hide or exclude its colliding species", async () => {
    setMockSettings({ "munching-policy-character-dont-grab-existing": true, "munching-policy-character-species": ["1743923279:4", "1228963568:4"] });
    vi.spyOn(DDBMuleHandler, "getExistingSubclassIds").mockResolvedValue(new Set());
    vi.spyOn(CompendiumHelper, "loadCompendiumIndex").mockResolvedValue({ contents: [
      { flags: { ddbimporter: { entityRaceId: 4, baseRaceId: 13, fullRaceName: "Mountain Dwarf", is2014: true } } },
    ] } as unknown as Awaited<ReturnType<typeof CompendiumHelper.loadCompendiumIndex>>);
    const options = (await MuncherSettings.getCharacterMuncherSettings()).selectedSpecies;
    expect(options.some((s) => s.id === speciesKey(catalog[0]))).toBe(true);
    expect(options.some((s) => s.id === speciesKey(catalog[1]))).toBe(false);
    const requests: (string[] | undefined)[] = [];
    vi.spyOn(DDBMuleHandler.prototype, "process").mockImplementation(async function (this: DDBMuleHandler) {
      requests.push(this.speciesKeys); 
    });
    await makeMuncher()._parseWithMule("species");
    expect(requests).toEqual([["1743923279:4"]]);
  });

  it("does not broaden the import when the catalogue fails", async () => {
    setMockSettings({ "munching-policy-character-species": ["1743923279:4"] });
    vi.mocked(DDBMuleHandler.getList).mockRejectedValue(new Error("catalog unavailable"));
    const process = vi.spyOn(DDBMuleHandler.prototype, "process").mockResolvedValue();
    await expect(makeMuncher()._parseWithMule("species")).rejects.toThrow("catalog unavailable");
    expect(process).not.toHaveBeenCalled();
  });
});
