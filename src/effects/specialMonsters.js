import { configureDependencies } from "./macros.js";

import { absorptionEffect } from "./monsterFeatures/absorbtion.js";
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
        stackable: false,
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

var installedModules;

export function monsterFeatEffectModules() {
  if (installedModules) return installedModules;
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
  installedModules = {
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
  return installedModules;
}

var configured;

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
  if (!configured) {
    configured = configureDependencies();
  }

  // const name = document.flags.ddbimporter.originalName || document.name;

  // absorbtion on monster
  document = absorptionEffect(document);

  // damage over time effects
  document.items.forEach(function(item, index) {
    const overTimeResults = generateOverTimeEffect(item, document, monster);
    this[index] = overTimeResults.document;
    document = overTimeResults.actor;
  }, document.items);

  return document;
}
