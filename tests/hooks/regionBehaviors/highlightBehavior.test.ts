// @vitest-environment jsdom
vi.mock("../../../src/hooks/regionBehaviors/baseActivityBehavior", () => ({
  default: class MockBaseActivityBehavior {
    constructor(data: Record<string, unknown> = {}) {
      Object.assign(this, data);
    }
  },
}));

import DDBHighlightActivityBehavior from "../../../src/hooks/regionBehaviors/DDBHighlightActivityBehavior";
import DDBMacroActivityBehavior from "../../../src/hooks/regionBehaviors/DDBMacroActivityBehavior";

describe("DDBHighlightActivityBehavior", () => {
  it("never creates a region behavior", () => {
    const behavior = new DDBHighlightActivityBehavior({ profile: "aura" } as any);
    expect(behavior.createBehaviorData({ target: {} })).toBe(false);
  });

  it("renders the profile as a picker and the pattern with a profile-default choice", () => {
    const behavior = new DDBHighlightActivityBehavior({} as any);
    const profile: Record<string, any> = {};
    behavior.customizeField({ name: "profile" }, profile);
    const input = profile.input({}, { name: "behaviors.0.config.profile", value: "damage" }) as HTMLElement;
    expect(input.querySelector("select")!.name).toBe("behaviors.0.config.profile");
    expect(input.querySelector<HTMLSelectElement>("select")!.value).toBe("damage");
    expect(input.querySelector("button")).not.toBeNull();
    const pattern: Record<string, any> = {};
    behavior.customizeField({ name: "pattern" }, pattern);
    expect(pattern.options.map((option: any) => option.value)).toEqual(["", "hatch", "solid", "crosshatch", "dots", "edge"]);
    const other: Record<string, any> = {};
    behavior.customizeField({ name: "opacity" }, other);
    expect(other).toEqual({});
  });

  it("gives the trigger behavior the same picker for its profile field", () => {
    const behavior = new DDBMacroActivityBehavior({} as any);
    const data: Record<string, any> = {};
    behavior.customizeField({ name: "highlightProfile" }, data);
    const input = data.input({}, { name: "behaviors.1.config.highlightProfile", value: "" }) as HTMLElement;
    expect([...input.querySelector("select")!.options].map((option) => option.value)).toEqual(["", "aura", "damage", "status", "minimal"]);
  });
});
