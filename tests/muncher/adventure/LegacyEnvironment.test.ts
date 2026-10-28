import { describe, it, expect } from "vitest";
import AdventureMunch from "../../../src/muncher/adventure/AdventureMunch";

// Scene files exported before Foundry 12 keep lighting at the top level; Foundry 14 no longer migrates it.
describe("AdventureMunch._migrateLegacyEnvironment", () => {
  it("moves darkness and global light into the environment", () => {
    const data: any = { darkness: 1, globalLight: false, globalLightThreshold: 0.5 };
    AdventureMunch._migrateLegacyEnvironment(data);
    expect(data.environment).toEqual({ darknessLevel: 1, globalLight: { enabled: false, darkness: { max: 0.5 } } });
    expect(data.darkness).toBeUndefined();
    expect(data.globalLight).toBeUndefined();
    expect(data.globalLightThreshold).toBeUndefined();
  });

  it("never overrides an environment the file already has", () => {
    const data: any = { darkness: 1, environment: { darknessLevel: 0.25 } };
    AdventureMunch._migrateLegacyEnvironment(data);
    expect(data.environment.darknessLevel).toBe(0.25);
    expect(data.darkness).toBeUndefined();
  });

  it("leaves a current scene alone", () => {
    const data: any = { environment: { darknessLevel: 0.4 } };
    AdventureMunch._migrateLegacyEnvironment(data);
    expect(data).toEqual({ environment: { darknessLevel: 0.4 } });
  });
});
