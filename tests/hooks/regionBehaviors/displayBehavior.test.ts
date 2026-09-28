// @vitest-environment jsdom
vi.mock("../../../src/hooks/regionBehaviors/baseActivityBehavior", () => ({
  default: class MockBaseActivityBehavior {
    constructor(data: Record<string, unknown> = {}) {
      Object.assign(this, data);
    }
  },
}));

import RegionDisplayProfiles from "../../../src/lib/RegionDisplayProfiles";
import DDBDisplayActivityBehavior from "../../../src/hooks/regionBehaviors/DDBDisplayActivityBehavior";
import DDBMacroActivityBehavior from "../../../src/hooks/regionBehaviors/DDBMacroActivityBehavior";
import { BEHAVIOR_CONFIGURE_CLASS } from "../../../src/hooks/canvas/regionDisplaySummary";
import { useEnLocalization } from "../../_fixtures/enLocalize";
import { resetMockSettings, setMockSettings } from "../../_setup/foundryMocks";

let restoreLocalization: () => void;
beforeEach(() => {
  restoreLocalization = useEnLocalization();
});
afterEach(() => restoreLocalization());

describe("DDBDisplayActivityBehavior", () => {
  it("never creates a region behavior", () => {
    const behavior = new DDBDisplayActivityBehavior({ profile: "aura" } as any);
    expect(behavior.createBehaviorData({ target: {} })).toBe(false);
  });

  it("renders the whole config as one summary row with hidden inputs, hiding every other field", () => {
    const behavior = new DDBDisplayActivityBehavior({ profile: "status", pattern: "hollowDots", opacity: 0.4, dashed: "", color: null } as any);
    const profile: Record<string, any> = {};
    expect(behavior.customizeField({ name: "profile" }, profile)).toBeUndefined();
    const input = profile.input({}, { name: "behaviors.0.config.profile", value: "status" }) as HTMLElement;
    expect(input.querySelector(".ddbi-display-region-summary-text")!.textContent).toBe("Status Effect, Hollow Dots, Fill Opacity 0.4");
    expect(input.querySelector(`button.${BEHAVIOR_CONFIGURE_CLASS}`)).not.toBeNull();
    expect(input.querySelector(".ddbi-display-region-swatch")).not.toBeNull();
    // the sheet rebuilds the behaviors array from its form, so every config key must be in it
    const hidden = [...input.querySelectorAll<HTMLInputElement>("input[type=hidden]")];
    const byName = Object.fromEntries(hidden.map((h) => [h.name, { value: h.getAttribute("value"), dtype: h.dataset.dtype }]));
    expect(byName["behaviors.0.config.profile"]).toEqual({ value: "status", dtype: undefined });
    expect(byName["behaviors.0.config.pattern"]).toEqual({ value: "hollowDots", dtype: undefined });
    expect(byName["behaviors.0.config.opacity"]).toEqual({ value: "0.4", dtype: "Number" });
    expect(byName["behaviors.0.config.spacing"]).toEqual({ value: "", dtype: "Number" });
    expect(byName["behaviors.0.config.dashed"]).toEqual({ value: "", dtype: undefined });
    expect(byName["behaviors.0.config.color"]).toEqual({ value: "", dtype: undefined });
    expect(byName["behaviors.0.config.crossRotation"]).toEqual({ value: "", dtype: "Number" });
    expect(byName["behaviors.0.config.offset"]).toEqual({ value: "", dtype: "Number" });
    for (const key of ["crossLength", "waveAmplitude", "waveLength"]) {
      expect(byName[`behaviors.0.config.${key}`]).toEqual({ value: "", dtype: "Number" });
    }
    for (const key of ["textureSrc", "textureColorMode", "textureAnchor", "textureFit"]) {
      expect(byName[`behaviors.0.config.${key}`]).toEqual({ value: "", dtype: undefined });
    }
    expect(hidden).toHaveLength(23);
    // the sheet serialises the element, so nothing may live only on properties or listeners
    expect(input.outerHTML).toContain("name=\"behaviors.0.config.opacity\" value=\"0.4\" data-dtype=\"Number\"");
    for (const name of ["pattern", "opacity", "dashed", "border", "color"]) {
      expect(behavior.customizeField({ name }, {})).toBe(false);
    }
  });

  it("keeps the trigger's stored profile in a hidden input while profiles are switched off", () => {
    setMockSettings({ "enable-region-display-profiles": false });
    try {
      const behavior = new DDBMacroActivityBehavior({} as any);
      const data: Record<string, any> = {};
      // rendering nothing would let the sheet's next save write the profile blank
      expect(behavior.customizeField({ name: "displayProfile" }, data)).toBeUndefined();
      expect(data.classes).toBe("hidden");
      const input = data.input({}, { name: "behaviors.1.config.displayProfile", value: "status-prone" }) as HTMLInputElement;
      expect(input.outerHTML).toBe("<input type=\"hidden\" name=\"behaviors.1.config.displayProfile\" value=\"status-prone\">");
    } finally {
      resetMockSettings();
    }
  });

  it("gives the trigger behavior the same picker for its profile field", () => {
    // the picker asks whether the user may edit the profiles before offering the editor gear
    const user = game.user as unknown as { can?: (permission: string) => boolean };
    user.can = () => true;
    const behavior = new DDBMacroActivityBehavior({} as any);
    const data: Record<string, any> = {};
    behavior.customizeField({ name: "displayProfile" }, data);
    const input = data.input({}, { name: "behaviors.1.config.displayProfile", value: "" }) as HTMLElement;
    expect([...input.querySelector("select")!.options].map((option) => option.value)).toEqual(["", ...RegionDisplayProfiles.builtins.map((profile) => profile.id)]);
    expect(input.querySelector("button")).not.toBeNull();
    delete user.can;
  });
});
