import utils from "../utils.js";
import logger from "../logger.js";
import { configureDependencies } from "./macros.js";

import { absorptionEffect } from "./monsterFeatures/absorbtion.js";
import { damageOverTimeEffect, generateDamageOverTimeEffect } from "./monsterFeatures/damageOverTimeEffect.js";

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
  const midiQolInstalled = utils.isModuleInstalledAndActive("midi-qol");
  const advancedMacrosInstalled = utils.isModuleInstalledAndActive("advanced-macros");
  const aboutTime = utils.isModuleInstalledAndActive("about-time");
  const itemMacroInstalled = utils.isModuleInstalledAndActive("itemacro");
  const timesUp = utils.isModuleInstalledAndActive("times-up");
  const daeInstalled = utils.isModuleInstalledAndActive("dae");
  const convenientEffectsInstalled = utils.isModuleInstalledAndActive("dfreds-convenient-effects");

  const activeAurasInstalled = utils.isModuleInstalledAndActive("ActiveAuras");
  const atlInstalled = utils.isModuleInstalledAndActive("ATL");
  const tokenAurasInstalled = utils.isModuleInstalledAndActive("token-auras");
  const tokenMagicInstalled = utils.isModuleInstalledAndActive("tokenmagic");
  const autoAnimationsInstalled = utils.isModuleInstalledAndActive("autoanimations");
  installedModules = {
    hasCore:
      itemMacroInstalled &&
      midiQolInstalled &&
      advancedMacrosInstalled &&
      aboutTime &&
      timesUp &&
      daeInstalled &&
      convenientEffectsInstalled,
    midiQolInstalled,
    itemMacroInstalled,
    advancedMacrosInstalled,
    aboutTime,
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

  const name = document.flags.ddbimporter.originalName || document.name;

  // absorbtion
  document = absorptionEffect(document);

  // damage over time effects
  document.items.forEach(function(item, index) {
    this[index] = generateDamageOverTimeEffect(item, document, monster);
  }, document.items);

  // hardcoded effects
  switch (name) {
    case "Flumph": {
      document.items.forEach(function(item, index) {
        if (item.name === "Tendrils") {
          setProperty(item.flags, "monsterMunch.overTime.damage", "1d4");
          setProperty(item.flags, "monsterMunch.overTime.damageType", "acid");
          setProperty(item.flags, "monsterMunch.overTime.durationSeconds", 60);
          this[index] = generateDamageOverTimeEffect(item, document, monster);
        }
      }, document.items);

      break;
    }
    // no default
  }

  return document;
}
