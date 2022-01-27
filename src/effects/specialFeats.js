import utils from "../utils.js";
import { configureDependencies } from "./macros.js";
import { kiEmptyBodyEffect } from "./feats/kiEmptyBody.js";
import { warCasterEffect } from "./feats/warCaster.js";
import { rageEffect } from "./feats/rage.js";
import { potentCantripEffect } from "./feats/potentCantrip.js";
import { bardicInspirationEffect } from "./feats/bardicInspiration.js";
import { unarmoredMovementEffect } from "./feats/unarmoredMovement.js";
import { paladinDefaultAuraEffect } from "./feats/paladinDefaultAura.js";

export function baseFeatEffect(document, label) {
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
    },
  };
}

var installedModules;

export function featEffectModules() {
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
 * These are effects that can't be generated dynamically and have extra requirements
 */
export async function generateExtraEffects(document) {
  if (!document.effects) document.effects = [];

  // check that we can gen effects
  const deps = featEffectModules();
  if (!deps.hasCore) {
    return document;
  }
  if (!configured) {
    configured = configureDependencies();
  }

  const name = document.flags.ddbimporter.originalName || document.name;
  switch (name) {
    case "Empty Body":
    case "Ki: Empty Body": {
      document = await kiEmptyBodyEffect(document);
      break;
    }
    // no default
  }
  return document;
}

/**
 * This function is mainly for effects that can't be dynamically generated
 * @param {*} document
 */
export function featureEffectAdjustment(document) {
  const midiQolInstalled = utils.isModuleInstalledAndActive("midi-qol");
  switch (document.name) {
    // if using active auras add the aura effect
    case "Aura of Courage":
    case "Aura of Protection": {
      document = paladinDefaultAuraEffect(document);
      break;
    }
    case "Unarmored Movement": {
      document = unarmoredMovementEffect(document);
      break;
    }
    case "Bardic Inspiration": {
      if (midiQolInstalled) {
        document = bardicInspirationEffect(document);
      }
      break;
    }
    case "Rage": {
      document = rageEffect(document);
      break;
    }
    case "War Caster":
    case "Warcaster": {
      document = warCasterEffect(document);
      break;
    }
    case "Potent Cantrip": {
      document = potentCantripEffect(document);
      break;
    }
    // no default
  }

  return document;
}
