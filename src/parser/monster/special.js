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

  // switch (monster.name) {
  //   case "Dullahan": {
  //     monster.items.forEach(function (item, index) {
  //       if (item.name === "Battleaxe") {
  //         this[index].system.damage.versatile += " + 2d10[necrotic]";
  //         this[index].system.damage.parts.push(["2d10[necrotic]", "necrotic"]);
  //       } else if (item.name === "Coordinated Assault") {
  //         this[index].system.activation.type = "legendary";
  //         this[index].system.consume = {
  //           type: "attribute",
  //           target: "resources.legact.value",
  //           amount: 1,
  //         };
  //         this[index].system.activation.cost = 1;
  //       } else if (item.name.startsWith("Headless Wail")) {
  //         this[index].system.activation.cost = 2;
  //         this[index].system.activation.type = "legendary";
  //         this[index].system.consume = {
  //           type: "attribute",
  //           target: "resources.legact.value",
  //           amount: 2,
  //         };
  //       }
  //     }, monster.items);
  //     break;
  //   }

  //   case "Autumn Eladrin (Legacy)":
  //   case "Autumn Eladrin": {
  //     monster.items.forEach(function (item, index) {
  //       if (item.name.startsWith("Cure Wounds")) {
  //         this[index].system.damage.parts[0][0] = "5d8[healing] + @mod";
  //       }
  //     }, monster.items);
  //     break;
  //     // no default
  //   }


  //   case "Nilbog (Legacy)":
  //   case "Nilbog": {
  //     monster.items.forEach(function (item, index) {
  //       if (item.name === "Reversal of Fortune") {
  //         this[index].system.actionType = "heal";
  //       }
  //     }, monster.items);
  //     // eslint-disable-next-line no-unreachable
  //     break;
  //   }
  // }

}
