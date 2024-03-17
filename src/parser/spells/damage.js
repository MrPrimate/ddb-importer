import utils from "../../lib/utils.js";

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
  let chatFlavor = [];

  const globalDamageHints = game.settings.get("ddb-importer", "use-damage-hints");
  const spellEffects = foundry.utils.getProperty(data, "flags.ddbimporter.addSpellEffects");
  const damageRestrictionHints = game.settings.get("ddb-importer", "add-damage-restrictions-to-hints") && !spellEffects;
  const hintOrRestriction = globalDamageHints || damageRestrictionHints;

  // damage
  const attacks = data.definition.modifiers.filter((mod) => mod.type === "damage");
  if (attacks.length !== 0) {
    const cantripBoost = data.definition.level === 0 && !!data.flags.ddbimporter.dndbeyond.cantripBoost;
    attacks.forEach((attack) => {
      const restrictionText = attack.restriction && attack.restriction !== "" ? attack.restriction : "";
      const restriction = damageRestrictionHints && restrictionText !== "" ? restrictionText : "";
      const damageHintText = attack.subType || "";
      if (!damageRestrictionHints && restrictionText !== "") {
        const damageText = attack.die.diceString ? `${attack.die.diceString} - ` : "";
        chatFlavor.push(`[${damageText}${damageHintText}] ${restrictionText}`);
      }
      const hintAndRestriction = globalDamageHints && restriction !== "" ? " - " : "";
      const damageHint = globalDamageHints ? damageHintText : "";
      const damageTag = hintOrRestriction ? `[${damageHint}${hintAndRestriction}${restriction}]` : "";
      const addMod = attack.usePrimaryStat || cantripBoost ? " + @mod" : "";
      let diceString = utils.parseDiceString(attack.die.diceString, addMod, damageTag).diceString;
      if (diceString && diceString.trim() !== "" && diceString.trim() !== "null") result.parts.push([diceString, attack.subType]);
    });

    // This is probably just for Toll the dead.
    const alternativeFormula = getAlternativeFormula(data);
    result.versatile = cantripBoost && alternativeFormula && alternativeFormula != "" ? `${alternativeFormula} + @mod` : alternativeFormula;
  }

  // healing
  const heals = data.definition.modifiers.filter((mod) => mod.type === "bonus" && mod.subType === "hit-points");
  if (heals.length !== 0) {
    const healingBonus = (spell.flags.ddbimporter.dndbeyond.healingBoost) ? ` + ${spell.flags.ddbimporter.dndbeyond.healingBoost} + @item.level` : "";
    heals.forEach((heal) => {
      const restrictionText = heal.restriction && heal.restriction !== "" ? heal.restriction : "";
      const restriction = damageRestrictionHints && restrictionText !== "" ? restrictionText : "";
      if (!damageRestrictionHints && restrictionText !== "") {
        const damageText = heal.die.diceString ? `${heal.die.diceString} - ` : "";
        chatFlavor.push(`[${damageText}healing] ${restrictionText}`);
      }
      const hintAndRestriction = globalDamageHints && restriction !== "" ? " - " : "";
      const damageHint = globalDamageHints ? "healing" : "";
      const damageTag = hintOrRestriction ? `[${damageHint}${hintAndRestriction}${restriction}]` : "";
      const healValue = (heal.die.diceString) ? `${heal.die.diceString}${damageTag}` : heal.die.fixedValue;
      const diceString = heal.usePrimaryStat
        ? `${healValue} + @mod${healingBonus}`
        : `${healValue}${healingBonus}`;
      if (diceString && diceString.trim() !== "" && diceString.trim() !== "null") result.parts.push([diceString, "healing"]);
    });
  }

  return [result, chatFlavor.join(", ")];
}
