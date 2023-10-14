/* eslint-disable require-atomic-updates */
import CompendiumHelper from "../lib/CompendiumHelper.js";
import { effectModules, forceItemEffect, generateStatusEffectChange } from "./effects.js";
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

export function baseMonsterFeatureEffect(document, label) {
  let effect = {
    icon: document.img,
    changes: [],
    duration: {},
    tint: "",
    transfer: false,
    disabled: false,
    flags: {
      dae: {
        transfer: false,
        stackable: "noneName",
      },
      ddbimporter: {
        disabled: false,
        originName: document.name,
      },
      "midi-qol": { // by default force CE effect usage to off
        forceCEOff: true,
      },
      core: {},
    },
  };
  if (isNewerVersion(game.version, 11)) {
    effect.name = label;
    effect.statuses = [];
  } else {
    effect.label = label;
  }
  return effect;
}

export function transferEffectsToActor(document) {
  if (!document.effects) document.effects = [];
  const compendiumLabel = CompendiumHelper.getCompendiumLabel("monsters");

  // loop over items and item effect and transfer any effects to the actor
  document.items.forEach((item) => {
    item.effects.forEach((effect) => {
      if (effect.transfer) {
        const transferEffect = duplicate(effect);
        if (!hasProperty(item, "_id")) item._id = randomID();
        if (!hasProperty(effect, "_id")) effect._id = randomID();
        transferEffect._id = randomID();
        transferEffect.transfer = false;
        transferEffect.origin = `Compendium.${compendiumLabel}.${document._id}.Item.${item._id}`;
        setProperty(transferEffect, "flags.ddbimporter.originName", item.name);
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
export async function monsterFeatureEffectAdjustment(ddbMonster) {
  let npc = duplicate(ddbMonster.npc);

  if (!npc.effects) npc.effects = [];

  const deps = effectModules();
  if (!deps.hasCore) {
    return npc;
  }

  // const name = document.flags.ddbimporter?.originalName ?? document.name;

  // absorbtion on monster
  npc = absorptionEffect(npc);

  // damage over time effects
  npc.items.forEach(function(item, index) {
    // Legendary Resistance Effects
    if (item.name.startsWith("Legendary Resistance")) item = generateLegendaryEffect(item);
    if (item.name.startsWith("Pack Tactics")) item = generatePackTacticsEffect(item);
    if (item.name === "Reversal of Fortune") item = generateReversalOfFortuneEffect(item);
    if (item.name === "Suave Defense") item = generateSuaveDefenseEffect(ddbMonster, item);
    if (item.name === "Uncanny Dodge") item = uncannyDodgeEffect(item);
    // auto overtime effect
    if (item.type !== "spell") {
      const overTimeResults = generateOverTimeEffect(ddbMonster, npc, item);
      this[index] = overTimeResults.document;
      npc = overTimeResults.actor;
    }
    if (["Shared Invisibility", "Fallible Invisibility", "Invisibility", "Superior Invisibility"].includes(item.name))
      item = invisibilityFeatureEffect(item);

    item = forceItemEffect(item);
  }, npc.items);

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
    case "Skeletal Juggernaut": {
      npc = await skeletalJuggernautEffects(npc);
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
