/**
 * Region-behavior pins for the item enrichers built on data/RegionBuilders. The items audit shows
 * what each document ends up with, but two links are invisible to it: a behavior naming a sibling
 * activity by `activityName` (the orphan check covers effects only) and an effect matched to an
 * activity by name. Both are asserted here for every enricher, then each distinct shape once.
 *
 * No vi.mock preamble, for the reasons given in ClassEnrichers.test.ts. Item text below is
 * synthetic; the real wording lives in the private audit fixtures.
 */
import * as ItemEnrichers from "../../../src/parser/enrichers/item/_module";
import DDBItemEnricher from "../../../src/parser/enrichers/DDBItemEnricher";
import SRDEffects from "../../../src/parser/enrichers/effects/SRDEffects";
import { area, emanation, escapeCheck, regionPlacer, regionPlacerData, regionTarget, regionTrigger } from "../../../src/parser/enrichers/data/RegionBuilders";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

const REGION_ITEMS: [string, TEnricher][] = [
  ["AstralCaltrops", ItemEnrichers.AstralCaltrops],
  ["BartendersArmistice", ItemEnrichers.BartendersArmistice],
  ["BlizzardSphere", ItemEnrichers.BlizzardSphere],
  ["CalimemnonCrystal", ItemEnrichers.CalimemnonCrystal],
  ["Caltrooze", ItemEnrichers.Caltrooze],
  ["CloakOfTheListener", ItemEnrichers.CloakOfTheListener],
  ["CoinOfWarAndFear", ItemEnrichers.CoinOfWarAndFear],
  ["CrownOfInfiniteMidnight", ItemEnrichers.CrownOfInfiniteMidnight],
  ["DavyJonessKey", ItemEnrichers.DavyJonessKey],
  ["FuriousFlail", ItemEnrichers.FuriousFlail],
  ["Gibberbox", ItemEnrichers.Gibberbox],
  ["Haemscale", ItemEnrichers.Haemscale],
  ["HatOfVortexes", ItemEnrichers.HatOfVortexes],
  ["HelmOfBrilliance", ItemEnrichers.HelmOfBrilliance],
  ["HrethiSoulScepter", ItemEnrichers.HrethiSoulScepter],
  ["IndigoStraysConviction", ItemEnrichers.IndigoStraysConviction],
  ["InfernoRope", ItemEnrichers.InfernoRope],
  ["KnightsStandardOfValor", ItemEnrichers.KnightsStandardOfValor],
  ["LightningPylons", ItemEnrichers.LightningPylons],
  ["MourningsteelHalfPlate", ItemEnrichers.MourningsteelHalfPlate],
  ["MourningsteelWarBanner", ItemEnrichers.MourningsteelWarBanner],
  ["OrbOfDamara", ItemEnrichers.OrbOfDamara],
  ["PoisonPopper", ItemEnrichers.PoisonPopper],
  ["QuagmireMaul", ItemEnrichers.QuagmireMaul],
  ["RingOfLunarMight", ItemEnrichers.RingOfLunarMight],
  ["RiptideCrossbow", ItemEnrichers.RiptideCrossbow],
  ["SandstormStaff", ItemEnrichers.SandstormStaff],
  ["SheerCold", ItemEnrichers.SheerCold],
  ["ShieldOfYggdrasil", ItemEnrichers.ShieldOfYggdrasil],
  ["ShovelOfYorgrim", ItemEnrichers.ShovelOfYorgrim],
  ["SilenceOfTheDrowned", ItemEnrichers.SilenceOfTheDrowned],
  ["StaffOfBriars", ItemEnrichers.StaffOfBriars],
  ["StaffOfCubicCultivation", ItemEnrichers.StaffOfCubicCultivation],
  ["TinyBubbles", ItemEnrichers.TinyBubbles],
  ["VilesmogBomb", ItemEnrichers.VilesmogBomb],
  ["VisageOfTheOldWays", ItemEnrichers.VisageOfTheOldWays],
  ["VolcanicBoots", ItemEnrichers.VolcanicBoots],
  ["WandOfTheFrostrose", ItemEnrichers.WandOfTheFrostrose],
  ["WarOil", ItemEnrichers.WarOil],
  ["WeaponOfGrass", ItemEnrichers.WeaponOfGrass],
  // damage per 5 feet moved
  ["FesterwoodFungalStave", ItemEnrichers.FesterwoodFungalStave],
  ["TheRoseBasket", ItemEnrichers.TheRoseBasket],
];

