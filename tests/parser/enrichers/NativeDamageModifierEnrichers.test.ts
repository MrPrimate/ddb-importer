import ElementalAdept from "../../../src/parser/enrichers/feat/ElementalAdept";
import SavageAttacker from "../../../src/parser/enrichers/feat/SavageAttacker";
import GreatWeaponMaster from "../../../src/parser/enrichers/feat/GreatWeaponMaster";
import Feed from "../../../src/parser/enrichers/class/kindred/Feed";
import RiteOfTheFlame from "../../../src/parser/enrichers/class/blood-hunter/RiteOfTheFlame";
import RiteOfTheFrozen from "../../../src/parser/enrichers/class/blood-hunter/RiteOfTheFrozen";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

/**
 * dnd5e 6 rule changes cannot alter a die result, so die modifiers are persisted on the damage
 * data (or the roll formula) at parse time, with an AC5e-only twin where AC5e can do it at roll
 * time. The audit worksheets cannot see AC5e change data, so the value strings are pinned here.
 */
describe("Elemental Adept", () => {
  it("scopes the AC5e min2 to the chosen damage type", () => {
    const enricher = makeEnricherData(ElementalAdept, {
      name: "Elemental Adept",
      ddbParser: { _chosen: [{ label: "Charisma Score" }, { label: "Fire" }] },
    });
    const [effect, ...rest] = enricher.effects;
    expect(rest).toHaveLength(0);
    expect(effect.ac5eOnly).toBe(true);
    expect(effect.ac5eChanges).toEqual([
      expect.objectContaining({
        key: "flags.automated-conditions-5e.damage.modifier",
        value: "modifier=min2;isSpell && damageTypes.fire",
      }),
    ]);
  });

  it("reads the type from a typed feat name", () => {
    const enricher = makeEnricherData(ElementalAdept, { name: "Elemental Adept (Cold)", is2014: true });
    expect(enricher.adeptTypes).toEqual(["cold"]);
  });

  it("falls back to the character's feat options", () => {
    const enricher = makeEnricherData(ElementalAdept, {
      name: "Elemental Adept",
      character: {
        feats: [{ definition: { id: 77, name: "Elemental Adept" } }],
        options: { race: [], class: [], feat: [{ componentId: 77, definition: { name: "Thunder" } }] },
      },
    });
    expect(enricher.adeptTypes).toEqual(["thunder"]);
  });

  it("ships no effect when no type can be resolved", () => {
    expect(makeEnricherData(ElementalAdept, { name: "Elemental Adept" }).effects).toEqual([]);
  });
});

describe("Savage Attacker", () => {
  // AC5e's damage `adv` keeps the best set per dice term, which overstates "use either total" as
  // soon as a second dice term rides in the base roll, so only the midi opt-in is emitted
  it.each([false, true])("ships no AC5e damage advantage (2014: %s)", (is2014) => {
    const effects = makeEnricherData(SavageAttacker, { name: "Savage Attacker", is2014 }).effects;
    expect(effects).toHaveLength(1);
    expect(effects[0].midiOnly).toBe(true);
    expect(effects[0].ac5eChanges).toBeUndefined();
  });
});

describe("Great Weapon Master 2014", () => {
  it("trades -5 to hit for +10 damage as rules scoped to heavy melee weapon attacks", () => {
    const [effect] = makeEnricherData(GreatWeaponMaster, { name: "Great Weapon Master", is2014: true }).effects;
    expect(effect.options).toMatchObject({ transfer: true, disabled: true });
    // ChangeHelper serialises the filter list, as dnd5e stores `conditions` as a JSON string
    const conditions = [
      { k: "roll.attack.classification", o: "exact", v: "weapon" },
      { k: "roll.attack.type", o: "exact", v: "melee" },
      { k: "item.properties", o: "has", v: "hvy" },
    ];
    const changes = effect.changes ?? [];
    expect(changes).toHaveLength(2);
    expect(changes[0]).toMatchObject({ key: "attack", type: "dnd5e.bonus", value: "-5" });
    expect(changes[1]).toMatchObject({ key: "damage", type: "dnd5e.bonus", value: "10" });
    for (const change of changes) {
      expect(JSON.parse(String(change.conditions))).toEqual(conditions);
    }
  });
});

describe("Feed with Boon of Generations", () => {
  function rollFormula(activity: IDDBActivityData): string | undefined {
    return (activity.data as Partial<I5eUtilityActivity> | undefined)?.roll?.formula;
  }

  it("rolls the plain Feed Dice scale without the boon", () => {
    const activity = makeEnricherData(Feed, { name: "Feed" }).activity;
    expect(rollFormula(activity)).toBe("@scale.kindred.feed");
  });

  it("rerolls 1s on the Feed Dice with the boon", () => {
    const activity = makeEnricherData(Feed, {
      name: "Feed",
      character: { feats: [{ definition: { id: 1, name: "Boon of Generations" } }] },
    }).activity;
    expect(rollFormula(activity)).toBe("(@scale.kindred.feed.number)d(@scale.kindred.feed.faces)r1");
  });
});

describe("Rite of the Flame with Rite Focus: The Fiend", () => {
  const fiend = { options: { race: [], feat: [], class: [{ componentId: 5, definition: { name: "The Fiend" } }] } };

  function partsChange(effect: IDDBEffectHint) {
    return (effect.changes ?? []).find((change) => change.key === "system.damage.parts");
  }

  it("keeps the legacy formula pair without the patron", () => {
    const [effect] = makeEnricherData(RiteOfTheFlame, { name: "Rite of the Flame", is2014: true }).effects;
    expect(partsChange(effect)?.value)
      .toBe(`[["@scale.blood-hunter.crimson-rite.die[fire]", "fire"]]`);
  });

  it("carries r<=2 as a DamageData modifier on a literal die term with the patron", () => {
    const [effect] = makeEnricherData(RiteOfTheFlame, { name: "Rite of the Flame", is2014: true, character: fiend }).effects;
    expect(JSON.parse(String(partsChange(effect)?.value))).toEqual({
      custom: { enabled: true, formula: "1d(@scale.blood-hunter.crimson-rite.faces)" },
      types: ["fire"],
      modifiers: ["r<=2"],
    });
  });

  it("leaves the other rites alone", () => {
    const [effect] = makeEnricherData(RiteOfTheFrozen, { name: "Rite of the Frozen", is2014: true, character: fiend }).effects;
    expect(partsChange(effect)?.value)
      .toBe(`[["@scale.blood-hunter.crimson-rite.die[cold]", "cold"]]`);
  });
});
