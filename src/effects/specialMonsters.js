import CompendiumHelper from "../utils/compendiums.js";
import { configureDependencies } from "./macros.js";

import { absorptionEffect } from "./monsterFeatures/absorbtion.js";
import { generateLegendaryEffect } from "./monsterFeatures/legendary.js";
import { generateOverTimeEffect } from "./monsterFeatures/overTimeEffect.js";

export function baseMonsterFeatureEffect(document, label) {
  return {
    label,
    icon: document.img,
    changes: [],
    duration: {},
    tint: "",
    transfer: false,
    disabled: false,
    flags: {
      dae: {
        transfer: false,
        stackable: "none",
      },
      ddbimporter: {
        disabled: false,
      },
      "midi-qol": { // by default force CE effect usage to off
        forceCEOff: true,
      },
    },
  };
}

export function monsterFeatEffectModules() {
  if (CONFIG.DDBI.EFFECT_CONFIG.MONSTERS.installedModules) {
    return CONFIG.DDBI.EFFECT_CONFIG.MONSTERS.installedModules;
  }
  const midiQolInstalled = game.modules.get("midi-qol")?.active;
  const advancedMacrosInstalled = game.modules.get("advanced-macros")?.active;
  const itemMacroInstalled = game.modules.get("itemacro")?.active;
  const timesUp = game.modules.get("times-up")?.active;
  const daeInstalled = game.modules.get("dae")?.active;
  const convenientEffectsInstalled = game.modules.get("dfreds-convenient-effects")?.active;

  const activeAurasInstalled = game.modules.get("ActiveAuras")?.active;
  const atlInstalled = game.modules.get("ATL")?.active;
  const tokenAurasInstalled = game.modules.get("token-auras")?.active;
  const tokenMagicInstalled = game.modules.get("tokenmagic")?.active;
  const autoAnimationsInstalled = game.modules.get("autoanimations")?.active;
  CONFIG.DDBI.EFFECT_CONFIG.MONSTERS.installedModules = {
    hasCore:
      itemMacroInstalled &&
      midiQolInstalled &&
      advancedMacrosInstalled &&
      timesUp &&
      daeInstalled &&
      convenientEffectsInstalled,
    midiQolInstalled,
    itemMacroInstalled,
    advancedMacrosInstalled,
    timesUp,
    daeInstalled,
    convenientEffectsInstalled,
    atlInstalled,
    tokenAurasInstalled,
    tokenMagicInstalled,
    activeAurasInstalled,
    autoAnimationsInstalled,
  };
  return CONFIG.DDBI.EFFECT_CONFIG.MONSTERS.installedModules;
}

function transferEffectsToActor(document) {
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
export async function monsterFeatureEffectAdjustment(document, monster) {
  if (!document.effects) document.effects = [];

  const deps = monsterFeatEffectModules();
  if (!deps.hasCore) {
    return document;
  }
  if (!CONFIG.DDBI.EFFECT_CONFIG.MONSTERS.configured) {
    CONFIG.DDBI.EFFECT_CONFIG.MONSTERS.configured = configureDependencies();
  }

  // const name = document.flags.ddbimporter.originalName || document.name;

  // absorbtion on monster
  document = absorptionEffect(document);

  // damage over time effects
  document.items.forEach(function(item, index) {
    // Legendary Resistance Effects
    if (item.name.startsWith("Legendary Resistance")) item = generateLegendaryEffect(item);
    // auto overtime effect
    const overTimeResults = generateOverTimeEffect(item, document, monster);
    this[index] = overTimeResults.document;
    document = overTimeResults.actor;

    if (item.effects.length > 0 || hasProperty(item.flags, "itemacro")) {
      setProperty(item, "flags.ddbimporter.effectsApplied", true);
    }
  }, document.items);

  document = transferEffectsToActor(document);
  return document;
}
