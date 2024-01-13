/* eslint-disable no-await-in-loop */
/* eslint-disable require-atomic-updates */
import { applyDefaultMidiFlags, baseEffect, effectModules, forceItemEffect, generateStatusEffectChange } from "./effects.js";
import { uncannyDodgeEffect } from "./feats/uncannyDodge.js";

import { absorptionEffect } from "./monsterFeatures/absorbtion.js";
import { generateLegendaryEffect } from "./monsterFeatures/legendary.js";
import { generateOverTimeEffect } from "./monsterFeatures/overTimeEffect.js";
import { generatePackTacticsEffect } from "./monsterFeatures/packTactics.js";
import { generateReversalOfFortuneEffect } from "./monsterFeatures/reversalOfFortune.js";
import { generateSuaveDefenseEffect } from "./monsterFeatures/suaveDefense.js";
import { generateTauntEffect } from "./monsterFeatures/taunt.js";
import { skeletalJuggernautEffects } from "./monsterFeatures/skeletalJuggernautEffects.js";
import { venomTrollEffects } from "./monsterFeatures/venomTroll.js";
import { quasitEffects } from "./monsterFeatures/quasit.js";
import { invisibilityFeatureEffect } from "./monsterFeatures/invisibility.js";
import { recklessAttackEffect } from "./feats/recklessAttack.js";
import { maskOfTheWildEffect } from "./feats/maskOfTheWild.js";
import { deathlyChoirEffect } from "./monsterFeatures/deathlyChoir.js";
import { strahdZombieEffects } from "./monsterFeatures/strahdZombie.js";

export function baseMonsterFeatureEffect(document, label,
  { transfer = false, disabled = false } = {}
) {
  return baseEffect(document, label, { transfer, disabled });
}

export function transferEffectsToActor(document) {
  // when legacy transferral gets removed, we don't need to do this.
  if (isNewerVersion(game.version, 11) && !CONFIG.ActiveEffect.legacyTransferral) return document;
  if (!document.effects) document.effects = [];
  // loop over items and item effect and transfer any effects to the actor
  document.items.forEach((item) => {
    item.effects.forEach((effect) => {
      if (effect.transfer) {
        const transferEffect = duplicate(effect);
        if (!hasProperty(item, "_id")) item._id = randomID();
        if (!hasProperty(effect, "_id")) effect._id = randomID();
        transferEffect._id = randomID();
        transferEffect.transfer = false;
        transferEffect.origin = `Actor.${document._id}.Item.${item._id}`;
        setProperty(transferEffect, "flags.ddbimporter.originName", item.name);
        setProperty(transferEffect, "flags.ddbimporter.localOriginEffect", true);
        document.effects.push(transferEffect);
      }
    });
  });

  return document;
}

/**
 * This function is mainly for effects that can't be dynamically generated
 * @param {*} document
 */
// eslint-disable-next-line complexity
export async function monsterFeatureEffectAdjustment(ddbMonster) {
  let npc = duplicate(ddbMonster.npc);

  if (!npc.effects) npc.effects = [];

  const deps = effectModules();
  if (!deps.hasCore) {
    return npc;
  }

  // damage over time effects
  for (let [index, item] of npc.items.entries()) {
    item = applyDefaultMidiFlags(item);
    // Legendary Resistance Effects
    if (item.name.startsWith("Legendary Resistance")) item = generateLegendaryEffect(item);
    else if (item.name.startsWith("Pack Tactics")) item = generatePackTacticsEffect(item);
    else if (item.name === "Reversal of Fortune") item = generateReversalOfFortuneEffect(item);
    else if (item.name === "Suave Defense") item = generateSuaveDefenseEffect(ddbMonster, item);
    else if (item.name === "Uncanny Dodge") item = uncannyDodgeEffect(item);
    else if (item.name === "Reckless") item = recklessAttackEffect(item, true);
    else if (["Shared Invisibility", "Fallible Invisibility", "Invisibility", "Superior Invisibility"].includes(item.name))
      item = invisibilityFeatureEffect(item);
    else if (item.name.includes("Absorption")) item = absorptionEffect(item);
    else if (item.name === "Mask of the Wild") item = await maskOfTheWildEffect(item);

    // auto overtime effect
    if (item.type !== "spell") {
      const overTimeResults = generateOverTimeEffect(ddbMonster, npc, item);
      item = overTimeResults.document;
      npc = overTimeResults.actor;
    }

    item = forceItemEffect(item);
    npc.items[index] = item;
  };

  switch (npc.name) {
    case "Bard": {
      npc.items.forEach((item) => {
        if (item.name === "Taunt") {
          item = generateTauntEffect(item);
          item = forceItemEffect(item);
        }
      });
      break;
    }
    case "Carrion Crawler":
    case "Reduced-threat Carrion Crawler": {
      npc.items.forEach(function(item, index) {
        if (item.name === "Tentacles") {
          this[index].effects[0].changes.push(generateStatusEffectChange("Paralyzed", 20, true));
          this[index] = forceItemEffect(this[index]);
        }
      }, npc.items);
      break;
    }
    case "Quasit": {
      npc = await quasitEffects(npc);
      break;
    }
    case "Rahadin": {
      for (let [index, item] of npc.items.entries()) {
        if (item.name === "Deathly Choir") {
          npc.items[index] = await deathlyChoirEffect(item);
        }
      }
      break;
    }
    case "Skeletal Juggernaut": {
      npc = await skeletalJuggernautEffects(npc);
      break;
    }
    case "Strahd Zombie": {
      npc = await strahdZombieEffects(npc);
      break;
    }
    case "Venom Troll": {
      npc = await venomTrollEffects(npc);
      break;
    }
    // no default
  }

  switch (npc.system.details.type.value) {
    case "dragon": {
      npc.items.forEach(function (item, index) {
        if (item.name === "Frightful Presence") {
          this[index].effects[0].duration.rounds = 10;
        }
      }, npc.items);
      break;
    }
    // no default
  }

  return npc;
}
