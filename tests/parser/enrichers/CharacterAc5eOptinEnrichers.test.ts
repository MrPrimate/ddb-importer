/**
 * Behavioural tests for the once-per-turn opt-in AC5e damage bonuses on
 * character features, plus the Healer feat's inverse gate (native dnd5e 6 die
 * modifiers emitted only when AC5e is absent). Like MonsterGenericAc5eEnrichers.test.ts, these exist
 * because the audit harness runs module-free and cannot see ac5eOnly hints,
 * and a typo in a sandbox identifier or scale reference fails silently in
 * Foundry. The value strings are pinned verbatim.
 *
 * The vi.mock preamble is copied from GunslingerEnrichers.test.ts (see the
 * rationale there); ChangeHelper is real because it builds the output.
 */
// Healer reads AutoEffects.effectModules() to decide whether AC5e already covers the reroll
const effectModulesMock = vi.hoisted(() => ({ ac5eInstalled: false }));

const loggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
}));

vi.mock("../../../src/lib/_module", () => ({ logger: loggerMock, utils: { capitalize: (s: string) => s } }));
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
  AutoEffects: { effectModules: () => effectModulesMock },
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  EffectGenerator: {},
}));

import DivineStrike from "../../../src/parser/enrichers/class/cleric/DivineStrike";
import BlessedStrikes from "../../../src/parser/enrichers/class/cleric/BlessedStrikes";
import BlessedStrikesDivineStrike from "../../../src/parser/enrichers/class/cleric/BlessedStrikesDivineStrike";
import ElementalFuryPrimalStrike from "../../../src/parser/enrichers/class/druid/ElementalFuryPrimalStrike";
import DivineFury from "../../../src/parser/enrichers/class/barbarian/DivineFury";
import GiantsMight from "../../../src/parser/enrichers/class/fighter/GiantsMight";
import GeniesVessel from "../../../src/parser/enrichers/class/warlock/GeniesVessel";
import HuntersPrey from "../../../src/parser/enrichers/class/ranger/HuntersPrey";
import SlayersPrey from "../../../src/parser/enrichers/class/ranger/SlayersPrey";
import OmenOfDoom from "../../../src/parser/enrichers/class/ranger/OmenOfDoom";
import DreadfulStrikes from "../../../src/parser/enrichers/class/ranger/DreadfulStrikes";
import BodyOfTheAstralSelf from "../../../src/parser/enrichers/class/monk/BodyOfTheAstralSelf";
import ManifestBlowForgedHeart from "../../../src/parser/enrichers/class/monk/ManifestBlowForgedHeart";
import FavoredFoe from "../../../src/parser/enrichers/class/ranger/FavoredFoe";
import MonsterKill from "../../../src/parser/enrichers/class/fighter/MonsterKill";
import SchoolOfHardKnocks from "../../../src/parser/enrichers/class/pugilist/SchoolOfHardKnocks";
import CrownOfHorns from "../../../src/parser/enrichers/class/warlock/CrownOfHorns";
import ApexPredator from "../../../src/parser/enrichers/class/druid/ApexPredator";
import LunarForm from "../../../src/parser/enrichers/class/druid/LunarForm";
import OakAndThorn from "../../../src/parser/enrichers/class/druid/OakAndThorn";
import AgentOfOrder from "../../../src/parser/enrichers/feat/AgentOfOrder";
import Healer from "../../../src/parser/enrichers/feat/Healer";
import EldritchSmite from "../../../src/parser/enrichers/class/warlock/EldritchSmite";
import EldritchHeads from "../../../src/parser/enrichers/class/warlock/EldritchHeads";
import HandOfHarm from "../../../src/parser/enrichers/class/monk/HandOfHarm";
import ChromaticAffinity from "../../../src/parser/enrichers/class/cleric/ChromaticAffinity";
import AngelMask from "../../../src/parser/enrichers/class/bard/AngelMask";
import PowerSurge from "../../../src/parser/enrichers/class/wizard/PowerSurge";
import AggressiveDefense from "../../../src/parser/enrichers/class/fighter/AggressiveDefense";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

// the core roll-mode helpers (advantageAbilitySaveChange etc.) read CONFIG.Dice.D20Roll.ADV_MODE
beforeAll(() => {
  installActivityConfigStubs();
});

type TEnricher = new (options: any) => any;

const BONUS_KEY = "flags.automated-conditions-5e.damage.bonus";

function ac5eChanges(Enricher: TEnricher, options: any = {}): any[] {
  const enricher = makeEnricherData(Enricher, { name: "Test", actions: null, ...options });
  return (enricher.effects as any[]).flatMap((hint: any) => (hint.ac5eChanges ?? []).map((c: any) => ({ hint, ...c })));
}

