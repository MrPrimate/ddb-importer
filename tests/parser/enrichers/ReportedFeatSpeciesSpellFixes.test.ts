/**
 * Pins for a batch of reported feat, species and spell fixes. The AC5e strings are invisible to
 * the audit harness (it runs module-free, so ac5eChanges audit as empty), and Shifting's
 * enchantment wiring only shows up in a live import.
 */
const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

vi.mock("../../../src/lib/_module", async () => ({
  logger: loggerMock,
  utils: (await vi.importActual<any>("../../../src/lib/Utils")).default,
}));
vi.mock("../../../src/parser/spells/CharacterSpellFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/lib/_module", () => ({
  DDBDataUtils: {
    findSubClassByFeatureId: vi.fn(),
    classIdentifierName: (name: string) => name,
    getLimitedUses: vi.fn(),
  },
  DDBTemplateStrings: {
    parse: vi.fn((_ddb: any, _raw: any, text: string) => ({ text })),
  },
}));
vi.mock("../../../src/parser/enrichers/effects/_module", async () => ({
  AutoEffects: { effectModules: () => ({ ac5eInstalled: false }) },
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  EffectGenerator: {},
}));

import Opportunist from "../../../src/parser/enrichers/feat/Opportunist";
import MobileCombatant from "../../../src/parser/enrichers/feat/MobileCombatant";
import TavernBrawler from "../../../src/parser/enrichers/feat/TavernBrawler";
import AstralSpark from "../../../src/parser/enrichers/trait/giff/AstralSpark";
import GemFlight from "../../../src/parser/enrichers/trait/dragonborn/GemFlight";
import Shifting from "../../../src/parser/enrichers/trait/shifter/Shifting";
import SpinyShield from "../../../src/parser/enrichers/spell/SpinyShield";
import Darkbolt from "../../../src/parser/enrichers/spell/Darkbolt";
import DragonsBreath from "../../../src/parser/enrichers/spell/DragonsBreath";
import { TRAIT_REQUIRED_LEVELS } from "../../../src/config/dictionary/parsing/features";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

function enricher(Enricher: TEnricher, options: any = {}): any {
  return makeEnricherData(Enricher, { name: "Test", actions: null, ...options });
}

function ac5eChanges(Enricher: TEnricher, options: any = {}): any[] {
  return (enricher(Enricher, options).effects as any[]).flatMap((hint: any) => hint.ac5eChanges ?? []);
}

function shifting(chosen: string | null, isLegacy = false): any {
  return enricher(Shifting, {
    name: "Shifting",
    actions: {},
    ddbParser: {
      _chosen: chosen ? [{ label: chosen }] : [],
      ddbCharacter: { _ddbRace: { fullName: "Shifter", isLegacy } },
    },
  });
}

describe("reported feat fixes", () => {
  it("Opportunist offers +2 attack and damage opt-ins", () => {
    const changes = ac5eChanges(Opportunist);
    expect(changes.map((c) => c.key)).toEqual([
      "flags.automated-conditions-5e.attack.bonus",
      "flags.automated-conditions-5e.damage.bonus",
    ]);
    for (const change of changes) {
      expect(change.value).toMatch(/^bonus=2; optin; optinId=opportunist-/);
    }
  });

  it("Mobile Combatant is an activity whose speed effect ends with the turn", () => {
    const data = enricher(MobileCombatant);
    expect(data.clearAutoEffects).toBe(true);
    expect(data.activity.name).toBe("Slippery");
    const [effect] = data.effects;
    expect(effect.options.expiry).toBe("turnEnd");
    expect(effect.changes[0].key).toBe("system.attributes.movement.speeds.walk");
  });

  it("Tavern Brawler rerolls unarmed damage 1s in 2024 only", () => {
    expect(ac5eChanges(TavernBrawler)).toEqual([
      expect.objectContaining({ key: "flags.automated-conditions-5e.damage.modifier", value: "modifier=r1; unarmed" }),
    ]);
    expect(ac5eChanges(TavernBrawler, { is2014: true })).toEqual([]);
  });
});

