
// these are non-compliant monsters that currently don't meet parsing requirements

import { utils } from "../../lib/_module";


function isAttack({ activity, classification = null, type = null }:
{ activity: I5eActivity; classification?: string | null; type?: string | null;
}) {
  if (activity.type !== "attack") return false;
  if (classification && activity.attack?.type?.classification !== classification) return false;
  if (type && activity.attack?.type?.value !== type) return false;

  return true;
}

function hasAttackActivity(item: I5eMonsterItem) {
  if (!("activities" in item.system)) return false;
  return Object.values(item.system.activities).some((activity) => isAttack({
    activity,
    classification: "weapon",
  }));

}

// these are temporary work arounds till parsing is fixed.
export function specialCases(monster: I5eMonsterData) {
  const magicWeapons = monster.items.some((item) => item.name === "Magic Weapons");
  if (magicWeapons) {
    monster.items.forEach(function (item, index) {
      const applyMagic = item.type === "weapon" || hasAttackActivity(item);
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
