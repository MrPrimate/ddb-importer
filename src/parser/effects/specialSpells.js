import { absorbElementsEffect } from "./spells/absorbElements.js";
import { aidEffect } from "./spells/aid.js";
import { alterSelfEffect } from "./spells/alterSelf.js";
import { animalFriendshipEffect } from "./spells/animalFriendship.js";
import { arcaneSwordEffect } from "./spells/arcaneSword.js";
import { baneEffect } from "./spells/bane.js";
import { banishmentEffect } from "./spells/banishment.js";
import { barkskinEffect } from "./spells/barkskin.js";
import { beaconofHopeEffect } from "./spells/beaconofHope.js";
import { blackTentaclesEffect } from "./spells/blackTentacles.js";
import { blessEffect } from "./spells/bless.js";
import { blindnessDeafnessEffect } from "./spells/blindnessDeafness.js";
import { callLightningEffect } from "./spells/callLightning.js";
import { charmPersonEffect } from "./spells/charmPerson.js";
import { commandEffect } from "./spells/command.js";
import { confusionEffect } from "./spells/confusion.js";
import { contagionEffect } from "./spells/contagion.js";
import { darknessEffect } from "./spells/darkness.js";
import { darkvisionEffect } from "./spells/darkvision.js";
import { divineFavorEffect } from "./spells/divineFavor.js";
import { divineWordEffect } from "./spells/divineWord.js";
import { dominateBeastEffect } from "./spells/dominateBeast.js";
import { dominateMonsterEffect } from "./spells/dominateMonster.js";
import { dominatePersonEffect } from "./spells/dominatePerson.js";
import { enhanceAbilityEffect } from "./spells/enhanceAbility.js";
import { enlargeReduceEffect } from "./spells/enlargeReduce.js";
import { entangleEffect } from "./spells/entangle.js";
import { eyebiteEffect } from "./spells/eyebite.js";
import { faerieFireEffect } from "./spells/faerieFire.js";
import { fearEffect } from "./spells/fear.js";
import { feeblemindEffect } from "./spells/feeblemind.js";
import { fireShieldEffect } from "./spells/fireShield.js";
import { flameBladeEffect } from "./spells/flameBlade.js";
import { fleshtoStoneEffect } from "./spells/fleshtoStone.js";
import { flyEffect } from "./spells/fly.js";
import { geasEffect } from "./spells/geas.js";
import { greaseEffect } from "./spells/grease.js";
import { greaterInvisibilityEffect } from "./spells/greaterInvisibility.js";
import { guidingBoltEffect } from "./spells/guidingBolt.js";
import { hasteEffect } from "./spells/haste.js";
import { heroesFeastEffect } from "./spells/heroesFeast.js";
import { heroismEffect } from "./spells/heroism.js";
import { hideousLaughterEffect } from "./spells/hideousLaughter.js";
import { holdMonsterEffect } from "./spells/holdMonster.js";
import { holdPersonEffect } from "./spells/holdPerson.js";
import { holyAuraEffect } from "./spells/holyAura.js";
import { hypnoticPatternEffect } from "./spells/hypnoticPattern.js";
import { invisibilityEffect } from "./spells/invisibility.js";
import { irresistibleDanceEffect } from "./spells/irresistibleDance.js";
import { levitateEffect } from "./spells/levitate.js";
import { longstriderEffect } from "./spells/longstrider.js";
import { mageArmorEffect } from "./spells/mageArmor.js";
import { magicWeaponEffect } from "./spells/magicWeapon.js";
import { massSuggestionEffect } from "./spells/massSuggestion.js";
import { mistyStepEffect } from "./spells/mistyStep.js";
import { moonbeamEffect } from "./spells/moonbeam.js";
import { phantasmalKillerEffect } from "./spells/phantasmalKiller.js";
import { protectionfromEnergyEffect } from "./spells/protectionfromEnergy.js";
import { protectionfromPoisonEffect } from "./spells/protectionfromPoison.js";
import { rayofEnfeeblementEffect } from "./spells/rayofEnfeeblement.js";
import { rayofFrostEffect } from "./spells/rayofFrost.js";
import { regenerateEffect } from "./spells/regenerate.js";
import { shieldEffect } from "./spells/shield.js";
import { shieldofFaithEffect } from "./spells/shieldofFaith.js";
import { shillelaghEffect } from "./spells/shillelagh.js";
import { slowEffect } from "./spells/slow.js";
import { spiderClimbEffect } from "./spells/spiderClimb.js";
import { spiritualWeaponEffect } from "./spells/spiritualWeapon.js";
import { stoneskinEffect } from "./spells/stoneskin.js";
import { sunbeamEffect } from "./spells/sunbeam.js";
import { trueStrikeEffect } from "./spells/trueStrike.js";
import { viciousMockeryEffect } from "./spells/viciousMockery.js";
import { wardingBondEffect } from "./spells/wardingBond.js";
import { webEffect } from "./spells/web.js";

