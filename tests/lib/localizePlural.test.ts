import utils from "../../src/lib/Utils";
import { regionExpiryReasonLabel } from "../../src/effects/enhancers/Regions/RegionExpiryReasons";
import { useEnLocalization } from "../_fixtures/enLocalize";

describe("utils.localizePlural", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = useEnLocalization();
  });
  afterEach(() => restore());

  it("picks the language's plural form for the count", () => {
    expect(utils.localizePlural("ddb-importer.regionExpiry.templates", 1)).toBe("1 template");
    expect(utils.localizePlural("ddb-importer.regionExpiry.templates", 2)).toBe("2 templates");
    expect(utils.localizePlural("ddb-importer.regionExpiry.templates", 0)).toBe("0 templates");
  });

  it("fills other placeholders alongside the count", () => {
    expect(utils.localizePlural("ddb-importer.regionExpiry.notify.scanCurrent.found", 1, { removed: "1" }))
      .toBe("Scanned the current scene, removed 1 of 1 template.");
    expect(utils.localizePlural("ddb-importer.behaviors.macro.choice.limit", 1, { max: "1" }))
      .toBe("Choose up to 1 creature. Select no creatures or Skip to pass.");
  });

  it("falls back to the other form for a category the language file does not carry", () => {
    const rules = game.i18n.pluralRules;
    Object.defineProperty(game.i18n, "pluralRules", { value: { select: () => "few" }, configurable: true });
    try {
      expect(utils.localizePlural("ddb-importer.regionExpiry.templates", 3)).toBe("3 templates");
    } finally {
      Object.defineProperty(game.i18n, "pluralRules", { value: rules, configurable: true, writable: true });
    }
  });
});

describe("region expiry reason labels", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = useEnLocalization();
  });
  afterEach(() => restore());

  it("shows a reason id in the world's language, and an unknown one as it is", () => {
    expect(regionExpiryReasonLabel("scene")).toBe("scene sweep");
    expect(regionExpiryReasonLabel("combat")).toBe("combat ended");
    expect(regionExpiryReasonLabel("somethingElse")).toBe("somethingElse");
  });
});
