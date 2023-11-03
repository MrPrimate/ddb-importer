import { effectModules, forceItemEffect, forceManualReaction } from "./effects.js";

// effect loads
import { ancestralProtectorsEffect } from "./feats/ancestralProtectors.js";
import { arcaneWardEffect } from "./feats/arcaneWard.js";
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
import { fontOfMagicEffect } from "./feats/fontOfMagic.js";
import { frostRuneEffect } from "./feats/frostRune.js";
import { giantsMightEffect } from "./feats/giantsMight.js";
import { heavyArmorMasterEffect } from "./feats/heavyArmorMaster.js";
import { hillRuneEffect } from "./feats/hillRune.js";
import { indomitableEffect } from "./feats/indomitable.js";
import { kiEmptyBodyEffect } from "./feats/kiEmptyBody.js";
import { maneuversEffect } from "./feats/maneuvers.js";
import { momentaryStasis } from "./feats/momentaryStasis.js";
import { paladinDefaultAuraEffect } from "./feats/paladinDefaultAura.js";
import { piercerCriticalEffect, piercerRerollEffect } from "./feats/piercer.js";
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
import { slayersPreyEffect } from "./feats/slayersPrey.js";
import { steadyAimEffect } from "./feats/steadyAim.js";
import { stoneRuneEffect } from "./feats/stoneRune.js";
import { stonesEnduranceEffect } from "./feats/stonesEndurance.js";
import { stormRuneEffect } from "./feats/stormRune.js";
import { unarmoredMovementEffect } from "./feats/unarmoredMovement.js";
import { uncannyDodgeEffect } from "./feats/uncannyDodge.js";
import { vigilantBlessingEffect } from "./feats/vigilantBlessing.js";
import { visageOfTheAstralSelfEffect } from "./feats/visageOfTheAstralSelf.js";
import { warCasterEffect } from "./feats/warCaster.js";
import { crusherEffect } from "./feats/crusher.js";
import { crusherCriticalEffect } from "./feats/crusherCritical.js";
import { slasherReduceSpeedEffect } from "./feats/slasherReduceSpeed.js";
import { slasherCriticalEffect } from "./feats/slasherCritical.js";
import { squireOfSolamniaEffect } from "./feats/squireOfSolamnia.js";
import { arcaneRecoveryEffect } from "./feats/arcaneRecovery.js";
import { alertEffect } from "./feats/alert.js";
import { evasionEffect } from "./feats/evasion.js";
import { formOfTheBeastReactionEffect } from "./feats/formOfTheBeastReaction.js";
import { deflectMissilesAttackEffect } from "./feats/deflectMissilesAttack.js";
import { patientDefenseEffect } from "./feats/patientDefense.js";
import { mantleOfInspirationEffect } from "./feats/mantleOfInspiration.js";
import { pactMagicEffect } from "./feats/pactMagic.js";
import { dauntingRoarEffect } from "./feats/dauntingRoar.js";
import { powerfulBuild } from "./feats/powerfulBuild.js";
import { deftStrikeEffect } from "./feats/deftStike.js";
import { hadozeDodgeEffect } from "./feats/hadozeeDodge.js";
import { mindLinkEffect } from "./feats/mindLink.js";
import { holdBreathEffect } from "./feats/holdBreath.js";

export function baseFeatEffect(document, label) {
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

/**
 * These are effects that can't be generated dynamically and have extra requirements
 */
// eslint-disable-next-line complexity
export async function featureEffectAdjustment(ddb, character, document) {
  if (!document.effects) document.effects = [];

  const name = document.flags.ddbimporter?.originalName ?? document.name;

  // check that we can gen effects
  const deps = effectModules();

  if (deps.daeInstalled) {
    switch (name) {
      case "Alert": {
        document = alertEffect(document);
        break;
      }
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
      case "Hold Breath": {
        document = holdBreathEffect(document);
        break;
      }
      case "Hill Rune": {
        document = hillRuneEffect(document);
        break;
      }
      case "Mind Link Response": {
        document = mindLinkEffect(document);
        break;
      }
      case "Momentary Stasis": {
        document = momentaryStasis(document);
        break;
      }
      case "Pact Magic": {
        document = pactMagicEffect(document);
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
      case "Arcane Recovery": {
        document = await arcaneRecoveryEffect(document);
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
      case "Daunting Roar": {
        document = dauntingRoarEffect(document);
        break;
      }
      case "Deflect Missiles": {
        document = deflectMissilesEffect(document);
        break;
      }
      case "Deflect Missiles Attack": {
        document = deflectMissilesAttackEffect(document);
        break;
      }
      case "Evasion": {
        document = evasionEffect(document);
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
      case "Form of the Beast: Tail (reaction)": {
        document = formOfTheBeastReactionEffect(document);
        break;
      }
      case "Giant's Might": {
        document = giantsMightEffect(document);
        break;
      }
      case "Glide (Reaction)": {
        setProperty(document, "system.activation.type", "reactionmanual");
        break;
      }
      case "Hadozee Dodge": {
        document = hadozeDodgeEffect(document);
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
      case "Mantle of Inspiration": {
        document = await mantleOfInspirationEffect(document);
        break;
      }
      case "Patient Defense": {
        document = patientDefenseEffect(document);
        break;
      }
      case "Potent Cantrip": {
        document = potentCantripEffect(document);
        break;
      }
      case "Equine Build":
      case "Little Giant":
      case "Hippo Build":
      case "Powerful Build": {
        document = powerfulBuild(document);
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
        if (ddb && character) document = shiftEffect(ddb, character, document);
        break;
      }
      case "Slow Fall": {
        document = forceManualReaction(document);
        break;
      }
      case "Squire of Solamnia: Precise Strike": {
        document = await squireOfSolamniaEffect(document);
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
      case "Swiftstride Reaction": {
        document = forceManualReaction(document);
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


  if (name.startsWith("Maneuvers: ") && ddb && character) {
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
    case "Arcane Ward": {
      document = await arcaneWardEffect(document);
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
    case "Crusher": {
      document = await crusherEffect(document);
      break;
    }
    case "Crusher: Critical": {
      document = await crusherCriticalEffect(document);
      break;
    }
    case "Deft Strike": {
      document = await deftStrikeEffect(document);
      break;
    }
    case "Favored Foe": {
      document = await favoredFoeEffect(document);
      break;
    }
    case "Piercer": {
      document = await piercerCriticalEffect(document);
      document = await piercerRerollEffect(document);
      break;
    }
    case "Piercer: Reroll Damage": {
      document = await piercerRerollEffect(document);
      break;
    }
    case "Piercer: Critical Hit": {
      document = await piercerCriticalEffect(document);
      break;
    }
    case "Planar Warrior": {
      document = await planarWarriorEffect(document);
      break;
    }
    case "Slasher: Reduce Speed": {
      document = await slasherReduceSpeedEffect(document);
      break;
    }
    case "Slasher: Critical Hit": {
      document = await slasherCriticalEffect(document);
      break;
    }
    case "Slayer's Prey": {
      document = await slayersPreyEffect(document);
      break;
    }
    // no default
  }

  return forceItemEffect(document);
}
