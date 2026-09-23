// @vitest-environment jsdom
vi.mock("../../../src/hooks/regionBehaviors/baseActivityBehavior", () => ({
  default: class MockBaseActivityBehavior {
    constructor(data: Record<string, unknown> = {}) {
      Object.assign(this, data);
    }
  },
}));

import DDBDisplayActivityBehavior from "../../../src/hooks/regionBehaviors/DDBDisplayActivityBehavior";
import DDBMacroActivityBehavior from "../../../src/hooks/regionBehaviors/DDBMacroActivityBehavior";
import { BEHAVIOR_CONFIGURE_CLASS } from "../../../src/hooks/canvas/regionDisplaySummary";
import { useEnLocalization } from "../../_fixtures/enLocalize";

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
    expect(input.querySelector(".ddbi-display-region-summary-text")!.textContent).toBe("Status Effect, hollow dots, fill opacity 0.4");
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
    expect(hidden).toHaveLength(19);
    // the sheet serialises the element, so nothing may live only on properties or listeners
    expect(input.outerHTML).toContain("name=\"behaviors.0.config.opacity\" value=\"0.4\" data-dtype=\"Number\"");
    for (const name of ["pattern", "opacity", "dashed", "border", "color"]) {
      expect(behavior.customizeField({ name }, {})).toBe(false);
    }
  });

  it("gives the trigger behavior the same picker for its profile field", () => {
    const behavior = new DDBMacroActivityBehavior({} as any);
    const data: Record<string, any> = {};
    behavior.customizeField({ name: "displayProfile" }, data);
    const input = data.input({}, { name: "behaviors.1.config.displayProfile", value: "" }) as HTMLElement;
    expect([...input.querySelector("select")!.options].map((option) => option.value)).toEqual(["", "aura", "damage", "status", "minimal"]);
  });
});
