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
import { bladesongEffect } from "./feats/bladesong.js";
import { fightingStyleInterceptionEffect } from "./feats/fightingStyles.js";
import { defensiveDuelistEffect } from "./feats/defensiveDuelist.js";
import { indomitableEffect } from "./feats/indomitable.js";
import { blessedHealerEffect } from "./feats/blessedHealer.js";
import { giantsMarkEffect } from "./feats/giantsMight.js";
import { recklessAttackEffect } from "./feats/recklessAttack.js";
import { cloudRuneEffect } from "./feats/cloudRune.js";
import { fireRuneEffect } from "./feats/fireRune.js";
import { frostRuneEffect } from "./feats/frostRune.js";
import { stoneRuneEffect } from "./feats/stoneRune.js";
import { hillRuneEffect } from "./feats/hillRune.js";
import { stormRuneEffect } from "./feats/stormRune.js";
import { runeCarverEffect } from "./feats/runeCarver.js";
import { vigilantBlessingEffect } from "./feats/vigilantBlessing.js";
import { steadyAimEffect } from "./feats/steadyAim.js";
import { shiftEffect } from "./feats/shift.js";
import { blessedStrikesEffect } from "./feats/blessedStrikes.js";
import { planarWarriorEffect } from "./feats/planarWarrior.js";

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

var installedModules;

export function featEffectModules() {
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
 * These are effects that can't be generated dynamically and have extra requirements
 */
// eslint-disable-next-line complexity
export async function featureEffectAdjustment(ddb, character, document) {
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
  if (name.startsWith("Rune Carver: ")) {
    document = await runeCarverEffect(document);
  }
  switch (name) {
    // if using active auras add the aura effect
    case "Aura of Courage":
    case "Aura of Protection": {
      document = paladinDefaultAuraEffect(document);
      break;
    }
    case "Bladesong": {
      document = bladesongEffect(document);
      break;
    }
    case "Bardic Inspiration": {
      document = bardicInspirationEffect(document);
      break;
    }
    case "Blessed Healer": {
      document = await blessedHealerEffect(document);
      break;
    }
    case "Blessed Strikes": {
      document = blessedStrikesEffect(document);
      break;
    }
    case "Cloud Rune": {
      document = cloudRuneEffect(document);
      break;
    }
    case "Defensive Duelist": {
      document = defensiveDuelistEffect(document);
      break;
    }
    case "Deflect Missiles": {
      document = deflectMissilesEffect(document);
      break;
    }
    case "Empty Body":
    case "Ki: Empty Body": {
      document = await kiEmptyBodyEffect(document);
      break;
    }
    case "Fighting Style: Interception": {
      document = fightingStyleInterceptionEffect(document);
      break;
    }
    case "Fire Rune": {
      document = fireRuneEffect(document);
      break;
    }
    case "Frost Rune": {
      document = frostRuneEffect(document);
      break;
    }
    case "Giant's Might": {
      document = giantsMarkEffect(document);
      break;
    }
    case "Hill Rune": {
      document = hillRuneEffect(document);
      break;
    }
    case "Indomitable": {
      document = indomitableEffect(document);
      break;
    }
    case "Planar Warrior": {
      document = await planarWarriorEffect(document);
      break;
    }
    case "Potent Cantrip": {
      document = potentCantripEffect(document);
      break;
    }
    case "Rage": {
      document = rageEffect(document);
      break;
    }
    case "Reckless Attack": {
      document = recklessAttackEffect(document);
      break;
    }
    case "Sculpt Spells": {
      document = sculptSpellsEffect(document);
      break;
    }
    case "Shift": {
      document = shiftEffect(ddb, character, document);
      break;
    }
    case "Steady Aim": {
      document = steadyAimEffect(document);
      break;
    }
    case "Stone Rune": {
      document = await stoneRuneEffect(document);
      break;
    }
    case "Storm Rune": {
      document = stormRuneEffect(document);
      break;
    }
    case "Unarmored Movement": {
      document = unarmoredMovementEffect(document);
      break;
    }
    case "Uncanny Dodge": {
      document = uncannyDodgeEffect(document);
      break;
    }
    case "Vigilant Blessing": {
      document = vigilantBlessingEffect(document);
      break;
    }
    case "War Caster":
    case "Warcaster": {
      document = warCasterEffect(document);
      break;
    }
    // no default
  }
  if (document.effects.length > 0 || hasProperty(document.flags, "itemacro")) {
    setProperty(document, "flags.ddbimporter.effectsApplied", true);
  }
  return document;
}