describe("reported species fixes", () => {
  it("Astral Spark spends its own uses without naming an item id", () => {
    const [change] = ac5eChanges(AstralSpark);
    expect(change.key).toBe("flags.automated-conditions-5e.damage.bonus");
    // usesCount=origin finds nothing live: imported transfer effects carry no origin
    expect(change.value).toContain("usesCount=Item.astral-spark;");
    expect(change.value).toContain("oncePerTurn");
  });

  it("Gem Flight gives a 1 minute fly speed and is gated to level 5", () => {
    const data = enricher(GemFlight);
    expect(data.activity.activationType).toBe("bonus");
    expect(data.effects[0].options.durationSeconds).toBe(60);
    expect(data.effects[0].changes.map((c: any) => c.key)).toContain("system.attributes.movement.speeds.fly");
    expect(TRAIT_REQUIRED_LEVELS["Gem Flight"]).toBe(5);
  });

  it("Shifting's type enchantments last 1 minute and its uses recover on a long rest", () => {
    const data = shifting("Beasthide");
    expect(data.activity.name).toBe("Shift");
    expect(data.activity.activationType).toBe("bonus");
    expect(data.activity.addItemConsume).toBe(true);
    const enchant = data.effects.find((e: any) => e.type === "enchant");
    expect(enchant.name).toBe("Type: Beasthide");
    expect(enchant.activityMatch).toBe("Shift");
    expect(enchant.options.durationSeconds).toBe(60);
    expect(data.override.uses.recovery).toEqual([expect.objectContaining({ period: "lr", type: "recoverAll" })]);
    expect(data.override.data.flags).toBeUndefined();
  });

  it("Shifting only builds the chosen type, so no stray Shifted effect applies passively", () => {
    const chosen = shifting("Longtooth");
    expect(chosen.effects.map((e: any) => e.name)).toEqual(["Type: Longtooth", "Shifted: Longtooth"]);
    expect(chosen.additionalActivities.map((a: any) => a.init?.name)).toEqual(["Shift Longtooth", "Longtooth Attack"]);
    expect(shifting(null).effects).toHaveLength(8);
  });
});

describe("reported spell fixes", () => {
  it("Spiny Shield casts a self shield and keeps the damage reaction free", () => {
    const data = enricher(SpinyShield, { name: "Spiny Shield" });
    expect(data.activity.name).toBe("Shield");
    const [damage] = data.additionalActivities;
    expect(damage.init.name).toBe("Damage");
    expect(damage.build.noSpellslot).toBe(true);
    const [effect] = data.effects;
    expect(effect.activityMatch).toBe("Shield");
    expect(effect.options.expiry).toBe("sourceStart");
    expect(effect.ac5eChanges[0]).toEqual(expect.objectContaining({
      key: "flags.automated-conditions-5e.grants.attack.bonus",
      value: "bonus=-2; actionType.rwak || actionType.rsak",
    }));
  });

  it("Darkbolt attacks for damage and saves only for the reaction lock", () => {
    const data = enricher(Darkbolt, { name: "Darkbolt" });
    expect(data.type).toBe("attack");
    expect(data.activity.data.damage.parts).toHaveLength(1);
    const [save] = data.additionalActivities;
    expect(save.init.type).toBe("save");
    expect(save.build.generateDamage).toBe(false);
    const [effect] = data.effects;
    expect(effect.activityMatch).toBe(save.init.name);
    expect(effect.options.expiry).toBe("targetStart");
  });

  it("Dragon's Breath marks the touched creature for 1 minute", () => {
    const [effect] = enricher(DragonsBreath, { name: "Dragon's Breath" }).effects;
    expect(effect.activityMatch).toBe("Cast");
    expect(effect.options.durationSeconds).toBe(60);
  });
});
