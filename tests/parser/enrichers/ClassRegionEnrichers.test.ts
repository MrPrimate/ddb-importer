/**
 * Region-behavior pins for the partner class features converted in the 2026-09 region backlog.
 * The class audits show what each document ends up with, but a behavior naming a sibling activity
 * by `activityName` and an effect matched to an activity by name are links they cannot see.
 * Bewitched Effigy: Ward is also pinned here by name: its three option documents share one DDB
 * feature name, which is what the audit manifest keys enricher locks on, so it cannot hold one.
 *
 * No vi.mock preamble, for the reasons given in ClassEnrichers.test.ts.
 */
import ShadowSmoke from "../../../src/parser/enrichers/class/barbarian/ShadowSmoke";
import CorrosiveHaze from "../../../src/parser/enrichers/class/barbarian/CorrosiveHaze";
import GestaltAnchor from "../../../src/parser/enrichers/class/cleric/GestaltAnchor";
import BewitchedEffigyWard from "../../../src/parser/enrichers/class/druid/BewitchedEffigyWard";
import AuraOfDisruption from "../../../src/parser/enrichers/class/paladin/AuraOfDisruption";
import AuraOfTheRiver from "../../../src/parser/enrichers/class/paladin/AuraOfTheRiver";
import GuardianAngel from "../../../src/parser/enrichers/class/paladin/GuardianAngel";
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

const REGION_FEATURES: [string, TEnricher][] = [
  ["ShadowSmoke", ShadowSmoke],
  ["CorrosiveHaze", CorrosiveHaze],
  ["GestaltAnchor", GestaltAnchor],
  ["BewitchedEffigyWard", BewitchedEffigyWard],
  ["AuraOfDisruption", AuraOfDisruption],
  ["AuraOfTheRiver", AuraOfTheRiver],
  ["GuardianAngel", GuardianAngel],
];

function build(Enricher: TEnricher, name = "Test Feature"): any {
  return makeEnricherData(Enricher, { name, actions: null, data: { name } });
}

interface IBuiltActivity {
  name: string;
  data: Record<string, any>;
  template: Record<string, any> | undefined;
  affects: string | undefined;
}

function activities(e: any): IBuiltActivity[] {
  const primary = e.activity
    ? [{
      name: e.activity.name ?? "",
      data: e.activity.data ?? {},
      template: e.activity.data?.target?.template,
      affects: e.activity.data?.target?.affects?.type,
    }]
    : [];
  const extras = (e.additionalActivities ?? []).map((extra: any) => ({
    name: extra.init?.name ?? "",
    data: extra.overrides?.data ?? {},
    template: extra.build?.targetOverride?.template,
    affects: extra.build?.targetOverride?.affects?.type,
  }));
  return [...primary, ...extras];
}

function named(e: any, name: string): IBuiltActivity {
  const found = activities(e).find((activity) => activity.name === name);
  if (!found) throw new Error(`no activity named "${name}"`);
  return found;
}

function behaviorsOf(activity: IBuiltActivity): any[] {
  return activity.data.behaviors ?? [];
}

function macro(activity: IBuiltActivity): any {
  return behaviorsOf(activity).find((behavior) => behavior.type === "ddbMacro");
}

describe.each(REGION_FEATURES)("%s region links", (_label, Enricher) => {
  const e = build(Enricher);
  const all = activities(e);
  const names = all.map((activity) => activity.name);

  it("places exactly one region, from an activity with a template", () => {
    const placers = all.filter((activity) => behaviorsOf(activity).length > 0);
    expect(placers).toHaveLength(1);
    expect(placers[0].template?.type).toBeTruthy();
    expect(placers[0].template?.size).toBeTruthy();
  });

  it("names only sibling activities that exist and never auto rolls", () => {
    for (const behavior of all.flatMap(behaviorsOf).filter((b) => b.type === "ddbMacro")) {
      expect(names).toContain(behavior.config.args.activityName);
      expect(behavior.config.args.autoRoll).toBeUndefined();
    }
  });

  it("backs every applied-while-inside effect with a standalone definition", () => {
    const applied = all.flatMap(behaviorsOf)
      .filter((behavior) => behavior.type === "applyActiveEffect")
      .flatMap((behavior) => behavior.config.effects as string[]);
    for (const name of applied) {
      const effect = (e.effects ?? []).find((hint: any) => hint.name === name && hint.standalone);
      expect(effect, name).toBeDefined();
    }
  });

  it("matches every activity-bound effect to an activity that exists", () => {
    for (const effect of (e.effects ?? []).filter((hint: any) => hint.activityMatch)) {
      expect(names, effect.name).toContain(effect.activityMatch);
      expect(effect.options?.transfer, effect.name).toBe(false);
    }
  });
});

describe("the class barrels expose them under the names the factory derives", () => {
  it.each([
    ["Barbarian", "ShadowSmoke"],
    ["Barbarian", "CorrosiveHaze"],
    ["Cleric", "GestaltAnchor"],
    ["Druid", "BewitchedEffigyWard"],
    ["Paladin", "AuraOfDisruption"],
    ["Paladin", "AuraOfTheRiver"],
    ["Paladin", "GuardianAngel"],
  ])("%s.%s", (klass, feature) => {
    const group = (ClassEnrichers as unknown as Record<string, Record<string, unknown>>)[klass];
    expect(typeof group[feature]).toBe("function");
  });
});

