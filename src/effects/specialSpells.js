import logger from "../logger.js";
import {
  generateStatusEffectChange as baseGenerateStatusEffectChange,
  generateTokenMagicFXChange as baseGenerateTokenMagicFXChange,
  generateATLChange as baseGenerateATLChange,
} from "./effects.js";
import { configureDependencies } from "./macros.js";

// spell effects load start
import { absorbElementsEffect } from "./spells/absorbElements.js";
import { acidArrowEffect } from "./spells/acidArrow.js";
import { aidEffect } from "./spells/aid.js";
import { alterSelfEffect } from "./spells/alterSelf.js";
import { animalFriendshipEffect } from "./spells/animalFriendship.js";
import { arcaneSwordEffect } from "./spells/arcaneSword.js";
import { auraOfLifeEffect } from "./spells/auraOfLife.js";
import { baneEffect } from "./spells/bane.js";
import { banishmentEffect } from "./spells/banishment.js";
import { barkskinEffect } from "./spells/barkskin.js";
import { beaconofHopeEffect } from "./spells/beaconofHope.js";
import { blackTentaclesEffect } from "./spells/blackTentacles.js";
import { blessEffect } from "./spells/bless.js";
import { blurEffect } from "./spells/blur.js";
import { blindnessDeafnessEffect } from "./spells/blindnessDeafness.js";
import { boomingBladeEffect } from "./spells/boomingBlade.js";
import { brandingSmiteEffect } from "./spells/brandingSmite.js";
import { callLightningEffect } from "./spells/callLightning.js";
import { charmPersonEffect } from "./spells/charmPerson.js";
import { chromaticOrbEffect } from "./spells/chromaticOrb.js";
import { chillTouchEffect } from "./spells/chillTouch.js";
import { cloudkillEffect } from "./spells/cloudkill.js";
import { commandEffect } from "./spells/command.js";
import { comprehendLanguagesEffect } from "./spells/comprehendLanguages.js";
import { confusionEffect } from "./spells/confusion.js";
import { contagionEffect } from "./spells/contagion.js";
import { createBonfireEffect } from "./spells/createBonfire.js";
import { crownofStarsEffect } from "./spells/crownofStars.js";
import { crownofMadnessEffect } from "./spells/crownofMadness.js";
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
import { frostbiteEffect } from "./spells/frostbite.js";
import { geasEffect } from "./spells/geas.js";
import { greaseEffect } from "./spells/grease.js";
import { greaterInvisibilityEffect } from "./spells/greaterInvisibility.js";
import { greenFlameBladeEffect } from "./spells/greenFlameBlade.js";
import { guidanceEffect } from "./spells/guidance.js";
import { guidingBoltEffect } from "./spells/guidingBolt.js";
import { hasteEffect } from "./spells/haste.js";
import { heroesFeastEffect } from "./spells/heroesFeast.js";
import { heroismEffect } from "./spells/heroism.js";
import { hexEffect } from "./spells/hex.js";
import { hideousLaughterEffect } from "./spells/hideousLaughter.js";
import { holdMonsterEffect } from "./spells/holdMonster.js";
import { holdPersonEffect } from "./spells/holdPerson.js";
import { holyAuraEffect } from "./spells/holyAura.js";
import { huntersMarkEffect } from "./spells/huntersMark.js";
import { hypnoticPatternEffect } from "./spells/hypnoticPattern.js";
import { iceKnifeEffect } from "./spells/iceKnife.js";
import { incendiaryCloudEffect } from "./spells/incendiaryCloud.js";
import { insectPlagueEffect } from "./spells/insectPlague.js";
import { invisibilityEffect } from "./spells/invisibility.js";
import { irresistibleDanceEffect } from "./spells/irresistibleDance.js";
import { lightEffect } from "./spells/light.js";
import { longstriderEffect } from "./spells/longstrider.js";
import { mageArmorEffect } from "./spells/mageArmor.js";
import { magicWeaponEffect } from "./spells/magicWeapon.js";
import { massSuggestionEffect } from "./spells/massSuggestion.js";
import { mindBlankEffect } from "./spells/mindBlank.js";
import { mirrorImageEffect } from "./spells/mirrorImage.js";
import { mistyStepEffect } from "./spells/mistyStep.js";
import { moonbeamEffect } from "./spells/moonbeam.js";
import { passWithoutTraceEffect } from "./spells/passWithoutTrace.js";
import { phantasmalKillerEffect } from "./spells/phantasmalKiller.js";
import { protectionfromEnergyEffect } from "./spells/protectionfromEnergy.js";
import { protectionfromPoisonEffect } from "./spells/protectionfromPoison.js";
import { rayofEnfeeblementEffect } from "./spells/rayofEnfeeblement.js";
import { rayofFrostEffect } from "./spells/rayofFrost.js";
import { regenerateEffect } from "./spells/regenerate.js";
import { resilientSphereEffect } from "./spells/resilientSphere.js";
import { resistanceEffect } from "./spells/resistance.js";
import { shieldEffect } from "./spells/shield.js";
import { shieldofFaithEffect } from "./spells/shieldofFaith.js";
import { shillelaghEffect } from "./spells/shillelagh.js";
import { silenceEffect } from "./spells/silence.js";
import { sleepEffect } from "./spells/sleep.js";
import { slowEffect } from "./spells/slow.js";
import { spiderClimbEffect } from "./spells/spiderClimb.js";
import { spiritGuardiansEffect } from "./spells/spiritGuardians.js";
import { spiritShroudEffect } from "./spells/spiritShroud.js";
import { spiritualWeaponEffect } from "./spells/spiritualWeapon.js";
import { stoneskinEffect } from "./spells/stoneskin.js";
import { stormSphereEffect } from "./spells/stormSphere.js";
import { sunbeamEffect } from "./spells/sunbeam.js";
import { tolltheDeadEffect } from "./spells/tolltheDead.js";
import { thunderousSmiteEffect } from "./spells/thunderousSmite.js";
import { trueStrikeEffect } from "./spells/trueStrike.js";
import { viciousMockeryEffect } from "./spells/viciousMockery.js";
import { wardingBondEffect } from "./spells/wardingBond.js";
import { webEffect } from "./spells/web.js";
import { witchBoltEffect } from "./spells/witchBolt.js";

