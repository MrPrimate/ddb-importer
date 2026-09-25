import { migration } from "../../../src/hooks/ready/migraton";
import { migrateJournalsToDDBSheet } from "../../../src/hooks/ready/migration/migration_5_6_0_journals";
import utils from "../../../src/lib/Utils";
import { resetMockSettings, setMockSettings } from "../../_setup/foundryMocks";

vi.mock("../../../src/hooks/ready/migration/migration_5_6_0_journals", () => ({
  migrateJournalsToDDBSheet: vi.fn(async () => undefined),
}));

describe("species selection ready migration", () => {
  beforeEach(() => {
    resetMockSettings();
    vi.spyOn(foundry.utils, "isNewerVersion").mockImplementation((next, current) =>
      String(next).localeCompare(String(current), undefined, { numeric: true }) > 0);
    vi.spyOn(game.settings, "set").mockImplementation(async (moduleId, key, value) => {
      setMockSettings({ [key]: value }, moduleId);
      return value;
    });
    vi.spyOn(ui.notifications, "info");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    resetMockSettings();
  });

  it.each([[4, 100, 999], ["1743923279:4"]])("resets saved choices once without carrying any forward: %j", async (...selection) => {
    setMockSettings({ "data-version": "6.5.0", "munching-policy-character-species": selection });
    await migration();
    expect(utils.getSetting("munching-policy-character-species")).toEqual([]);
    expect(utils.getSetting("data-version")).toBe("7.5.5");
    expect(migrateJournalsToDDBSheet).not.toHaveBeenCalled();
    expect(ui.notifications.info).toHaveBeenCalledTimes(1);
    setMockSettings({ "munching-policy-character-species": ["1228963568:4"] });
    await migration();
    expect(utils.getSetting("munching-policy-character-species")).toEqual(["1228963568:4"]);
    expect(ui.notifications.info).toHaveBeenCalledTimes(1);
  });

  it("keeps an empty selection empty without a reset notification", async () => {
    setMockSettings({ "data-version": "6.5.0", "munching-policy-character-species": [] });
    await migration();
    expect(utils.getSetting("munching-policy-character-species")).toEqual([]);
    expect(ui.notifications.info).not.toHaveBeenCalled();
  });

  it("does not mutate world settings as a player", async () => {
    vi.stubGlobal("game", { ...game, user: { ...game.user, isGM: false } });
    setMockSettings({ "data-version": "6.5.0", "munching-policy-character-species": [4] });
    await migration();
    expect(game.settings.set).not.toHaveBeenCalled();
    expect(utils.getSetting("munching-policy-character-species")).toEqual([4]);
  });
});
