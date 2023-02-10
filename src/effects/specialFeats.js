import { configureDependencies } from "./macros.js";
import { ancestralProtectorsEffect } from "./feats/ancestralProtectors.js";
import { bardicInspirationEffect } from "./feats/bardicInspiration.js";
import { bladesongEffect } from "./feats/bladesong.js";
import { blessedHealerEffect } from "./feats/blessedHealer.js";
import { blessedStrikesEffect } from "./feats/blessedStrikes.js";
import { cloudRuneEffect } from "./feats/cloudRune.js";
import { crossbowExpertEffect } from "./feats/crossbowExpert.js";
import { defensiveDuelistEffect } from "./feats/defensiveDuelist.js";
import { deflectMissilesEffect } from "./feats/deflectMissiles.js";
import { favoredFoeEffect } from "./feats/favoredFoe.js";
import { fightingStyleInterceptionEffect } from "./feats/fightingStyles.js";
import { fireRuneEffect } from "./feats/fireRune.js";
import { frostRuneEffect } from "./feats/frostRune.js";
import { giantsMightEffect } from "./feats/giantsMight.js";
import { heavyArmorMasterEffect } from "./feats/heavyArmorMaster.js";
import { hillRuneEffect } from "./feats/hillRune.js";
import { indomitableEffect } from "./feats/indomitable.js";
import { kiEmptyBodyEffect } from "./feats/kiEmptyBody.js";
import { maneuversEffect } from "./feats/maneuvers.js";
import { paladinDefaultAuraEffect } from "./feats/paladinDefaultAura.js";
import { planarWarriorEffect } from "./feats/planarWarrior.js";
import { potentCantripEffect } from "./feats/potentCantrip.js";
import { radiantSoulEffect } from "./feats/radiantSoul.js";
import { rageEffect } from "./feats/rage.js";
import { recklessAttackEffect } from "./feats/recklessAttack.js";
import { runeCarverEffect } from "./feats/runeCarver.js";
import { sacredWeaponEffect } from "./feats/sacredWeapon.js";
import { savageAttackerEffect } from "./feats/savageAttacker.js";
import { sculptSpellsEffect } from "./feats/sculptSpells.js";
import { sharpShooterEffect } from "./feats/sharpShooter.js";
import { shiftEffect } from "./feats/shift.js";
import { steadyAimEffect } from "./feats/steadyAim.js";
import { stoneRuneEffect } from "./feats/stoneRune.js";
import { stormRuneEffect } from "./feats/stormRune.js";
import { unarmoredMovementEffect } from "./feats/unarmoredMovement.js";
import { uncannyDodgeEffect } from "./feats/uncannyDodge.js";
import { vigilantBlessingEffect } from "./feats/vigilantBlessing.js";
import { warCasterEffect } from "./feats/warCaster.js";
import { fontOfMagicEffect } from "./feats/fontOfMagic.js";
import { forceItemEffect } from "./effects.js";
import { momentaryStasis } from "./feats/momentaryStasis.js";
import { visageOfTheAstralSelfEffect } from "./feats/visageOfTheAstralSelf.js";
import { stonesEnduranceEffect } from "./feats/stonesEndurance.js";

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

