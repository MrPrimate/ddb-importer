import utils from "../../utils.js";

let getAlternativeFormula = (data) => {
  // this might be specificially for Toll the Dead only, but it's better than nothing

  let description = data.definition.description;
  let match = description.match(/instead[\w\s]+(\d+d\d+) (\w+) damage/);
  if (match) {
    return match[1];
  } else {
    return "";
  }
};

export function getDamage(data, spell) {
  let result = {
    parts: [],
    versatile: "",
  };

  const globalDamageHints = game.settings.get("ddb-importer", "use-damage-hints");
  const damageRestrictionHints = game.settings.get("ddb-importer", "add-damage-restrictions-to-hints");
  const hintOrRestriction = globalDamageHints || damageRestrictionHints;

  // damage
  const attacks = data.definition.modifiers.filter((mod) => mod.type === "damage");
  if (attacks.length !== 0) {
    const cantripBoost = data.definition.level === 0 && !!data.flags.ddbimporter.dndbeyond.cantripBoost;
    attacks.forEach((attack) => {
      const restriction = damageRestrictionHints && attack.restriction && attack.restriction !== "" ? attack.restriction : "";
      const hintAndRestriction = globalDamageHints && restriction !== "" ? " - " : "";
      const damageHint = globalDamageHints ? attack.subType : "";
      const damageTag = hintOrRestriction ? `[${damageHint}${hintAndRestriction}${restriction}]` : "";
      const addMod = attack.usePrimaryStat || cantripBoost ? " + @mod" : "";
      let diceString = utils.parseDiceString(attack.die.diceString, addMod, damageTag).diceString;
      result.parts.push([diceString, attack.subType]);
    });

    // This is probably just for Toll the dead.
    const alternativeFormula = getAlternativeFormula(data);
    result.versatile = cantripBoost ? `${alternativeFormula} + @mod` : alternativeFormula;
    return result;
  }

  // healing
  const heals = data.definition.modifiers.filter((mod) => mod.type === "bonus" && mod.subType === "hit-points");
  if (heals.length !== 0) {
    const healingBonus = (spell.flags.ddbimporter.dndbeyond.healingBoost) ? ` + ${spell.flags.ddbimporter.dndbeyond.healingBoost} + @item.level` : "";
    heals.forEach((heal) => {
      const restriction = damageRestrictionHints && heal.restriction && heal.restriction !== "" ? heal.restriction : "";
      const hintAndRestriction = globalDamageHints && restriction !== "" ? " - " : "";
      const damageHint = globalDamageHints ? "healing" : "";
      const damageTag = hintOrRestriction ? `[${damageHint}${hintAndRestriction}${restriction}]` : "";
      const healValue = (heal.die.diceString) ? `${heal.die.diceString}${damageTag}` : heal.die.fixedValue;
      const diceString = heal.usePrimaryStat
        ? `${healValue} + @mod${healingBonus}`
        : `${healValue}${healingBonus}`;
      result.parts.push([diceString, "healing"]);
    });
    return result;
  }
  return result;
}
