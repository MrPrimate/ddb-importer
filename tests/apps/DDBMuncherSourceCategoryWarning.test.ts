// @vitest-environment jsdom

import DDBMuncher from "../../src/apps/DDBMuncher";
import DDBSources from "../../src/lib/DDBSources";
import * as spells from "../../src/muncher/spells";
import { resetMockSettings, setMockSettings } from "../_setup/foundryMocks";

function makeMuncher() {
  const app = new DDBMuncher();
  vi.spyOn(app, "_disableButtons").mockImplementation(() => undefined);
  vi.spyOn(app, "_enableButtons").mockImplementation(() => undefined);
  vi.spyOn(app, "_doEnableButtons").mockImplementation(() => undefined);
  vi.spyOn(app, "awaitSettingUpdates").mockResolvedValue();
  vi.spyOn(app, "notifier").mockImplementation(() => undefined);
  vi.spyOn(app, "notifierV2").mockImplementation(() => undefined);
  return app;
}

/** The first n categories the selector would show, so the counted ids are real display ids. */
function displayCategoryIds(n: number): number[] {
  const ids = DDBSources.getDisplaySourceCategories().map((category) => category.id);
  expect(ids.length).toBeGreaterThanOrEqual(n);
  return ids.slice(0, n);
}

describe("muncher source category count warning", () => {
  let parse: ReturnType<typeof vi.spyOn>;
  let wait: ReturnType<typeof vi.spyOn>;
  let openBrowser: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetMockSettings();
    parse = vi.spyOn(spells, "parseSpells").mockResolvedValue([{}] as Awaited<ReturnType<typeof spells.parseSpells>>);
    wait = vi.spyOn(foundry.applications.api.DialogV2, "wait");
    openBrowser = vi.spyOn(DDBMuncher, "openSourceBookBrowser").mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetMockSettings();
  });

  it("munches without asking at the recommended limit", async () => {
    setMockSettings({ "munching-policy-muncher-included-source-categories": displayCategoryIds(3) });
    const app = makeMuncher();
    await DDBMuncher.parseSpells.call(app, null, null);
    expect(wait).not.toHaveBeenCalled();
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("does not count categories the selector hides", async () => {
    const hidden = DDBSources.AlwaysHiddenCategoryIds;
    setMockSettings({ "munching-policy-muncher-included-source-categories": [...displayCategoryIds(3), ...hidden] });
    await DDBMuncher.parseSpells.call(makeMuncher(), null, null);
    expect(wait).not.toHaveBeenCalled();
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("munches when the user continues anyway", async () => {
    setMockSettings({ "munching-policy-muncher-included-source-categories": displayCategoryIds(4) });
    wait.mockResolvedValue("continue");
    const app = makeMuncher();
    await DDBMuncher.parseSpells.call(app, null, null);
    expect(wait).toHaveBeenCalledTimes(1);
    const config = wait.mock.calls[0][0] as { content: string; buttons: { action: string }[] };
    expect(config.content).toContain("4 source categories");
    expect(config.buttons.map((button) => button.action)).toEqual(["adjust", "continue"]);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(openBrowser).not.toHaveBeenCalled();
    expect(app._doEnableButtons).not.toHaveBeenCalled();
  });

  it("asks before a mule munch as well", async () => {
    setMockSettings({ "munching-policy-muncher-included-source-categories": displayCategoryIds(4) });
    wait.mockResolvedValue(null);
    const app = makeMuncher();
    app.characterId = "123";
    const parseWithMule = vi.spyOn(app, "_parseWithMule");
    await DDBMuncher.parseFeats.call(app, null, null);
    expect(wait).toHaveBeenCalledTimes(1);
    expect(parseWithMule).not.toHaveBeenCalled();
  });

  it("munches anyway when the count cannot be read", async () => {
    vi.spyOn(DDBSources, "getIncludedCategoryIds").mockImplementation(() => {
      throw new Error("broken setting");
    });
    const app = makeMuncher();
    await DDBMuncher.parseSpells.call(app, null, null);
    expect(wait).not.toHaveBeenCalled();
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("opens the source selector instead of munching when the user adjusts", async () => {
    setMockSettings({ "munching-policy-muncher-included-source-categories": displayCategoryIds(4) });
    wait.mockResolvedValue("adjust");
    const app = makeMuncher();
    await DDBMuncher.parseSpells.call(app, null, null);
    expect(openBrowser).toHaveBeenCalledTimes(1);
    expect(parse).not.toHaveBeenCalled();
    // declining happens before the details overlay opens, so only the buttons come back
    expect(app._disableButtons).not.toHaveBeenCalled();
    expect(app._doEnableButtons).toHaveBeenCalledTimes(1);
  });

  it("does not munch when the dialog is closed", async () => {
    setMockSettings({ "munching-policy-muncher-included-source-categories": displayCategoryIds(4) });
    wait.mockResolvedValue(null);
    const app = makeMuncher();
    await DDBMuncher.parseSpells.call(app, null, null);
    expect(openBrowser).not.toHaveBeenCalled();
    expect(parse).not.toHaveBeenCalled();
    expect(app._disableButtons).not.toHaveBeenCalled();
    expect(app._doEnableButtons).toHaveBeenCalledTimes(1);
  });
});
