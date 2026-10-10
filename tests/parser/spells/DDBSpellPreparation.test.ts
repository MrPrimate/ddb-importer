/**
 * Class preparation modes by ruleset. The 2024 Bard, Sorcerer and Warlock prepare spells (DDB
 * flags their picks countsAsKnownSpell, which CharacterSpellFactory turns into prepared), while
 * the 2014 printings keep their known spells always prepared.
 */
import DDBSpell from "../../../src/parser/spells/DDBSpell";
import { SPELL } from "../../../src/config/dictionary/spell/spell";

const STATES = () => CONFIG.DND5E.spellPreparationStates;

function prepare(spellClass: string, is2014Class: boolean, prepared: boolean, pactSpellsPrepared = true): any {
  const mock = Object.assign(Object.create(DDBSpell.prototype), {
    spellClass,
    is2014Class,
    isCantrip: false,
    unPreparedCantrip: false,
    pactSpellsPrepared,
    spellData: { prepared, usesSpellSlot: true, alwaysPrepared: false, ritualCastingType: null },
    data: { system: { method: "spell" } },
    classPrepMode: SPELL.preparationModes.find((p) =>
      p.name === spellClass && (!p.version || p.version === (is2014Class ? "2014" : "2024"))),
  });
  mock._generateClassPreparationMode();
  return mock.data.system;
}

describe("DDBSpell.prototype._generateClassPreparationMode", () => {
  it.each(["Bard", "Sorcerer", "Warlock"])("a 2024 %s prepares its chosen spells", (spellClass) => {
    expect(prepare(spellClass, false, true).prepared).toBe(STATES().prepared.value);
    expect(prepare(spellClass, false, false).prepared).toBe(STATES().unprepared.value);
  });

  it.each(["Bard", "Sorcerer", "Warlock"])("a 2014 %s keeps its known spells always prepared", (spellClass) => {
    expect(prepare(spellClass, true, false).prepared).toBe(STATES().always.value);
  });

  it("only forces pact spells always prepared for the 2014 Warlock", () => {
    expect(prepare("Warlock", false, true)).toEqual(expect.objectContaining({ method: "pact", prepared: STATES().prepared.value }));
    expect(prepare("Warlock", true, true)).toEqual(expect.objectContaining({ method: "pact", prepared: STATES().always.value }));
  });
});
