/* eslint-disable no-unreachable */
// these are non-compliant monsters that currently don't meet parsing requirements

import { utils } from "../../lib/_module.mjs";


function isAttack({
  activity, classification = null, type = null, orHasProperties = [], andHasProperties = [],
} = {}) {
  if (activity.type !== "attack") return false;
  if (classification && activity.attack?.type?.classification !== classification) return false;
  if (andHasProperties.length > 0 && !andHasProperties.every((p) => activity.parent.properties.has(p))) return false;
  const orHas = orHasProperties.some((p) => activity.parent.properties.has(p));
  if ((type && activity.attack?.type?.value !== type)
    || (orHas.length > 0 && !orHas)) return false;

  return true;
}

// these are temporary work arounds till parsing is fixed.
export function specialCases(monster) {
  const magicWeapons = monster.items.some((item) => item.name === "Magic Weapons");
  if (magicWeapons) {
    monster.items.forEach(function (item, index) {
      const applyMagic = item.type === "weapon" || Object.values(item.system.activities).some((activity) => isAttack({
        activity,
        classification: "weapon",
      }));
      if (applyMagic) {
        this[index].system.properties = utils.addToProperties(this[index].system.properties, "mgc");
      }
    }, monster.items);
  }

  switch (monster.name) {
    case "Living Blade of Disaster": {
      monster.items.forEach(function (item, index) {
        if (item.name === "Preemptive Strike") {
          foundry.utils.setProperty(this[index], "flags.midi-qol.reactionCondition", "false");
        }
      }, monster.items);
      break;
    }
    // no default
  }

  return monster;

}