describe("Once-per-turn opt-in AC5e damage bonuses", () => {
  it.each([
    [DivineStrike, "bonus=@scale.order.divine-strike[psychic]; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [BlessedStrikes, "bonus=1d8[radiant]; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [BlessedStrikesDivineStrike, "bonus=@scale.cleric.divine-strike[necrotic, radiant]; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [ElementalFuryPrimalStrike, "bonus=@scale.druid.elemental-fury[cold, fire, lightning, thunder]; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [DivineFury, "bonus=1d6[necrotic, radiant] + floor(@classes.barbarian.levels / 2); oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [GiantsMight, "bonus=1d6; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [SlayersPrey, "bonus=1d6; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [DreadfulStrikes, "bonus=@scale.fey-wanderer.dreadful-strikes[psychic]; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [BodyOfTheAstralSelf, "bonus=@scale.monk.die; oncePerTurn; optin; item.name.includes('Astral')"],
    [ManifestBlowForgedHeart, "bonus=@scale.monk.die; oncePerTurn; optin; item.name.includes('Unarmed')"],
    [FavoredFoe, "bonus=@scale.favored-foe.die; oncePerTurn; optin; hasAttack"],
    [SchoolOfHardKnocks, "bonus=1d12; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [ApexPredator, "bonus=2d10[force]; oncePerTurn; optin"],
    [LunarForm, "bonus=2d10[radiant]; oncePerTurn; optin"],
    [OakAndThorn, "bonus=1d6[piercing]; oncePerTurn; optin; actionType.mwak"],
    [AgentOfOrder, "bonus=1d8[force]; oncePerTurn; optin"],
    // Tier 3: resource-consuming opt-ins (usesCount grammar)
    [EldritchSmite, "bonus=(1 + @spells.pact.level)d8[force]; usesCount=spells.pact; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [EldritchHeads, "bonus=(1 + @prof)[psychic]; usesCount=origin; oncePerTurn; optin; hasAttack"],
    [HandOfHarm, "bonus=(@scale.monk.die + @abilities.wis.mod)[necrotic]; usesCount=Item.monks-focus; oncePerTurn; optin; item.name.includes('Unarmed')"],
    [ChromaticAffinity, "bonus=@classes.cleric.levels; usesCount=origin; oncePerTurn; optin"],
    [AngelMask, "bonus=@scale.bard.inspiration[radiant]; usesCount=Item.bardic-inspiration; oncePerTurn; optin"],
    [PowerSurge, "bonus=floor(@classes.wizard.levels / 2)[force]; usesCount=origin; oncePerTurn; optin; isSpell && item.classIdentifier === 'wizard'"],
    [AggressiveDefense, "bonus=(bonusScale); usesCount=hptemp,{min:1,max:floor(rollingActor.classes.fighter.levels / 2),step:1}; oncePerTurn; optin; actionType.mwak"],
  ] as [TEnricher, string][])("%o pins its opt-in bonus value", (Enricher, value) => {
    const changes = ac5eChanges(Enricher);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ key: BONUS_KEY, value, mode: 5 /* OVERRIDE: this branch emits numeric change modes */ });
  });

  it("Genie's Wrath types the bonus by patron and skips the base vessel", () => {
    for (const [patron, type] of [["Dao", "bludgeoning"], ["Djinni", "thunder"], ["Efreeti", "fire"], ["Marid", "cold"]]) {
      const changes = ac5eChanges(GeniesVessel, { ddbParser: { originalName: `Genie's Wrath (${patron})`, data: {} } });
      expect(changes).toHaveLength(1);
      expect(changes[0].value).toBe(`bonus=@prof[${type}]; oncePerTurn; optin; hasAttack`);
    }
    expect(ac5eChanges(GeniesVessel, { ddbParser: { originalName: "Genie's Vessel", data: {} } })).toHaveLength(0);
  });

  it("Colossus Slayer rides the choice-tracking effect with the HP condition", () => {
    const changes = ac5eChanges(HuntersPrey);
    expect(changes).toHaveLength(1);
    expect(changes[0].hint.name).toBe("Colossus Slayer");
    expect(changes[0].value).toBe(
      "bonus=1d8; oncePerTurn; optin; (actionType.mwak || actionType.rwak)"
      + " && opponentActor.attributes.hp.value < opponentActor.attributes.hp.max",
    );
  });

  it("Monster Kill gates on the listed creature types via the opponent creatureType array", () => {
    const changes = ac5eChanges(MonsterKill, { name: "Monster Kill" });
    expect(changes).toHaveLength(1);
    expect(changes[0].value).toBe(
      "bonus=1d10; oncePerTurn; optin; (actionType.mwak || actionType.rwak) && ("
      + "opponentActor.creatureType.includes('aberration') || opponentActor.creatureType.includes('dragon')"
      + " || opponentActor.creatureType.includes('fey') || opponentActor.creatureType.includes('fiend')"
      + " || opponentActor.creatureType.includes('monstrosity') || opponentActor.creatureType.includes('ooze')"
      + " || opponentActor.creatureType.includes('undead'))",
    );
  });

  it("Crown of Horns builds the form once, with activities applying its effects", () => {
    const enricher = makeEnricherData(CrownOfHorns as TEnricher, { name: "Crown of Horns", actions: null });
    expect(enricher.activity.name).toBe("Manifest Crown of Horns");
    expect(enricher.additionalActivities.map((a: any) => a.init.name)).toEqual([
      "King of All: Aura Save",
      "Spend Pact Slot to Restore Use",
    ]);
    // the restore activity refunds an item use while consuming a pact slot
    const restore = enricher.additionalActivities[1].build.consumptionOverride.targets;
    expect(restore).toEqual([
      { type: "itemUses", target: "", value: -1, scaling: { mode: "", formula: "" } },
      { type: "attribute", value: "1", target: "spells.pact.value" },
    ]);
    expect(enricher.clearAutoEffects).toBe(true);
    expect(enricher.override.uses.max).toBe("1");

    const effects = enricher.effects as any[];
    expect(effects.map((e) => [e.name, e.activityMatch])).toEqual([
      ["Crown of Horns: Dark Heart", "Manifest Crown of Horns"],
      ["King of All: Enticement", "King of All: Aura Save"],
      ["King of All: Wickedness", "King of All: Aura Save"],
      ["King of All: Terror", "King of All: Aura Save"],
    ]);
    expect(effects[0].ac5eChanges[0]).toMatchObject({
      key: "flags.automated-conditions-5e.damage.bonus",
      value: "bonus=1d8[necrotic]; oncePerTurn",
    });
    expect(effects[2].ac5eChanges.map((c: any) => c.key)).toEqual([
      "flags.automated-conditions-5e.attack.disadvantage",
      "flags.automated-conditions-5e.check.disadvantage",
    ]);

    // the Dark Heart alias entry builds nothing
    const alias = makeEnricherData(CrownOfHorns as TEnricher, { name: "Dark Heart", actions: null });
    expect(alias.effects).toHaveLength(0);
    expect(alias.additionalActivities).toHaveLength(0);
    expect(alias.activity).toBeNull();
  });

  it("Favored Foe adds a level-scaled die advancement backing the effect's scale ref", () => {
    const enricher = makeEnricherData(FavoredFoe as TEnricher, { name: "Favored Foe", actions: null });
    const data = enricher.override.data;
    expect(data["system.identifier"]).toBe("favored-foe");
    expect(Array.isArray(data["system.advancement"])).toBe(true);
    const advancement = data["system.advancement"][0];
    expect(advancement.type).toBe("ScaleValue");
    expect(advancement.configuration.identifier).toBe("die");
    expect(advancement.configuration.scale).toEqual({
      "1": { number: 1, faces: 4 },
      "6": { number: 1, faces: 6 },
      "14": { number: 1, faces: 8 },
    });
  });

  it("Favored Foe preserves other advancements and keeps one damage scale when enriched again", () => {
    const existing = { _id: "other", type: "ScaleValue", configuration: { identifier: "uses" } };
    const document = { system: { advancement: [existing] } };
    const enricher = makeEnricherData(FavoredFoe as TEnricher, { name: "Favored Foe", data: document });
    document.system.advancement = enricher.override.data["system.advancement"];
    const result = enricher.override.data["system.advancement"];
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(existing);
    expect(result[1].configuration.identifier).toBe("die");
  });

  it("Omen of Doom grants origin-scoped bonus damage from the Doomed effect", () => {
    const changes = ac5eChanges(OmenOfDoom);
    expect(changes).toHaveLength(1);
    expect(changes[0].hint.name).toBe("Doomed");
    expect(changes[0]).toMatchObject({
      key: "flags.automated-conditions-5e.grants.damage.bonus",
      value: "bonus=1d6[necrotic]; oncePerTurn; effectOriginTokenId === tokenId && hasAttack",
    });
  });
});

describe("Healer feat healing die rerolls", () => {
  afterEach(() => {
    effectModulesMock.ac5eInstalled = false;
  });

  function healingModifiers(is2014: boolean): (string[] | undefined)[] {
    const enricher = makeEnricherData(Healer, { name: "Healer", actions: null, is2014 });
    return (enricher.additionalActivities as any[]).map((a) => a.build.healingPart.modifiers);
  }

  it("emits nothing for the 2014 feat, which has no reroll", () => {
    expect(healingModifiers(true)).toEqual([]);
  });
});