/** Every property the text-gated enrichers look for, so each builds its full activity set. */
const FULL_TEXT = "Sacrificial Flame. Aura. You can create an aura with a 30-foot radius centred on you.";

function build(Enricher: TEnricher, name = "Test Item", description = FULL_TEXT, options: Record<string, any> = {}): any {
  return makeEnricherData(Enricher, {
    name,
    actions: null,
    data: { name },
    ddbParser: { ddbDefinition: { description, properties: [], sources: [] } },
    ...options,
  });
}

interface IBuiltActivity {
  name: string;
  data: Record<string, any>;
  template: Record<string, any> | undefined;
  affects: string | undefined;
}

/** The primary and every additional activity, flattened to the fields the region links depend on. */
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
    name: extra.init?.name ?? extra.overrides?.name ?? "",
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

describe.each(REGION_ITEMS)("%s region links", (_label, Enricher) => {
  const e = build(Enricher);
  const all = activities(e);
  const names = all.map((activity) => activity.name);

  it("places at least one region", () => {
    expect(all.some((activity) => behaviorsOf(activity).length > 0)).toBe(true);
  });

  it("gives every activity that carries behaviors a template, or it would never place a region", () => {
    for (const activity of all.filter((a) => behaviorsOf(a).length > 0)) {
      expect(activity.template?.type, activity.name).toBeTruthy();
      expect(activity.template?.size, activity.name).toBeTruthy();
    }
  });

  it("names only sibling activities that exist", () => {
    for (const activity of all) {
      for (const behavior of behaviorsOf(activity).filter((b) => b.type === "ddbMacro")) {
        const target = behavior.config.args.activityName;
        if (target !== undefined) expect(names, `${activity.name} -> ${target}`).toContain(target);
      }
    }
  });

  it("never auto rolls from a region", () => {
    for (const activity of all) {
      for (const behavior of behaviorsOf(activity).filter((b) => b.type === "ddbMacro")) {
        expect(behavior.config.args.autoRoll).toBeUndefined();
      }
    }
  });

  it("matches every effect to an activity that exists and keeps it off the owner", () => {
    for (const effect of e.effects ?? []) {
      expect(effect.activityMatch, effect.name).toBeTruthy();
      expect(names, effect.name).toContain(effect.activityMatch);
      expect(effect.options?.transfer, effect.name).toBe(false);
    }
  });
});