// spell effects load stop

var installedModules;

export function spellEffectModules() {
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
    hasCore: itemMacroInstalled && midiQolInstalled && advancedMacrosInstalled && timesUp && daeInstalled && convenientEffectsInstalled,
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

export function generateStatusEffectChange(statusName, priority = 20, macro = false) {
  return baseGenerateStatusEffectChange(statusName, priority, macro);
}

export function generateTokenMagicFXChange(macroValue, priority = 20) {
  return baseGenerateTokenMagicFXChange(macroValue, priority);
}

export function generateATLChange(atlKey, mode, value, priority = 20) {
  return baseGenerateATLChange(atlKey, mode, value, priority);
}

var configured = false;

/**
 * This function is mainly for effects that can't be dynamically generated
 * @param {*} document
 */
// eslint-disable-next-line complexity
export async function spellEffectAdjustment(document) {
  if (!document.effects) document.effects = [];

  // check that we can gen effects
  const deps = spellEffectModules();
  if (!deps.hasCore) {
    logger.warn("Sorry, you're missing some required modules for spell effects. Please install them and try again.", deps);
    return document;
  }
  if (!configured) {
    configured = configureDependencies();
  }

  const name = document.flags.ddbimporter.originalName || document.name;
  switch (name) {
    case "Absorb Elements": {
      document = absorbElementsEffect(document);
      break;
    }
    case "Melf's Acid Arrow":
    case "Acid Arrow": {
      document = acidArrowEffect(document);
      break;
    }
    case "Aid": {
      document = await aidEffect(document);
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
    case "Mordenkainen's Sword":
    case "Arcane Sword": {
      document = await arcaneSwordEffect(document);
      break;
    }
    case "Aura of Life": {
      document = await auraOfLifeEffect(document);
      break;
    }
    case "Bane": {
      document = baneEffect(document);
      break;
    }
    case "Banishment": {
      document = await banishmentEffect(document);
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
    case "Evard's Black Tentacles":
    case "Black Tentacles": {
      document = await blackTentaclesEffect(document);
      break;
    }
    case "Bless": {
      document = blessEffect(document);
      break;
    }
    case "Blur": {
      document = blurEffect(document);
      break;
    }
    case "Blindness/Deafness": {
      document = await blindnessDeafnessEffect(document);
      break;
    }
    case "Booming Blade": {
      document = await boomingBladeEffect(document);
      break;
    }
    case "Branding Smite": {
      document = await brandingSmiteEffect(document);
      break;
    }
    case "Call Lightning": {
      document = await callLightningEffect(document);
      break;
    }
    case "Charm Person": {
      document = charmPersonEffect(document);
      break;
    }
    case "Chill Touch": {
      document = await chillTouchEffect(document);
      break;
    }
    case "Chromatic Orb": {
      document = await chromaticOrbEffect(document);
      break;
    }
    case "Cloudkill": {
      document = await cloudkillEffect(document);
      break;
    }
    case "Command": {
      document = commandEffect(document);
      break;
    }
    case "Comprehend Languages": {
      document = comprehendLanguagesEffect(document);
      break;
    }
    case "Confusion": {
      document = await confusionEffect(document);
      break;
    }
    case "Contagion": {
      document = await contagionEffect(document);
      break;
    }
    case "Crown of Stars": {
      document = await crownofStarsEffect(document);
      break;
    }
    case "Crown of Madness": {
      document = crownofMadnessEffect(document);
      break;
    }
    case "Create Bonfire": {
      document = await createBonfireEffect(document);
      break;
    }
    case "Darkness": {
      document = await darknessEffect(document);
      break;
    }
    case "Darkvision": {
      document = await darkvisionEffect(document);
      break;
    }
    case "Divine Favor": {
      document = divineFavorEffect(document);
      break;
    }
    case "Divine Word": {
      document = await divineWordEffect(document);
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
      document = await enhanceAbilityEffect(document);
      break;
    }
    case "Enlarge/Reduce": {
      document = await enlargeReduceEffect(document);
      break;
    }
    case "Entangle": {
      document = entangleEffect(document);
      break;
    }
    case "Eyebite": {
      document = await eyebiteEffect(document);
      break;
    }
    case "Faerie Fire": {
      document = await faerieFireEffect(document);
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
      document = await fireShieldEffect(document);
      break;
    }
    case "Flame Blade": {
      document = await flameBladeEffect(document);
      break;
    }
    case "Flesh to Stone": {
      document = await fleshtoStoneEffect(document);
      break;
    }
    case "Fly": {
      document = flyEffect(document);
      break;
    }
    case "Frostbite": {
      document = frostbiteEffect(document);
      break;
    }
    case "Geas": {
      document = geasEffect(document);
      break;
    }
    case "Grease": {
      document = await greaseEffect(document);
      break;
    }
    case "Greater Invisibility": {
      document = await greaterInvisibilityEffect(document);
      break;
    }
    case "Green-Flame Blade": {
      document = await greenFlameBladeEffect(document);
      break;
    }
    case "Guidance": {
      document = guidanceEffect(document);
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
      document = await heroesFeastEffect(document);
      break;
    }
    case "Heroism": {
      document = await heroismEffect(document);
      break;
    }
    case "Hex": {
      document = await hexEffect(document);
      break;
    }
    case "Tasha's Hideous Laughter":
    case "Hideous Laughter": {
      document = await hideousLaughterEffect(document);
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
    case "Hunter's Mark": {
      document = await huntersMarkEffect(document);
      break;
    }
    case "Hypnotic Pattern": {
      document = hypnoticPatternEffect(document);
      break;
    }
    case "Ice Knife": {
      document = await iceKnifeEffect(document);
      break;
    }
    case "Incendiary Cloud": {
      document = await incendiaryCloudEffect(document);
      break;
    }
    case "Insect Plague": {
      document = await insectPlagueEffect(document);
      break;
    }
    case "Invisibility": {
      document = await invisibilityEffect(document);
      break;
    }
    case "Otto's Irresistible Dance":
    case "Irresistible Dance": {
      document = await irresistibleDanceEffect(document);
      break;
    }
    case "Light": {
      document = lightEffect(document);
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
      document = await magicWeaponEffect(document);
      break;
    }
    case "Mass Suggestion": {
      document = massSuggestionEffect(document);
      break;
    }
    case "Mind Blank": {
      document = mindBlankEffect(document);
      break;
    }
    case "Mirror Image": {
      document = mirrorImageEffect(document);
      break;
    }
    case "Misty Step": {
      document = await mistyStepEffect(document);
      break;
    }
    case "Moonbeam": {
      document = await moonbeamEffect(document);
      break;
    }
    case "Pass Without Trace": {
      document = passWithoutTraceEffect(document);
      break;
    }
    case "Phantasmal Killer": {
      document = phantasmalKillerEffect(document);
      break;
    }
    case "Protection from Energy": {
      document = await protectionfromEnergyEffect(document);
      break;
    }
    case "Protection from Poison": {
      document = protectionfromPoisonEffect(document);
      break;
    }
    case "Ray of Enfeeblement": {
      document = await rayofEnfeeblementEffect(document);
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
    case "Otiluke's Resilient Sphere":
    case "Resilient Sphere": {
      document = resilientSphereEffect(document);
      break;
    }
    case "Resistance": {
      document = resistanceEffect(document);
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
      document = await shillelaghEffect(document);
      break;
    }
    case "Silence": {
      document = await silenceEffect(document);
      break;
    }
    case "Sleep": {
      document = await sleepEffect(document);
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
    case "Spirit Guardians": {
      document = await spiritGuardiansEffect(document);
      break;
    }
    case "Spirit Shroud": {
      document = await spiritShroudEffect(document);
      break;
    }
    case "Spiritual Weapon": {
      document = await spiritualWeaponEffect(document);
      break;
    }
    case "Storm Sphere": {
      document = await stormSphereEffect(document);
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
    case "Toll the Dead": {
      document = await tolltheDeadEffect(document);
      break;
    }
    case "Thunderous Smite": {
      document = await thunderousSmiteEffect(document);
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
      document = await wardingBondEffect(document);
      break;
    }
    case "Web": {
      document = await webEffect(document);
      break;
    }
    case "Witch Bolt": {
      document = await witchBoltEffect(document);
    }
    // no default
  }
  try {
    if (document.effects.length > 0 || hasProperty(document.flags, "itemacro")) {
      setProperty(document, "flags.ddbimporter.effectsApplied", true);
    }
  } catch (err) {
    await Promise.all(document);
    logger.error("Error applying effects: ", { err, document });
  }
  return document;
}
