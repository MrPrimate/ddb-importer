import logger from "../../../src/lib/Logger";
import {
  buildMacroBehaviorData,
  buildMacroBehaviorSource,
  REGION_EVENTS,
} from "../../../src/hooks/regionBehaviors/behaviorData";

describe("buildMacroBehaviorData", () => {
  it("stores owner-turn dispatch metadata without subscribing to native turn events", () => {
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    const args = { ownerTurn: true, activityName: "Aura Damage", fireOnPlacement: true };
    expect(buildMacroBehaviorData({ handler: "useActivity", events: ["tokenEnter", "tokenTurnStart"], args })).toEqual({
      type: "executeScript", system: { events: [], source: "" },
      flags: { ddbimporter: { ownerTurn: { events: ["tokenTurnStart"], args } } },
    });
    expect(buildMacroBehaviorData({ handler: "notify", events: ["tokenTurnStart"], args })).toBe(false);
    expect(buildMacroBehaviorData({ handler: "useActivity", events: ["tokenEnter"], args })).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("ignores events"), { events: ["tokenEnter"] });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("handler \"notify\""));
    warn.mockRestore();
  });
  it("builds a core executeScript behavior dispatching to the ddb handler", () => {
    const data = buildMacroBehaviorData({ handler: "useActivity", events: ["tokenEnter", "tokenTurnStart"], args: { oncePerTurn: true } });
    expect(data).toMatchObject({ type: "executeScript", system: { events: ["tokenEnter", "tokenTurnStart"] } });
    const source = (data as any).system.source as string;
    expect(source).toContain("DDBImporter.effects.AuraAutomations.handleRegionEvent(");
    expect(source).toContain("handler: \"useActivity\"");
    expect(source).toContain("args: {\"oncePerTurn\":true}");
  });

  it("drops unknown events and refuses to build with none left", () => {
    expect(buildMacroBehaviorData({ handler: "x", events: ["notAnEvent"] })).toBe(false);
    expect(buildMacroBehaviorData({ handler: "", events: ["tokenEnter"] })).toBe(false);
  });

  it("escapes handler names and args as JSON in the script source", () => {
    const source = buildMacroBehaviorSource("say \"hi\"", { text: "a \"quoted\" value" });
    expect(source).toContain("handler: \"say \\\"hi\\\"\"");
    expect(source).toContain("\"text\":\"a \\\"quoted\\\" value\"");
  });

  it("exposes the supported core region events", () => {
    expect(REGION_EVENTS).toContain("tokenMoveWithin");
    expect(REGION_EVENTS).toContain("tokenRoundEnd");
  });
});
