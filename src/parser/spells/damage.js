
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

  // damage
  const attacks = data.definition.modifiers.filter((mod) => mod.type === "damage");
  if (attacks.length !== 0) {
    const cantripBoost = data.definition.level === 0 && !!data.flags.ddbimporter.dndbeyond.cantripBoost;
    attacks.forEach((attack) => {
      let diceString =
        attack.usePrimaryStat || cantripBoost ? `${attack.die.diceString}[${attack.subType}] + @mod` : attack.die.diceString;
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
    const healingBonus = (spell.flags.ddbimporter.dndbeyond.healingBoost) ? ` + ${spell.flags.ddbimporter.dndbeyond.healingBoost}` : "";
    heals.forEach((heal) => {
      let diceString = heal.usePrimaryStat ?
        `${heal.die.diceString}[healing] + @mod${healingBonus}` :
        `${heal.die.diceString}[healing]${healingBonus}`;
      result.parts.push([diceString, "healing"]);
    });
    return result;
  }
  return result;
}
