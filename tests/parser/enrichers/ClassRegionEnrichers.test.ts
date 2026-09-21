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
import PerfectedArmor from "../../../src/parser/enrichers/class/artificer/PerfectedArmor";
import MacabreModifications from "../../../src/parser/enrichers/class/artificer/MacabreModifications";
import PoweredByPathos from "../../../src/parser/enrichers/class/barbarian/PoweredByPathos";
import HandyHaints from "../../../src/parser/enrichers/class/bard/HandyHaints";
import HandyHaintsGrump from "../../../src/parser/enrichers/class/bard/HandyHaintsGrump";
import DispatersInterdiction from "../../../src/parser/enrichers/class/illrigger/DispatersInterdiction";
import FireAndBrimstone from "../../../src/parser/enrichers/class/paladin/FireAndBrimstone";
import FloodingAbundance from "../../../src/parser/enrichers/class/rogue/FloodingAbundance";
import SRDEffects from "../../../src/parser/enrichers/effects/SRDEffects";
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

describe("the tail: reactions offered by an emanation", () => {
  it("Perfected Armor offers the Guardian pull at a Huge or smaller creature's turn end, in both printings", () => {
    for (const is2014 of [true, false]) {
      const e: any = makeEnricherData(PerfectedArmor, { name: "Perfected Armor", actions: null, data: { name: "Perfected Armor" }, is2014 });
      const [placer, pull] = e.additionalActivities;
      expect(placer.build.targetOverride.template).toMatchObject({ type: "radius", size: "30" });
      expect(placer.overrides.data.behaviors[0].config).toMatchObject({
        events: ["tokenTurnEnd"], excludeSelf: true, sizes: ["tiny", "sm", "med", "lg", "huge"], args: { activityName: "Guardian: Pull" },
      });
      expect(pull.init).toEqual({ name: "Guardian: Pull", type: "save" });
      expect(pull.build).toMatchObject({ saveOverride: { ability: ["str"], dc: { calculation: "spellcasting" } }, activationOverride: { type: "reaction" } });
      // the 2014 pool is spent by the feature's own activity, the 2024 one by the pull
      expect(Boolean(pull.overrides.addItemConsume)).toBe(!is2014);
      expect(e.type).toBe(is2014 ? "utility" : null);
    }
  });

  it("Powered by Pathos builds Jealousy and Terror, each behind its own aura", () => {
    const e = build(PoweredByPathos);
    expect(e.additionalActivities.map((a: any) => a.init.name)).toEqual([
      "Jealousy: Place Aura", "Jealousy: Spectral Assailants", "Terror: Place Aura", "Terror: Terrify",
    ]);
    for (const [placer, trigger] of [["Jealousy: Place Aura", "Jealousy: Spectral Assailants"], ["Terror: Place Aura", "Terror: Terrify"]]) {
      expect(named(e, placer)).toMatchObject({ affects: "enemy", template: { type: "radius", size: "30" } });
      expect(macro(named(e, placer)).config).toMatchObject({ events: ["tokenTurnStart"], excludeSelf: true, args: { activityName: trigger } });
    }
    const [, jealousy, , terror] = e.additionalActivities;
    // the creature picks the ability; the DC is built on the barbarian's Constitution
    expect(jealousy.build.saveOverride).toMatchObject({ ability: ["str", "dex"], dc: { calculation: "con" } });
    expect(terror.init.type).toBe("utility");
    expect(e.effects.map((effect: any) => [effect.activityMatch, effect.options.expiry])).toEqual([
      ["Jealousy: Spectral Assailants", "turnEnd"],
      ["Terror: Terrify", "targetStart"],
    ]);
  });

  it("Dispater's Interdiction keeps DDB's actions and offers Telekinetic Seal on entry", () => {
    const e = build(DispatersInterdiction);
    expect(e.type).toBeNull();
    expect(e.useDefaultAdditionalActivities).toBe(true);
    expect(e.addToDefaultAdditionalActivities).toBe(true);
    expect(named(e, "Telekinetic Seal: Place Aura")).toMatchObject({ affects: "enemy", template: { type: "radius", size: "5" } });
    expect(macro(named(e, "Telekinetic Seal: Place Aura")).config).toMatchObject({ events: ["tokenEnter"], args: { activityName: "Telekinetic Seal" } });
    // DDB's actions carry their own effect links, so the parsed effects are left alone
    expect(e.clearAutoEffects).toBe(false);
  });

  it("Fire and Brimstone activates once a long rest and punishes at reach", () => {
    const e = build(FireAndBrimstone);
    expect(e.activity).toMatchObject({ name: "Activate", activationType: "bonus", addItemConsume: true });
    expect(named(e, "Place Aura")).toMatchObject({ affects: "enemy", template: { type: "radius", size: "15" } });
    expect(macro(named(e, "Place Aura")).config).toMatchObject({ events: ["tokenTurnEnd"], args: { activityName: "Punish the Wicked" } });
    const punish = e.additionalActivities[1];
    expect(punish.build.saveOverride).toMatchObject({ ability: ["cha"], dc: { calculation: "spellcasting" } });
    expect(e.effects[1]).toMatchObject({ activityMatch: "Punish the Wicked", statuses: ["Prone"], options: { expiry: "targetStart" } });
    expect(e.effects[1].changes[0]).toMatchObject({ key: "system.attributes.movement.multiplier", value: "0" });
    expect(e.additionalActivities[2].build.consumptionOverride.targets.map((t: any) => t.type)).toEqual(["itemUses", "spellSlots"]);
  });
});