describe("RegionBuilders", () => {
  it("restates who is affected whenever it overrides a target", () => {
    expect(regionTarget({ type: "cube", size: "5" })).toEqual({
      override: true,
      affects: { type: "creature" },
      template: { contiguous: false, units: "ft", type: "cube", size: "5" },
    });
    expect(emanation("30", "enemy")).toMatchObject({ affects: { type: "enemy" }, template: { type: "radius", size: "30", count: "1" } });
    expect(area("line", "120", { width: "20" }).template).toMatchObject({ type: "line", size: "120", width: "20" });
    expect(regionTarget({ type: "radius", size: "10", stationary: true }).template).toMatchObject({ stationary: true });
  });

  it("places from the owner by default and from a point when given a range", () => {
    const self = regionPlacer("Aura", { template: { type: "radius", size: "10" }, behaviors: [] });
    expect(self.build?.rangeOverride).toMatchObject({ units: "self" });
    expect(self.build?.targetOverride?.template).toMatchObject({ type: "radius", size: "10", units: "ft" });
    expect(self.build?.targetOverride?.template?.stationary).toBeUndefined();

    const thrown = regionPlacer("Cloud", { template: { type: "sphere", size: "10" }, range: "60", behaviors: [] });
    expect(thrown.build?.rangeOverride).toMatchObject({ value: "60", units: "ft" });
  });

  it("marks a planted emanation stationary so it does not follow the token", () => {
    const planted = regionPlacer("Roots", { template: { type: "radius", size: "10", stationary: true }, behaviors: [] });
    expect(planted.build?.targetOverride?.template).toMatchObject({ type: "radius", stationary: true });
  });

  it("spends nothing unless told to, and never links effects to a plain placer", () => {
    const free = regionPlacer("Aura", { template: { type: "radius", size: "10" }, behaviors: [] });
    expect(free.overrides).toMatchObject({ noConsumeTargets: true, noeffect: true });

    const charged = regionPlacer("Aura", { template: { type: "radius", size: "10" }, consume: true, consumeValue: "3", behaviors: [] });
    expect(charged.overrides).toMatchObject({ addItemConsume: true, itemConsumeValue: "3" });
    expect(charged.overrides?.noConsumeTargets).toBeUndefined();
  });

  it("gives a placer with a daily limit its own uses", () => {
    const daily = regionPlacer("Aura", {
      template: { type: "radius", size: "10" },
      uses: { spent: 0, max: "1", recovery: [{ period: "dusk", type: "recoverAll" }] },
      behaviors: [],
    });
    expect(daily.overrides?.data?.uses).toMatchObject({ max: "1" });
    expect(daily.overrides?.data?.consumption?.targets?.[0]).toMatchObject({ type: "activityUses", value: "1" });
  });

  it("becomes a save when the area rolls as it appears", () => {
    const rolled = regionPlacer("Burst", {
      template: { type: "cube", size: "20" },
      range: "10",
      save: { ability: ["dex"], dc: "15" },
      onSave: "half",
      behaviors: [],
    });
    expect(rolled.init?.type).toBe("save");
    expect(rolled.build).toMatchObject({ generateSave: true, saveOverride: { ability: ["dex"], dc: { formula: "15" } } });
    expect((rolled.overrides?.data as I5eSaveActivity | undefined)?.damage).toMatchObject({ onSave: "half" });
  });

  it("types a trigger by what it rolls and keeps it free, instantaneous and untemplated", () => {
    expect(regionTrigger("Save", { condition: "x", save: { ability: ["wis"], dc: "14" } }).init?.type).toBe("save");
    expect(regionTrigger("Damage", { condition: "x", damageParts: [{ number: 1, denomination: 6 } as any] }).init?.type).toBe("damage");
    expect(regionTrigger("Marker", { condition: "x" }).init?.type).toBe("utility");

    const trigger = regionTrigger("Save", { condition: "Enters the area", affects: "enemy", save: { ability: ["wis"], calculation: "spellcasting" } });
    expect(trigger.build).toMatchObject({
      generateConsumption: false,
      activationOverride: { type: "special", condition: "Enters the area" },
      rangeOverride: { units: "self" },
      durationOverride: { units: "inst" },
      targetOverride: { affects: { count: "1", type: "enemy" } },
      saveOverride: { dc: { calculation: "spellcasting", formula: "" } },
    });
    expect(trigger.overrides).toMatchObject({ noConsumeTargets: true, noTemplate: true });
  });

  it("builds the primary placer with the same target, range and consumption", () => {
    const data = regionPlacerData("Throw", {
      template: { type: "sphere", size: "10" },
      range: "60",
      duration: { value: "1", units: "minute" },
      consume: true,
      behaviors: [],
    });
    expect(data).toMatchObject({ name: "Throw", addItemConsume: true, noeffect: true });
    expect(data.data?.target).toMatchObject({ override: true, template: { type: "sphere", size: "10" } });
    expect(data.data?.range).toMatchObject({ value: "60", units: "ft" });
    expect(data.data?.duration).toMatchObject({ override: true, value: "1", units: "minute" });
  });

  it("writes the grapple escape check the parser would have", () => {
    const check = escapeCheck("17");
    expect(check.init).toMatchObject({ name: "Escape Check", type: "check" });
    expect(check.build?.checkOverride).toMatchObject({ associated: ["acr", "ath"], dc: { formula: "17" } });
  });
});

describe("effect while inside (applyActiveEffect)", () => {
  it("Silence of the Drowned applies the stock Silenced effect from a 20-foot emanation", () => {
    const e = build(ItemEnrichers.SilenceOfTheDrowned);
    const drink = named(e, "Drink");
    expect(e.type).toBe("utility");
    expect(drink.template).toMatchObject({ type: "radius", size: "20" });
    expect(drink.data.duration).toMatchObject({ value: "10", units: "minute" });
    expect(behaviorsOf(drink)[0]).toMatchObject({
      type: "applyActiveEffect",
      config: { effects: [SRDEffects.spell("silenced")] },
    });
  });

  it("Shovel of Yorgrim covers the holder and allies, and only from Very Rare up", () => {
    const e = build(ItemEnrichers.ShovelOfYorgrim, "Test Shovel, +2");
    const aura = named(e, "Deny Death's Touch");
    expect(aura.affects).toBe("ally");
    expect(aura.template).toMatchObject({ type: "radius", size: "10" });
    expect(behaviorsOf(aura)[0].config.effects).toEqual([SRDEffects.damageResistance("necrotic")]);

    expect(build(ItemEnrichers.ShovelOfYorgrim, "Test Shovel, +1").additionalActivities).toEqual([]);
    expect(build(ItemEnrichers.ShovelOfYorgrim, "Test Shovel").additionalActivities).toHaveLength(1);
  });
});

