import utils from "../utils.js";
import { configureDependencies } from "./macros.js";
import { kiEmptyBodyEffect } from "./feats/kiEmptyBody.js";
import { warCasterEffect } from "./feats/warCaster.js";
import { rageEffect } from "./feats/rage.js";
import { potentCantripEffect } from "./feats/potentCantrip.js";
import { bardicInspirationEffect } from "./feats/bardicInspiration.js";
import { unarmoredMovementEffect } from "./feats/unarmoredMovement.js";
import { paladinDefaultAuraEffect } from "./feats/paladinDefaultAura.js";
import { deflectMissilesEffect } from "./feats/deflectMissiles.js";
import { maneuversEffect } from "./feats/maneuvers.js";
import { sculptSpellsEffect } from "./feats/sculptSpells.js";
import { uncannyDodgeEffect } from "./feats/uncannyDodge.js";

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
      "midi-qol": { // by default force CE effect usage to off
        forceCEOff: true,
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
export async function generateExtraEffects(ddb, character, document) {
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
  if (name.startsWith("Maneuvers: ")) {
    document = await maneuversEffect(ddb, character, document);
  }
  switch (name) {
    case "Empty Body":
    case "Ki: Empty Body": {
      document = await kiEmptyBodyEffect(document);
      break;
    }
    case "Deflect Missiles": {
      document = deflectMissilesEffect(document);
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
export function featureEffectAdjustment(ddb, character, document) {
  const midiQolInstalled = utils.isModuleInstalledAndActive("midi-qol");
  const name = document.flags.ddbimporter.originalName || document.name;
  switch (name) {
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
    case "Sculpt Spells": {
      document = sculptSpellsEffect(document);
      break;
    }
    case "Uncanny Dodge": {
      document = uncannyDodgeEffect(document);
      break;
    }
    // no default
  }

  return document;
}