export function featEffectModules() {
  if (CONFIG.DDBI.EFFECT_CONFIG.FEATS.installedModules) {
    return CONFIG.DDBI.EFFECT_CONFIG.FEATS.installedModules;
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
  CONFIG.DDBI.EFFECT_CONFIG.FEATS.installedModules = {
    hasCore:
      itemMacroInstalled
      && midiQolInstalled
      && advancedMacrosInstalled
      && timesUp
      && daeInstalled
      && convenientEffectsInstalled,
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
  return CONFIG.DDBI.EFFECT_CONFIG.FEATS.installedModules;
}


/**
 * These are effects that can't be generated dynamically and have extra requirements
 */
// eslint-disable-next-line complexity
export async function featureEffectAdjustment(ddb, character, document) {
  if (!document.effects) document.effects = [];

  const name = document.flags.ddbimporter.originalName || document.name;

  // check that we can gen effects
  const deps = featEffectModules();

  if (deps.daeInstalled) {
    switch (name) {
      // if using active auras add the aura effect
      case "Aura of Courage":
      case "Aura of Protection": {
        document = paladinDefaultAuraEffect(document);
        break;
      }
      case "Defensive Duelist": {
        document = defensiveDuelistEffect(document);
        break;
      }
      case "Frost Rune": {
        document = frostRuneEffect(document);
        break;
      }
      case "Hill Rune": {
        document = hillRuneEffect(document);
        break;
      }
      case "Momentary Stasis": {
        document = momentaryStasis(document);
        break;
      }
      case "Rage": {
        document = rageEffect(document);
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
      // no default
    }
  }

  if (deps.daeInstalled && deps.midiQolInstalled) {
    switch (name) {
      case "Bladesong": {
        document = bladesongEffect(document);
        break;
      }
      case "Bardic Inspiration": {
        document = bardicInspirationEffect(document);
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
      case "Crossbow Expert": {
        document = crossbowExpertEffect(document);
        break;
      }
      case "Deflect Missiles": {
        document = deflectMissilesEffect(document);
        break;
      }
      case "Empty Body":
      case "Ki: Empty Body": {
        document = kiEmptyBodyEffect(document);
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
      case "Giant's Might": {
        document = giantsMightEffect(document);
        break;
      }
      case "Heavy Armor Master": {
        document = heavyArmorMasterEffect(document);
        break;
      }
      case "Indomitable": {
        document = indomitableEffect(document);
        break;
      }
      case "Potent Cantrip": {
        document = potentCantripEffect(document);
        break;
      }
      case "Celestial Revelation (Radiant Soul)":
      case "Radiant Soul": {
        document = await radiantSoulEffect(document);
        break;
      }
      case "Reckless Attack": {
        document = recklessAttackEffect(document);
        break;
      }
      case "Channel Divinity: Sacred Weapon":
      case "Sacred Weapon": {
        document = await sacredWeaponEffect(document);
        break;
      }
      case "Sculpt Spells": {
        document = sculptSpellsEffect(document);
        break;
      }
      case "Sharpshooter": {
        document = sharpShooterEffect(document);
        break;
      }
      case "Savage Attacker": {
        document = savageAttackerEffect(document);
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
        document = stoneRuneEffect(document);
        break;
      }
      case "Stone's Endurance":
      case "Stone’s Endurance": {
        document = stonesEnduranceEffect(document);
        break;
      }
      case "Storm Rune": {
        document = stormRuneEffect(document);
        break;
      }
      case "Visage of the Astral Self": {
        document = visageOfTheAstralSelfEffect(document);
        break;
      }
      case "War Caster":
      case "Warcaster": {
        document = warCasterEffect(document);
        break;
      }
      // no default
    }
  }

  if (!deps.hasCore) {
    return forceItemEffect(document);
  }
  if (!CONFIG.DDBI.EFFECT_CONFIG.FEATS.configured) {
    CONFIG.DDBI.EFFECT_CONFIG.FEATS.configured = configureDependencies();
  }


  if (name.startsWith("Maneuvers: ")) {
    document = await maneuversEffect(ddb, character, document);
  }
  if (name.startsWith("Rune Carver: ")) {
    document = await runeCarverEffect(document);
  }
  switch (name) {
    case "Ancestral Protectors": {
      document = await ancestralProtectorsEffect(document);
      break;
    }
    case "Blessed Healer": {
      document = await blessedHealerEffect(document);
      break;
    }
    case "Convert Sorcery Points":
    case "Font of Magic": {
      document = await fontOfMagicEffect(document);
      break;
    }
    case "Favored Foe": {
      document = await favoredFoeEffect(document);
      break;
    }
    case "Planar Warrior": {
      document = await planarWarriorEffect(document);
      break;
    }
    // no default
  }

  return forceItemEffect(document);
}
