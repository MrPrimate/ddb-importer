/**
 * Fortune Rogue (OTFY) shared pieces. A Luck check is a Charisma check with Expertise that nothing
 * can alter, so it is a plain roll rather than a dnd5e ability check (which effects would modify).
 */
export const LUCK_CHECK_FORMULA = "1d20 + @abilities.cha.mod + (2 * @prof)";

/**
 * The Fortune Dice pool lives on Beyond Coincidence, so the other Fortune Rogue features spend it
 * by identifier (dnd5e resolves bare identifiers through actor.identifiedItems; names do not resolve).
 */
export function fortuneDieConsumption(value = "1"): I5eConsumptionTarget {
  return {
    type: "itemUses",
    target: "beyond-coincidence",
    value,
    scaling: { mode: "", formula: "" },
  };
}

export function luckCheckRoll(name = "Luck Check"): Partial<I5eActivity> {
  return {
    roll: { prompt: false, visible: true, formula: LUCK_CHECK_FORMULA, name },
  } as Partial<I5eActivity>;
}