describe("shadow gnawer smoke", () => {
  it("Shadow Smoke hands out an effect that outlasts leaving, never to the barbarian", () => {
    const e = build(ShadowSmoke);
    expect(named(e, "Emanate Smoke").template).toMatchObject({ type: "radius", size: "10" });
    expect(macro(named(e, "Emanate Smoke")).config).toMatchObject({ events: ["tokenTurnStart"], excludeSelf: true });
    expect(e.additionalActivities[0].init.type).toBe("utility");
    expect(e.effects[0]).toMatchObject({ daeSpecialDurations: ["1Attack"], options: { expiry: "targetStart" } });
  });

  it("Corrosive Haze saves against a Constitution DC and only reaches enemies", () => {
    const e = build(CorrosiveHaze);
    expect(macro(named(e, "Emanate Corrosive Smoke")).config.events).toEqual(["tokenEnter", "tokenTurnStart"]);
    const save = e.additionalActivities[0];
    expect(save.build.saveOverride).toMatchObject({ ability: ["con"], dc: { calculation: "con", formula: "" } });
    expect(save.build.targetOverride.affects.type).toBe("enemy");
    // the parser's own Blinded effect is kept, so the placer must not pick it up
    expect(e.activity.noeffect).toBe(true);
    expect(e.effects ?? []).toEqual([]);
  });
});

describe("passive auras", () => {
  it("Gestalt Anchor moves the parsed modifier effect out for the region, or keeps it for Aura Effects", () => {
    const e = build(GestaltAnchor, "Gestalt Anchor");
    expect(e.activity.data.target).toMatchObject({ affects: { type: "ally" }, template: { type: "radius", size: "10" } });
    expect(behaviorsOf(named(e, "Place Aura"))[0]).toMatchObject({
      type: "applyActiveEffect",
      config: { effects: ["Gestalt Anchor"] },
      ddbimporter: { auraeffectsNever: true },
    });
    const [region, module] = e.effects;
    expect(region).toMatchObject({ noCreate: true, standalone: true, auraeffectsNever: true, name: "Gestalt Anchor" });
    expect(module).toMatchObject({ noCreate: true, auraeffectsOnly: true, auraeffects: { distanceFormula: "10", applyToSelf: true } });
  });

  it("Aura of Disruption sizes from the subclass scale and saves against the spell DC at turn end", () => {
    const e = build(AuraOfDisruption);
    expect(named(e, "Place Aura").template?.size).toBe("@scale.spelldrinker.aura-of-disruption");
    expect(macro(named(e, "Place Aura")).config).toMatchObject({ events: ["tokenTurnEnd"], excludeSelf: true });
    expect(e.additionalActivities[0].build).toMatchObject({
      saveOverride: { ability: ["con"], dc: { calculation: "spellcasting" } },
      targetOverride: { affects: { type: "enemy" } },
    });
  });

  it("Aura of the River is enemy terrain over the Aura of Protection and keeps DDB's push action", () => {
    const e = build(AuraOfTheRiver);
    expect(e.activity.data.target).toMatchObject({
      affects: { type: "enemy" },
      template: { type: "radius", size: "@scale.paladin.aura-of-protection" },
    });
    expect(behaviorsOf(named(e, "Place Aura"))[0]).toMatchObject({ type: "difficultTerrain", config: { types: ["liquid"] } });
    expect(e.useDefaultAdditionalActivities).toBe(true);
  });
});

describe("activated areas", () => {
  it("Guardian Angel adds Walking Bastion beside DDB's actions and lends the paladin's AC as a formula", () => {
    const e = build(GuardianAngel);
    expect(e.type).toBeNull();
    expect(e.useDefaultAdditionalActivities).toBe(true);
    expect(e.addToDefaultAdditionalActivities).toBe(true);
    expect(named(e, "Walking Bastion")).toMatchObject({ affects: "ally", template: { type: "radius", size: "100" } });
    const [effect] = e.effects;
    expect(effect).toMatchObject({ standalone: true, originReplacement: true, options: { expiry: null, durationSeconds: null } });
    // a formula, not an override: dnd5e takes the highest, so a better-armoured ally keeps its own
    expect(effect.changes[0]).toMatchObject({ key: "system.attributes.ac.formulas", value: "@attributes.ac.value" });
  });

  it("Bewitched Effigy: Ward is a fixed circle dropped on the effigy, not an emanation on the druid", () => {
    const e = build(BewitchedEffigyWard, "Bewitched Effigy: Ward");
    expect(e.activity.data.target).toMatchObject({ affects: { type: "ally" }, template: { type: "circle", size: "30" } });
    expect(e.activity.data.range).toMatchObject({ value: "30", units: "ft" });
    // the parser links the Wild Shape use; the enricher must not strip it
    expect(e.activity.noConsumeTargets).toBeUndefined();
    expect(e.effects[0]).toMatchObject({ name: "Bewitched Effigy: Ward", standalone: true, options: { expiry: null } });
    expect(e.effects[0].changes[0]).toMatchObject({ key: "system.attributes.ac.bonus", value: "1" });
  });
});