describe("emanation on the owner firing a sibling", () => {
  it("Helm of Brilliance damages only Undead that start their turn inside, never the wearer", () => {
    const e = build(ItemEnrichers.HelmOfBrilliance);
    expect(named(e, "Diamond Light").template).toMatchObject({ type: "radius", size: "30" });
    expect(macro(named(e, "Diamond Light")).config).toMatchObject({
      events: ["tokenTurnStart"],
      types: ["undead"],
      excludeSelf: true,
      args: { activityName: "Diamond Light Damage" },
    });
  });

  it("Crown of Infinite Midnight spares Undead and Constructs across its blindsight radius", () => {
    const e = build(ItemEnrichers.CrownOfInfiniteMidnight);
    expect(named(e, "Sapphire Blindsight").template).toMatchObject({ type: "radius", size: "120" });
    expect(macro(named(e, "Sapphire Blindsight")).config).toMatchObject({
      events: ["tokenTurnStart"],
      excludeTypes: ["undead", "construct"],
      excludeSelf: true,
    });
  });

  it("puts 'enemies only' on the trigger, whose dispositions the region takes", () => {
    const orb = build(ItemEnrichers.OrbOfDamara);
    expect(named(orb, "Fear Aura Save").affects).toBe("enemy");
    expect(macro(named(orb, "Fear Aura")).config.events).toEqual(["tokenTurnStart"]);

    const coin = build(ItemEnrichers.CoinOfWarAndFear);
    expect(named(coin, "Boon of Beleth Save").affects).toBe("enemy");
    expect(macro(named(coin, "Boon of Beleth")).config.events).toEqual(["tokenTurnEnd"]);
  });

  it("anchors 'its next turn' riders to the target", () => {
    const orb = build(ItemEnrichers.OrbOfDamara).effects[0];
    expect(orb).toMatchObject({ statuses: ["Frightened"], options: { expiry: "targetStart" } });
    const coin = build(ItemEnrichers.CoinOfWarAndFear).effects.find((effect: any) => effect.activityMatch === "Boon of Beleth Save");
    expect(coin).toMatchObject({ statuses: ["Frightened"], options: { expiry: "targetEnd" } });
  });

  it("Mourningsteel Half Plate filters to Celestials and keeps the aura's daily use on the aura", () => {
    const e = build(ItemEnrichers.MourningsteelHalfPlate);
    const aura = named(e, "Unholy Aura");
    expect(macro(aura).config).toMatchObject({ types: ["celestial"], excludeSelf: true });
    expect(aura.data.uses).toMatchObject({ max: "1", recovery: [{ period: "dusk" }] });
  });

  it("Knight's Standard hands allies their speed through a free utility trigger", () => {
    const e = build(ItemEnrichers.KnightsStandardOfValor);
    expect(named(e, "Fervor and Valor").affects).toBe("ally");
    expect(macro(named(e, "Fervor and Valor")).config).toMatchObject({ events: ["tokenTurnStart"], excludeSelf: true });
    expect(named(e, "Valorous Stride").affects).toBe("ally");
    expect(e.effects[0].options).toMatchObject({ expiry: "turnEnd", durationSeconds: null });
  });
});

