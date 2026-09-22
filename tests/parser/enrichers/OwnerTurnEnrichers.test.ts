import { setMockSettings } from "../../_setup/foundryMocks";
import DamageAura from "../../../src/parser/enrichers/monster/Generic/DamageAura";
import SickeningVapors from "../../../src/parser/enrichers/monster/ManesVaporspawn/SickeningVapors";
import CrownOfHorns from "../../../src/parser/enrichers/class/warlock/CrownOfHorns";
import RiptideCrossbow from "../../../src/parser/enrichers/item/RiptideCrossbow";
import SandstormStaff from "../../../src/parser/enrichers/item/SandstormStaff";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeEach(() => setMockSettings({ "enable-ddb-macro-region-behaviors": true, "add-ddb-macro-region-behaviors": true }));

beforeAll(() => installActivityConfigStubs());

describe("owner-turn region enrichers", () => {
  it("retains a manual damage roll, contact restrictions and persistent Burning beside its placer", () => {
    const e = makeEnricherData(DamageAura, { name: "Fire Aura", actions: null,
      ddbParser: { strippedHtml: "At the end of each of the ember's turns, creatures of its choice within 20 feet of it take 7 (2d6) fire damage. A creature touching it within 5 feet takes 3 (1d6) fire damage. Creatures start burning.", actionData: { damageParts: [] } } });
    expect(e.activity).toMatchObject({ name: "Aura Damage", noTemplate: true, noConsumeTargets: true, targetChoice: true });
    const placer = e.additionalActivities.find((a) => a.init?.name === "Place Aura")!;
    expect(placer.build?.targetOverride?.template).toMatchObject({ type: "radius", size: "20" });
    expect(placer.overrides?.data?.behaviors?.[0]).toMatchObject({ config: {
      ownerTurn: true, events: ["tokenTurnEnd"], excludeSelf: true, args: { activityName: "Aura Damage" },
    } });
    expect(e.additionalActivities[0].init?.name).toBe("Contact Damage");
    expect(e.effects[0]).toMatchObject({ activityMatch: "Aura Damage", statuses: ["Burning"] });
  });

  it.each(["add-ddb-macro-region-behaviors", "enable-ddb-macro-region-behaviors"])("keeps manual templates and omits an inert aura placer when %s is off", (setting) => {
    setMockSettings({ [setting]: false });
    const aura = makeEnricherData(DamageAura, { name: "Fire Aura", actions: null,
      ddbParser: { strippedHtml: "At the end of each of the ember's turns, creatures within 20 feet of it take 7 (2d6) fire damage.", actionData: { damageParts: [] } } });
    expect(aura.additionalActivities.some((activity) => activity.init?.name === "Place Aura")).toBe(false);
    expect(aura.activity).toMatchObject({ noTemplate: false, data: { target: { template: { type: "radius", size: "20" } } } });
    const [cast, eruption] = makeEnricherData(RiptideCrossbow, { name: "Riptide Crossbow" }).additionalActivities;
    expect(cast.build?.durationOverride).toMatchObject({ units: "round", value: "1" });
    expect(eruption.overrides).toMatchObject({ noConsumeTargets: true, noTemplate: false });
    expect(eruption.build?.targetOverride?.template).toMatchObject({ type: "circle", size: "20" });
  });

  it("places Sickening Vapors without a cast-time save and links only its Incapacitated rider", () => {
    const e = makeEnricherData(SickeningVapors, { name: "Sickening Vapors" });
    expect(e.type).toBe("utility");
    expect(e.activity.data?.behaviors?.[0]).toMatchObject({ config: { ownerTurn: true, events: ["tokenTurnEnd"] } });
    expect(e.additionalActivities[0].build?.saveOverride).toEqual({ ability: ["con"], dc: { calculation: "", formula: "12" } });
    expect(e.effects[0]).toMatchObject({ activityMatch: "Sickening Vapors Save", options: { expiry: "targetEnd", durationSeconds: null } });
    expect(e.additionalActivities[0].build?.activationOverride?.condition).toContain("immunity");
  });

  it("Crown keeps its self benefit, makes one recipient optional and separates its three effects", () => {
    const e = makeEnricherData(CrownOfHorns, { name: "Crown of Horns", actions: null });
    expect(e.activity).toMatchObject({ addItemConsume: true, targetType: "self", data: {
      target: { affects: { type: "self" }, template: { type: "radius", size: "20" } },
      behaviors: [{ config: { ownerTurn: true, fireOnPlacement: true } }],
    } });
    for (const [index, choice] of ["Enticement", "Wickedness", "Terror"].entries()) {
      const trigger = e.additionalActivities[index];
      expect(trigger.build?.targetOverride?.affects).toEqual({ type: "creature", count: "1", choice: true });
      expect(trigger.overrides).toMatchObject({ noConsumeTargets: true, noTemplate: true });
      expect(e.effects[index + 1].activityMatch).toBe(`King of All: ${choice}`);
    }
    expect(e.effects[0].activityMatch).toBe("Manifest Crown of Horns");
    expect(e.additionalActivities[3].init?.name).toBe("Spend Pact Slot to Restore Use");
  });

  it("Riptide consumes only on placement and leaves expiry to its one-shot eruption", () => {
    const e = makeEnricherData(RiptideCrossbow, { name: "Riptide Crossbow" });
    const [cast, eruption] = e.additionalActivities;
    expect(cast.overrides).toMatchObject({ addItemConsume: true, data: { behaviors: [
      { type: "difficultTerrain" }, { config: { ownerTurn: true, deleteAfterUse: true, events: ["tokenTurnStart"], args: { fallbackDuration: 6 } } },
    ] } });
    expect(cast.build?.durationOverride?.units).toBe("spec");
    expect(eruption.overrides).toMatchObject({ noConsumeTargets: true, noTemplate: true });
    expect(eruption.build?.damageParts?.[0]).toMatchObject({ number: 3, denomination: 10, types: ["bludgeoning"] });
    expect(e.effects[0]).toMatchObject({ activityMatch: "Eruption", statuses: ["Prone"] });
  });

  it("Sandstorm keeps victim-turn saves beside a recipient-free owner-turn drift card", () => {
    const e = makeEnricherData(SandstormStaff, { name: "Sandstorm Staff" });
    const [cast, save, drift] = e.additionalActivities;
    expect(cast.build?.targetOverride?.template?.stationary).toBe(true);
    expect(cast.overrides?.data?.behaviors).toMatchObject([
      { config: { events: ["tokenTurnStart"], args: { activityName: "Dust Vortex Save" } } },
      { config: { ownerTurn: true, ownerTurnTargets: "none", args: { activityName: "Dust Vortex Drift" } } },
    ]);
    expect(save.overrides?.noConsumeTargets).toBe(true);
    expect(drift.overrides).toMatchObject({ noConsumeTargets: true, noTemplate: true, data: { roll: { formula: "1d20" } } });
  });
});
