import { baseItemEffect } from "../../effects/effects.js";
import utils from "../../utils.js";

function absorption(monster) {
  monster.items.forEach((item) => {
    const absRegEx = /is subjected to (\w+) damage, it takes no damage and instead regains a number of hit points equal to the (\w+) damage/;
    const match = absRegEx.exec(item.data.description.value);
    if (!item.effects) item.effects = [];
    if (match) {
      let effect = baseItemEffect(item, `${item.name}`);
      effect.changes.push(
        {
          key: `flags.midi-qol.absorption.${match[1]}`,
          value: "1",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          priority: 20,
        }
      );
      effect.icon = "icons/svg/downgrade.svg";
      item.effects.push(effect);
    }
  });
  return monster;
}


// these are non-compliant monsters
export function specialCases(monster) {
  switch (monster.name) {
    case "Hypnos Magen": {
      monster.flags.monsterMunch.spellList.atwill = ["Suggestion"];
      monster.flags.monsterMunch.spellList.material = false;
      monster.data.attributes.spellcasting = "int";
      break;
    }
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
  const midiQolInstalled = utils.isModuleInstalledAndActive("midi-qol");
  if (midiQolInstalled) {
    monster = absorption(monster);
  }
  return monster;
}