describe("placed hazards", () => {
  it("War Oil is difficult terrain plus a slip save, and the fire is not fired by the region", () => {
    const e = build(ItemEnrichers.WarOil);
    const spill = named(e, "Spill War Oil");
    expect(spill.template).toMatchObject({ type: "circle", size: "10" });
    expect(behaviorsOf(spill).map((behavior) => behavior.type)).toEqual(["difficultTerrain", "ddbMacro"]);
    expect(macro(spill).config).toMatchObject({
      events: ["tokenEnter", "tokenTurnStart"],
      args: { activityName: "War Oil Slip Save" },
    });
    expect(named(e, "Burning War Oil Damage")).toBeDefined();
  });

  it("Volcanic Boots exclude the wearer from a stationary cube", () => {
    const e = build(ItemEnrichers.VolcanicBoots);
    expect(named(e, "Scorch the Ground").template).toMatchObject({ type: "cube", size: "5" });
    expect(macro(named(e, "Scorch the Ground")).config.excludeSelf).toBe(true);
  });

  it("Vilesmog Bomb fires an activity so the effect outlasts the cloud", () => {
    const e = build(ItemEnrichers.VilesmogBomb);
    expect(behaviorsOf(named(e, "Throw")).map((behavior) => behavior.type)).toEqual(["ddbMacro"]);
    expect(e.effects[0]).toMatchObject({ activityMatch: "Vilesmog Exposure", options: { durationSeconds: 60 } });
    expect(e.effects[0].changes[0]).toMatchObject({ key: "system.traits.dv.value", value: "poison" });
  });

  it("an area that rolls as it appears re-fires its own save", () => {
    for (const [Enricher, name] of [
      [ItemEnrichers.BartendersArmistice, "Throw Coaster"],
      [ItemEnrichers.InfernoRope, "Ignite"],
      [ItemEnrichers.LightningPylons, "Electrify"],
    ] as [TEnricher, string][]) {
      const e = build(Enricher);
      expect(e.type).toBe("save");
      expect(macro(named(e, name)).config.args.activityName, name).toBeUndefined();
      expect(named(e, name).data.save?.dc?.formula, name).toBeTruthy();
    }
  });

  it("Sheer Cold offers both shapes over the same slip save", () => {
    const e = build(ItemEnrichers.SheerCold);
    expect(named(e, "Slick Ice (Cone)").template).toMatchObject({ type: "cone", size: "15" });
    expect(named(e, "Slick Ice (Line)").template).toMatchObject({ type: "line", size: "30", width: "5" });
    for (const name of ["Slick Ice (Cone)", "Slick Ice (Line)"]) {
      expect(macro(named(e, name)).config.args.activityName).toBe("Slick Ice Save");
    }
  });
});

describe("difficult terrain only", () => {
  it.each([
    ["WeaponOfGrass", ItemEnrichers.WeaponOfGrass, "Conjure Foliage", ["plants"]],
    ["StaffOfBriars", ItemEnrichers.StaffOfBriars, "Sprout Briars", ["plants"]],
    ["QuagmireMaul", ItemEnrichers.QuagmireMaul, "Slam: Create Swamp", ["mud"]],
    ["HatOfVortexes", ItemEnrichers.HatOfVortexes, "Release Vortex", []],
  ] as [string, TEnricher, string, string[]][])("%s", (_label, Enricher, name, types) => {
    const placer = named(build(Enricher), name);
    expect(behaviorsOf(placer)).toHaveLength(1);
    expect(behaviorsOf(placer)[0]).toMatchObject({ type: "difficultTerrain", config: { types } });
  });

  it("spares the owner's side by targeting enemies", () => {
    expect(named(build(ItemEnrichers.ShieldOfYggdrasil), "Metal Roots").affects).toBe("enemy");
    expect(named(build(ItemEnrichers.ShieldOfYggdrasil), "Metal Roots").template).toMatchObject({ stationary: true });
    expect(named(build(ItemEnrichers.RingOfLunarMight), "Gravity Field").affects).toBe("enemy");
    expect(named(build(ItemEnrichers.Haemscale), "Arcanomagnetic Aura").affects).toBe("enemy");
  });

  it("sizes the template from the charges spent", () => {
    const maul = build(ItemEnrichers.QuagmireMaul).additionalActivities[0];
    expect(maul.build.targetOverride.template.size).toBe("5 * @scaling");
    expect(maul.overrides).toMatchObject({ addScalingMode: "amount", addConsumptionScalingMax: "@item.uses.value" });

    const wand = named(build(ItemEnrichers.WandOfTheFrostrose), "Create Ice Sculptures");
    expect(wand.template).toMatchObject({ type: "square", size: "5", count: "@scaling" });
  });

  it("Haemscale reads its radius from the text and falls back to the smallest", () => {
    const at = (text: string) => named(build(ItemEnrichers.Haemscale, "Test Armour", text), "Arcanomagnetic Aura").template?.size;
    expect(at("You can create an aura with a 40-foot radius centred on you.")).toBe("40");
    expect(at("You can create an aura with a radius (size determined by rarity) centred on you.")).toBe("20");
  });

  it("Visage of the Old Ways only burns a body when the text grants it", () => {
    expect(build(ItemEnrichers.VisageOfTheOldWays, "Test Mask, +2", "Fire Within.").additionalActivities).toEqual([]);
    const e = build(ItemEnrichers.VisageOfTheOldWays, "Test Mask, +4", "Sacrificial Flame.");
    // the body is another creature's, so the area is dropped on it and stays put
    expect(named(e, "Sacrificial Flame").template).toMatchObject({ type: "circle", size: "10" });
    expect(named(e, "Sacrificial Flame Damage").affects).toBe("enemy");
  });
});