describe("the tail: areas set down away from the owner", () => {
  it("Handy Haints leaves its activities to the chosen haint", () => {
    const parent = build(HandyHaints, "Handy Haints");
    expect(parent.type).toBe("none");
    expect(parent.useDefaultAdditionalActivities).toBe(false);
    expect(parent.additionalActivities ?? []).toEqual([]);
  });

  it("Handy Haints: Grump drops a fixed circle on the inspired creature with stock Advantage effects", () => {
    const e = build(HandyHaintsGrump, "Handy Haints: Grump");
    expect(e.builtFeaturesFromActionFilters).toEqual(["Grump: Reaction"]);
    expect(e.useDefaultAdditionalActivities).toBe(true);
    const placer = named(e, "Grump: Place Aura");
    // a circle, not a radius: the aura belongs to the inspired creature, not to the bard
    expect(placer).toMatchObject({ affects: "ally", template: { type: "circle", size: "15" } });
    expect(behaviorsOf(placer)[0]).toMatchObject({
      type: "applyActiveEffect",
      config: { effects: [SRDEffects.skillAdvantage("itm"), SRDEffects.saveAdvantage("str")] },
    });
  });

  it("Flooding Abundance builds both DDB actions, with wax terrain and a free burn", () => {
    const e = build(FloodingAbundance, "Enchantments: Flooding Abundance");
    const [candle, burn] = e.additionalActivities;
    expect(candle.action).toEqual({ name: "Flooding Abundance: Throw Candle", type: "class" });
    expect(candle.overrides.data.behaviors.map((b: any) => b.type)).toEqual(["difficultTerrain"]);
    expect(burn.action.name).toBe("Flooding Abundance: Fire Damage");
    expect(burn.overrides.noConsumeTargets).toBe(true);
  });
});

describe("the tail: an aura placed onto a companion", () => {
  it("Macabre Modifications places Gaunt's aura for the companion's token and fires its save", () => {
    const e = build(MacabreModifications);
    const aura = named(e, "Macabre Modification: Gaunt Aura");
    expect(aura.affects).toBe("enemy");
    expect(aura.template).toMatchObject({ type: "radius", size: "10" });
    expect(macro(aura).config).toMatchObject({
      events: ["tokenTurnStart"],
      excludeSelf: true,
      args: { activityName: "Macabre Modification: Gaunt Save" },
    });
    const save = e.additionalActivities.find((a: any) => a.init.name === "Macabre Modification: Gaunt Save");
    expect(save.overrides.noTemplate).toBe(true);
    expect(save.overrides.data.save.dc.calculation).toBe("spellcasting");
    expect(e.effects.find((effect: any) => effect.activityMatch === "Macabre Modification: Gaunt Save").statuses).toEqual(["Frightened"]);
  });
});
