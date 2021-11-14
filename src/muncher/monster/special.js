// these are non-compliant monsters
export function specialCases(monster) {
  switch (monster.name) {
    case "Sephek Kaltro": {
      monster.flags.monsterMunch.spellList.innate = [{ name: "Misty Step", type: "day", value: 3 }];
      monster.flags.monsterMunch.spellList.material = false;
      break;
    }
    case "Reduced-threat Aboleth":
    case "Aboleth":
      monster.items.forEach((item) => {
        if (item.name === "Tentacle") {
          item.data.formula = item.data.damage.parts[1][0];
          item.data.damage.parts.splice(1, 1);
        }
      });
      break;
    // no default
  }
  return monster;
}