describe("damage for every 5 feet moved", () => {
  it.each([
    ["FesterwoodFungalStave", ItemEnrichers.FesterwoodFungalStave, "Noxious Mushrooms", "Mushroom Damage", "poison", false],
    ["TheRoseBasket", ItemEnrichers.TheRoseBasket, "Field of Roses", "Rose Thorns", "piercing", true],
  ] as [string, TEnricher, string, string, string, boolean][])("%s offers a free 2d4 on every movement in or within the area", (_label, Enricher, placer, trigger, type, ownerImmune) => {
    const e = build(Enricher);
    const behaviors = behaviorsOf(named(e, placer));
    expect(behaviors[0]).toMatchObject({ type: "difficultTerrain", config: { types: ["plants"] } });
    expect(macro(named(e, placer)).config).toMatchObject({
      events: ["tokenMoveWithin"], oncePerTurn: false, args: { activityName: trigger },
    });
    expect(Boolean(macro(named(e, placer)).config.excludeSelf)).toBe(ownerImmune);
    const roll = e.additionalActivities.find((a: any) => a.init.name === trigger);
    expect(roll.init.type).toBe("damage");
    expect(roll.build.damageParts[0]).toMatchObject({ number: 2, denomination: 4, types: [type] });
  });

  it("Festerwood Fungal Stave covers one square per charge and takes the poison off the weapon attack", () => {
    const e = build(ItemEnrichers.FesterwoodFungalStave);
    expect(e.activity.removeDamageParts).toBe(true);
    const placer = e.additionalActivities[0];
    expect(placer.build.targetOverride.template).toMatchObject({ type: "square", size: "5", count: "@scaling" });
    expect(placer.build.rangeOverride).toMatchObject({ value: "60", units: "ft" });
    expect(placer.overrides).toMatchObject({ addItemConsume: true, addScalingMode: "amount", addConsumptionScalingMax: "@item.uses.value" });
  });

  it("The Rose Basket drops the parser's thorn attack, rebuilds the radiant rider and spends its daily use on the field only", () => {
    const e = build(ItemEnrichers.TheRoseBasket);
    expect(e.addAutoAdditionalActivities).toBe(false);
    const [rider, field] = e.additionalActivities;
    expect(rider.init.type).toBe("attack");
    expect(rider.build).toMatchObject({ generateAttack: true, includeBaseDamage: true });
    expect(rider.build.damageParts[0]).toMatchObject({ number: 1, denomination: 8, types: ["radiant"] });
    expect(rider.overrides.noConsumeTargets).toBe(true);
    expect(field.overrides.addItemConsume).toBe(true);
    expect(field.build.targetOverride.template).toMatchObject({ type: "square", size: "25" });
  });
});

describe("family names reach their shared enricher", () => {
  function resolve(name: string): string | null {
    const enricher = new DDBItemEnricher({ activityGenerator: null as any }) as any;
    enricher.name = name;
    enricher.is2014 = false;
    enricher.isCustomAction = false;
    enricher.ddbParser = { ddbDefinition: { isHomebrew: false } };
    enricher._getNameHint();
    return enricher._loadEnricherData()?.constructor?.name ?? null;
  }

  it.each([
    ["Shovel of Yorgrim", "ShovelOfYorgrim"],
    ["Shovel of Yorgrim, +1", "ShovelOfYorgrim"],
    ["Shovel of Yorgrim, +3", "ShovelOfYorgrim"],
    ["Haemscale", "Haemscale"],
    ["Haemscale Chain Mail (Rare)", "Haemscale"],
    ["Haemscale Breastplate(Legendary)", "Haemscale"],
    ["Longsword of Grass", "WeaponOfGrass"],
    ["Blade of Grass", "WeaponOfGrass"],
    ["Visage of the Old Ways, +6", "VisageOfTheOldWays"],
    ["Davy Jones's Key", "DavyJonessKey"],
    ["H'rethi Soul Scepter", "HrethiSoulScepter"],
    ["Knight's Standard of Valor", "KnightsStandardOfValor"],
    // not lockable in the items manifest: a homebrew copy of the same name shadows it there
    ["Staff of Cubic Cultivation", "StaffOfCubicCultivation"],
  ])("%s -> %s", (name, expected) => {
    expect(resolve(name)).toBe(expected);
  });

  it("does not sweep unrelated grass items into the weapon family", () => {
    expect(resolve("Grass Carpet")).toBeNull();
    expect(resolve("Grass Whistle Blade")).toBeNull();
  });
});
