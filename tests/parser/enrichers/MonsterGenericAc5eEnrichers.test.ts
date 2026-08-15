/**
 * Behavioural tests for the generic monster trait AC5e enrichers.
 *
 * The audit harness cannot validate AC5e value strings (they are an opaque DSL
 * to it), so these pin the exact key/value/type emitted per trait. A typo in a
 * sandbox identifier (riderStatuses, opponentActor, skill.prc) fails silently
 * in Foundry, which is exactly why the strings are asserted verbatim here.
 *
 * The vi.mock preamble is copied from GunslingerEnrichers.test.ts (see the
 * rationale there); ChangeHelper is the real module because these enrichers'
 * output is built by it.
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

import MagicResistance from "../../../src/parser/enrichers/monster/Generic/MagicResistance";
import KeenSenses from "../../../src/parser/enrichers/monster/Generic/KeenSenses";
import SunlightSensitivity from "../../../src/parser/enrichers/monster/Generic/SunlightSensitivity";
import FeyAncestry from "../../../src/parser/enrichers/monster/Generic/FeyAncestry";
import DwarvenResilience from "../../../src/parser/enrichers/monster/Generic/DwarvenResilience";
import Brave from "../../../src/parser/enrichers/monster/Generic/Brave";
import DarkDevotion from "../../../src/parser/enrichers/monster/Generic/DarkDevotion";
import MentalFortitude from "../../../src/parser/enrichers/monster/Generic/MentalFortitude";
import TwoHeads from "../../../src/parser/enrichers/monster/Generic/TwoHeads";
import Camouflage from "../../../src/parser/enrichers/monster/Generic/Camouflage";
import ImprovedCritical from "../../../src/parser/enrichers/monster/Generic/ImprovedCritical";
import BloodFrenzy from "../../../src/parser/enrichers/monster/Generic/BloodFrenzy";
import Grappler from "../../../src/parser/enrichers/monster/Generic/Grappler";
import { makeEnricherData } from "../../_fixtures/ddb/factories";

type TEnricher = new (options: any) => any;

function effectsFor(Enricher: TEnricher, name: string): any[] {
  return makeEnricherData(Enricher, { name, actions: null }).effects;
}

function ac5eChangesFor(Enricher: TEnricher, name: string): any[] {
  return effectsFor(Enricher, name).flatMap((hint: any) => hint.ac5eChanges ?? []);
}

describe("Monster generic AC5e trait enrichers", () => {
  it("Magic Resistance pairs a midi twin with an ac5e save advantage", () => {
    const effects = effectsFor(MagicResistance, "Magic Resistance");
    expect(effects).toHaveLength(2);
    const [midi, ac5e] = effects;
    expect(midi.midiOnly).toBe(true);
    expect(midi.midiChanges[0].key).toBe("flags.midi-qol.magicResistance.all");
    expect(ac5e.ac5eOnly).toBe(true);
    expect(ac5e.midiNever).toBe(true);
    expect(ac5e.options.transfer).toBe(true);
    expect(ac5e.ac5eChanges[0]).toMatchObject({
      key: "flags.automated-conditions-5e.save.advantage",
      value: "isSpell || isMagical",
      type: "ac5e",
    });
  });

  it("Keen senses variants grant Perception advantage, unrelated Keen traits do not", () => {
    for (const name of ["Keen Smell", "Keen Hearing and Smell", "Keen Sight", "Keen Senses"]) {
      const changes = ac5eChangesFor(KeenSenses, name);
      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        key: "flags.automated-conditions-5e.skill.advantage",
        value: "skill.prc",
      });
    }
    expect(effectsFor(KeenSenses, "Keen Mind")).toHaveLength(0);
  });

  it("Sunlight Sensitivity family emits disabled toggles with the right scope", () => {
    for (const name of ["Sunlight Sensitivity", "Light Sensitivity", "Sunlight Hypersensitivity"]) {
      const effects = effectsFor(SunlightSensitivity, name);
      expect(effects[0].options.disabled).toBe(true);
      const keys = effects[0].ac5eChanges.map((c: any) => c.key);
      expect(keys).toEqual([
        "flags.automated-conditions-5e.attack.disadvantage",
        "flags.automated-conditions-5e.check.disadvantage",
      ]);
    }
    // Sunlight Weakness covers saves too, via the d20 action type
    const weakness = effectsFor(SunlightSensitivity, "Sunlight Weakness");
    expect(weakness[0].ac5eChanges.map((c: any) => c.key)).toEqual([
      "flags.automated-conditions-5e.d20.disadvantage",
    ]);
  });

  it.each([
    [FeyAncestry, "Fey Ancestry", "riderStatuses.charmed"],
    [Brave, "Brave", "riderStatuses.frightened"],
    [DarkDevotion, "Dark Devotion", "riderStatuses.charmed || riderStatuses.frightened"],
    [MentalFortitude, "Mental Fortitude", "riderStatuses.charmed || riderStatuses.frightened"],
    [DwarvenResilience, "Dwarven Resilience", "riderStatuses.poisoned || damageTypes.poison"],
  ] as [TEnricher, string, string][])("%o %s grants conditional save advantage", (Enricher, name, value) => {
    const changes = ac5eChangesFor(Enricher, name);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      key: "flags.automated-conditions-5e.save.advantage",
      value,
      type: "ac5e",
    });
  });

  it("Two Heads adds Perception advantage on top of the condition saves", () => {
    const changes = ac5eChangesFor(TwoHeads, "Two Heads");
    expect(changes).toHaveLength(2);
    expect(changes[0].key).toBe("flags.automated-conditions-5e.save.advantage");
    expect(changes[0].value).toBe(
      "riderStatuses.blinded || riderStatuses.charmed || riderStatuses.deafened"
      + " || riderStatuses.frightened || riderStatuses.stunned || riderStatuses.unconscious",
    );
    expect(changes[1]).toMatchObject({
      key: "flags.automated-conditions-5e.skill.advantage",
      value: "skill.prc",
    });
  });

  it("Camouflage grants a disabled Stealth advantage toggle", () => {
    const effects = effectsFor(Camouflage, "Stone Camouflage");
    expect(effects[0].options.disabled).toBe(true);
    expect(effects[0].ac5eChanges[0]).toMatchObject({
      key: "flags.automated-conditions-5e.skill.advantage",
      value: "skill.ste",
    });
  });

  it("Improved Critical uses the core weapon critical threshold flag", () => {
    const effects = effectsFor(ImprovedCritical, "Improved Critical");
    expect(effects[0].ac5eChanges).toBeUndefined();
    expect(effects[0].changes[0]).toMatchObject({
      key: "flags.dnd5e.weaponCriticalThreshold",
      value: "19",
      type: "downgrade",
    });
  });

  it("Blood Frenzy scopes to melee attacks only when the stat block says melee", () => {
    const hpCondition = "opponentActor.attributes.hp.value < opponentActor.attributes.hp.max";

    const generic = makeEnricherData(BloodFrenzy as TEnricher, { name: "Blood Frenzy", actions: null });
    expect(generic.effects[0].ac5eChanges[0].value).toBe(hpCondition);

    const melee = makeEnricherData(BloodFrenzy as TEnricher, { name: "Blood Frenzy", actions: null });
    melee.document = {
      system: { description: { value: "The shark has advantage on melee attack rolls against any damaged creature." } },
    };
    expect(melee.effects[0].ac5eChanges[0].value).toBe(
      `(actionType.mwak || actionType.msak) && ${hpCondition}`,
    );
  });

  it("Grappler grants attack advantage against grappled targets", () => {
    const changes = ac5eChangesFor(Grappler, "Grappler");
    expect(changes[0]).toMatchObject({
      key: "flags.automated-conditions-5e.attack.advantage",
      value: "opponentActor.statuses.grappled",
    });
  });
});
