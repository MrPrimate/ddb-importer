/**
 * Behavioural tests for the once-per-turn opt-in AC5e damage bonuses on
 * character features. Like MonsterGenericAc5eEnrichers.test.ts, these exist
 * because the audit harness runs module-free and cannot see ac5eOnly hints,
 * and a typo in a sandbox identifier or scale reference fails silently in
 * Foundry. The value strings are pinned verbatim.
 *
 * The vi.mock preamble is copied from GunslingerEnrichers.test.ts (see the
 * rationale there); ChangeHelper is real because it builds the output.
 */
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
  AutoEffects: {},
  EnchantmentEffects: {},
  ChangeHelper: (await vi.importActual<any>("../../../src/parser/enrichers/effects/ChangeHelper")).default,
  EffectGenerator: {},
}));

import DivineStrike from "../../../src/parser/enrichers/class/cleric/DivineStrike";
import BlessedStrikes from "../../../src/parser/enrichers/class/cleric/BlessedStrikes";
import BlessedStrikesDivineStrike from "../../../src/parser/enrichers/class/cleric/BlessedStrikesDivineStrike";
import ElementalFuryPrimalStrike from "../../../src/parser/enrichers/class/druid/ElementalFuryPrimalStrike";
import SneakAttack from "../../../src/parser/enrichers/class/rogue/SneakAttack";
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
    [BlessedStrikes, "bonus=1d8[radiant]; oncePerTurn; optin; actionType.mwak || actionType.rwak || isCantrip"],
    [BlessedStrikesDivineStrike, "bonus=@scale.cleric.divine-strike[necrotic, radiant]; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [ElementalFuryPrimalStrike, "bonus=@scale.druid.elemental-fury[cold, fire, lightning, thunder]; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [DivineFury, "bonus=1d6[necrotic, radiant] + floor(@classes.barbarian.levels / 2); oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [GiantsMight, "bonus=1d6; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [SlayersPrey, "bonus=1d6; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [DreadfulStrikes, "bonus=@scale.fey-wanderer.dreadful-strikes[psychic]; oncePerTurn; optin; actionType.mwak || actionType.rwak"],
    [BodyOfTheAstralSelf, "bonus=@scale.monk.die; oncePerTurn; optin; item.name.includes('Astral')"],
    [ManifestBlowForgedHeart, "bonus=@scale.monk.die; oncePerTurn; optin; item.name.includes('Unarmed')"],
    [FavoredFoe, "bonus=@scale.favored-foe.die; oncePerTurn; optin; hasAttack"],
  ] as [TEnricher, string][])("%o pins its opt-in bonus value", (Enricher, value) => {
    const changes = ac5eChanges(Enricher);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ key: BONUS_KEY, value, type: "ac5e" });
  });

  it("Sneak Attack pins its condition including the nearby-ally fallback", () => {
    const changes = ac5eChanges(SneakAttack);
    expect(changes).toHaveLength(1);
    expect(changes[0].value).toBe(
      "bonus=@scale.rogue.sneak-attack; oncePerTurn; optin; (itemProperties.fin || actionType.rwak)"
      + " && (hasAdvantage || (!hasDisadvantage && checkNearby(opponentId, 'different', 5, {count: (distance <= 5 ? 2 : 1)})))",
    );
    expect(changes[0].hint.midiNever).toBe(true);
    expect(changes[0].hint.ac5eOnly).toBe(true);
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

  it("Favored Foe adds a level-scaled die advancement backing the effect's scale ref", () => {
    const enricher = makeEnricherData(FavoredFoe as TEnricher, { name: "Favored Foe", actions: null });
    const data = enricher.override.data;
    expect(data["system.identifier"]).toBe("favored-foe");
    const advancement = Object.entries(data)
      .find(([key]) => key.startsWith("system.advancement."))?.[1] as any;
    expect(advancement.type).toBe("ScaleValue");
    expect(advancement.configuration.identifier).toBe("die");
    expect(advancement.configuration.scale).toEqual({
      "1": { number: 1, faces: 4 },
      "6": { number: 1, faces: 6 },
      "14": { number: 1, faces: 8 },
    });
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