export function baseSpellEffect(document, label) {
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

export function generateStatusEffectChange(statusName, priority = 20) {
  return {
    key: "StatusEffect",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: `Convenient Effect: ${statusName}`,
    priority: priority,
  };
}

export function generateMacroChange(macroValues, priority = 20) {
  return {
    key: "macro.itemMacro",
    value: macroValues,
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: priority,
  };
}

export function generateMacroFlags(document, macroText) {
  return {
    macro: {
      data: {
        name: document.name,
        type: "script",
        scope: "global",
        command: macroText,
      },
      options: {},
      apps: {},
      compendium: null,
    },
  };
}

/**
 * This function is mainly for effects that can't be dynamically generated
 * @param {*} document
 */
// eslint-disable-next-line complexity
export function spellEffectAdjustment(document) {
  if (!document.effects) document.effects = [];
  switch (document.name) {
    case "Absorb Elements": {
      document = absorbElementsEffect(document);
      break;
    }
    case "Aid": {
      document = aidEffect(document);
      break;
    }
    case "Alter Self": {
      document = alterSelfEffect(document);
      break;
    }
    case "Animal Friendship": {
      document = animalFriendshipEffect(document);
      break;
    }
    case "Arcane Sword": {
      document = arcaneSwordEffect(document);
      break;
    }
    case "Bane": {
      document = baneEffect(document);
      break;
    }
    case "Banishment": {
      document = banishmentEffect(document);
      break;
    }
    case "Barkskin": {
      document = barkskinEffect(document);
      break;
    }
    case "Beacon of Hope": {
      document = beaconofHopeEffect(document);
      break;
    }
    case "Black Tentacles": {
      document = blackTentaclesEffect(document);
      break;
    }
    case "Bless": {
      document = blessEffect(document);
      break;
    }
    case "Blindness/Deafness": {
      document = blindnessDeafnessEffect(document);
      break;
    }
    case "Call Lightning": {
      document = callLightningEffect(document);
      break;
    }
    case "Charm Person": {
      document = charmPersonEffect(document);
      break;
    }
    case "Command": {
      document = commandEffect(document);
      break;
    }
    case "Confusion": {
      document = confusionEffect(document);
      break;
    }
    case "Contagion": {
      document = contagionEffect(document);
      break;
    }
    case "Darkness": {
      document = darknessEffect(document);
      break;
    }
    case "Darkvision": {
      document = darkvisionEffect(document);
      break;
    }
    case "Divine Favor": {
      document = divineFavorEffect(document);
      break;
    }
    case "Divine Word": {
      document = divineWordEffect(document);
      break;
    }
    case "Dominate Beast": {
      document = dominateBeastEffect(document);
      break;
    }
    case "Dominate Monster": {
      document = dominateMonsterEffect(document);
      break;
    }
    case "Dominate Person": {
      document = dominatePersonEffect(document);
      break;
    }
    case "Enhance Ability": {
      document = enhanceAbilityEffect(document);
      break;
    }
    case "Enlarge/Reduce": {
      document = enlargeReduceEffect(document);
      break;
    }
    case "Entangle": {
      document = entangleEffect(document);
      break;
    }
    case "Eyebite": {
      document = eyebiteEffect(document);
      break;
    }
    case "Faerie Fire": {
      document = faerieFireEffect(document);
      break;
    }
    case "Fear": {
      document = fearEffect(document);
      break;
    }
    case "Feeblemind": {
      document = feeblemindEffect(document);
      break;
    }
    case "Fire Shield": {
      document = fireShieldEffect(document);
      break;
    }
    case "Flame Blade": {
      document = flameBladeEffect(document);
      break;
    }
    case "Flesh to Stone": {
      document = fleshtoStoneEffect(document);
      break;
    }
    case "Fly": {
      document = flyEffect(document);
      break;
    }
    case "Geas": {
      document = geasEffect(document);
      break;
    }
    case "Grease": {
      document = greaseEffect(document);
      break;
    }
    case "Greater Invisibility": {
      document = greaterInvisibilityEffect(document);
      break;
    }
    case "Guiding Bolt": {
      document = guidingBoltEffect(document);
      break;
    }
    case "Haste": {
      document = hasteEffect(document);
      break;
    }
    case "Heroes' Feast": {
      document = heroesFeastEffect(document);
      break;
    }
    case "Heroism": {
      document = heroismEffect(document);
      break;
    }
    case "Hideous Laughter": {
      document = hideousLaughterEffect(document);
      break;
    }
    case "Hold Monster": {
      document = holdMonsterEffect(document);
      break;
    }
    case "Hold Person": {
      document = holdPersonEffect(document);
      break;
    }
    case "Holy Aura": {
      document = holyAuraEffect(document);
      break;
    }
    case "Hypnotic Pattern": {
      document = hypnoticPatternEffect(document);
      break;
    }
    case "Invisibility": {
      document = invisibilityEffect(document);
      break;
    }
    case "Irresistible Dance": {
      document = irresistibleDanceEffect(document);
      break;
    }
    case "Levitate": {
      document = levitateEffect(document);
      break;
    }
    case "Longstrider": {
      document = longstriderEffect(document);
      break;
    }
    case "Mage Armor": {
      document = mageArmorEffect(document);
      break;
    }
    case "Magic Weapon": {
      document = magicWeaponEffect(document);
      break;
    }
    case "Mass Suggestion": {
      document = massSuggestionEffect(document);
      break;
    }
    case "Misty Step": {
      document = mistyStepEffect(document);
      break;
    }
    case "Moonbeam": {
      document = moonbeamEffect(document);
      break;
    }
    case "Phantasmal Killer": {
      document = phantasmalKillerEffect(document);
      break;
    }
    case "Protection from Energy": {
      document = protectionfromEnergyEffect(document);
      break;
    }
    case "Protection from Poison": {
      document = protectionfromPoisonEffect(document);
      break;
    }
    case "Ray of Enfeeblement": {
      document = rayofEnfeeblementEffect(document);
      break;
    }
    case "Ray of Frost": {
      document = rayofFrostEffect(document);
      break;
    }
    case "Regenerate": {
      document = regenerateEffect(document);
      break;
    }
    case "Shield": {
      document = shieldEffect(document);
      break;
    }
    case "Shield of Faith": {
      document = shieldofFaithEffect(document);
      break;
    }
    case "Shillelagh": {
      document = shillelaghEffect(document);
      break;
    }
    case "Slow": {
      document = slowEffect(document);
      break;
    }
    case "Spider Climb": {
      document = spiderClimbEffect(document);
      break;
    }
    case "Spiritual Weapon": {
      document = spiritualWeaponEffect(document);
      break;
    }
    case "Stoneskin": {
      document = stoneskinEffect(document);
      break;
    }
    case "Sunbeam": {
      document = sunbeamEffect(document);
      break;
    }
    case "True Strike": {
      document = trueStrikeEffect(document);
      break;
    }
    case "Vicious Mockery": {
      document = viciousMockeryEffect(document);
      break;
    }
    case "Warding Bond": {
      document = wardingBondEffect(document);
      break;
    }
    case "Web": {
      document = webEffect(document);
      break;
    }
    // no default
  }
  return document;
}
