import logger from "../logger.js";
import {
  forceItemEffect,
  effectModules,
  forceManualReaction,
  baseEffect,
  applyDefaultMidiFlags,
} from "./effects.js";

// spell effects load start
import { absorbElementsEffect } from "./spells/absorbElements.js";
import { acidArrowEffect } from "./spells/acidArrow.js";
import { aidEffect } from "./spells/aid.js";
import { alterSelfEffect } from "./spells/alterSelf.js";
import { animalFriendshipEffect } from "./spells/animalFriendship.js";
import { arcaneSwordEffect } from "./spells/arcaneSword.js";
import { armorOfAgathysEffect } from "./spells/armorOfAgathys.js";
import { auraOfLifeEffect } from "./spells/auraOfLife.js";
import { baneEffect } from "./spells/bane.js";
import { banishmentEffect } from "./spells/banishment.js";
import { barkskinEffect } from "./spells/barkskin.js";
import { beaconofHopeEffect } from "./spells/beaconofHope.js";
import { blackTentaclesEffect } from "./spells/blackTentacles.js";
import { blessEffect } from "./spells/bless.js";
import { blindnessDeafnessEffect } from "./spells/blindnessDeafness.js";
import { blurEffect } from "./spells/blur.js";
import { boomingBladeEffect } from "./spells/boomingBlade.js";
import { brandingSmiteEffect } from "./spells/brandingSmite.js";
import { callLightningEffect } from "./spells/callLightning.js";
import { charmPersonEffect } from "./spells/charmPerson.js";
import { chillTouchEffect } from "./spells/chillTouch.js";
import { chromaticOrbEffect } from "./spells/chromaticOrb.js";
import { cloudkillEffect } from "./spells/cloudkill.js";
import { colorSprayEffect } from "./spells/colorSpray.js";
import { commandEffect } from "./spells/command.js";
import { comprehendLanguagesEffect } from "./spells/comprehendLanguages.js";
import { confusionEffect } from "./spells/confusion.js";
import { contagionEffect } from "./spells/contagion.js";
import { createBonfireEffect } from "./spells/createBonfire.js";
import { crownofMadnessEffect } from "./spells/crownofMadness.js";
import { crownofStarsEffect } from "./spells/crownofStars.js";
import { dancingLightsEffect } from "./spells/dancingLights.js";
import { darknessEffect } from "./spells/darkness.js";
import { darkvisionEffect } from "./spells/darkvision.js";
import { divineFavorEffect } from "./spells/divineFavor.js";
import { divineWordEffect } from "./spells/divineWord.js";
import { dominateBeastEffect } from "./spells/dominateBeast.js";
import { dominateMonsterEffect } from "./spells/dominateMonster.js";
import { dominatePersonEffect } from "./spells/dominatePerson.js";
import { elementalWeaponEffect } from "./spells/elementalWeapon.js";
import { enhanceAbilityEffect } from "./spells/enhanceAbility.js";
import { enlargeReduceEffect } from "./spells/enlargeReduce.js";
import { ensnaringStrikeEffect } from "./spells/ensnaringStrike.js";
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
import { hailOfThornsEffect } from "./spells/hailOfThorns.js";
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
import { polymorphEffect } from "./spells/polymorph.js";
import { protectionfromEnergyEffect } from "./spells/protectionfromEnergy.js";
import { protectionfromPoisonEffect } from "./spells/protectionfromPoison.js";
import { psychicScreamEffect } from "./spells/psychicScream.js";
import { rayofSicknessEffect } from "./spells/rayOfSickness.js";
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
import { spikeGrowthEffect } from "./spells/spikeGrowth.js";
import { spiritGuardiansEffect } from "./spells/spiritGuardians.js";
import { spiritShroudEffect } from "./spells/spiritShroud.js";
import { spiritualWeaponEffect } from "./spells/spiritualWeapon.js";
import { stoneskinEffect } from "./spells/stoneskin.js";
import { stormSphereEffect } from "./spells/stormSphere.js";
import { sunbeamEffect } from "./spells/sunbeam.js";
import { swordBurstEffect } from "./spells/swordburst.js";
import { thunderclapEffect } from "./spells/thunderclap.js";
import { thunderousSmiteEffect } from "./spells/thunderousSmite.js";
import { tolltheDeadEffect } from "./spells/tolltheDead.js";
import { trueStrikeEffect } from "./spells/trueStrike.js";
import { viciousMockeryEffect } from "./spells/viciousMockery.js";
import { vitriolicSphereEffect } from "./spells/vitriolicSphere.js";
import { wardingBondEffect } from "./spells/wardingBond.js";
import { webEffect } from "./spells/web.js";
import { witchBoltEffect } from "./spells/witchBolt.js";
import { zephyrStrikeEffect } from "./spells/zephyrStrike.js";


export function baseSpellEffect(document, label,
  { transfer = false, disabled = false } = {}
) {
  return baseEffect(document, label, { transfer, disabled });
}


// eslint-disable-next-line complexity
async function basicSpellEffects(document) {
  const name = document.flags.ddbimporter?.originalName ?? document.name;

  logger.debug(`Adding basic effects to ${name}`);
  switch (name) {
    case "Absorb Elements": {
      document = await absorbElementsEffect(document);
      break;
    }
    case "Aid": {
      document = await aidEffect(document);
      break;
    }
    case "Animal Friendship": {
      document = animalFriendshipEffect(document);
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
    case "Barkskin": {
      document = barkskinEffect(document);
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
    case "Blindness/Deafness": {
      document = await blindnessDeafnessEffect(document);
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
    case "Contagion": {
      document = await contagionEffect(document);
      break;
    }
    case "Crown of Madness": {
      document = crownofMadnessEffect(document);
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
    case "Ensnaring Strike": {
      document = await ensnaringStrikeEffect(document);
      break;
    }
    case "Entangle": {
      document = entangleEffect(document);
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
    case "Flesh to Stone": {
      document = await fleshtoStoneEffect(document);
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
      document = await greaseEffect(document);
      break;
    }
    case "Greater Invisibility": {
      document = await greaterInvisibilityEffect(document);
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
    case "Hypnotic Pattern": {
      document = hypnoticPatternEffect(document);
      break;
    }
    case "Invisibility": {
      document = await invisibilityEffect(document);
      break;
    }
    case "Light": {
      document = lightEffect(document);
      break;
    }
    case "Mage Armor": {
      document = mageArmorEffect(document);
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
    case "Pass Without Trace": {
      document = passWithoutTraceEffect(document);
      break;
    }
    case "Phantasmal Killer": {
      document = await phantasmalKillerEffect(document);
      break;
    }
    case "Protection from Poison": {
      document = protectionfromPoisonEffect(document);
      break;
    }
    case "Psychic Scream": {
      document = psychicScreamEffect(document);
      break;
    }
    case "Ray of Sickness": {
      document = rayofSicknessEffect(document);
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
    case "Stoneskin": {
      document = stoneskinEffect(document);
      break;
    }
    case "Sunbeam": {
      document = sunbeamEffect(document);
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
    // no default
  }

  return document;
}

/**
 * This function is for effects that can't be dynamically generated
 * @param {*} document
 */
// eslint-disable-next-line complexity
async function midiEffectAdjustment(document) {
  const deps = effectModules();
  const name = document.flags.ddbimporter?.originalName ?? document.name;
  document = applyDefaultMidiFlags(document);

  // check that we can gen effects
  if (!deps.hasCore) {
    logger.warn("Sorry, you're missing some required modules for advanced automation of spell effects. Please install them and try again.", deps);
    return document;
  }

  logger.debug(`Adding effects to ${name}`);
  switch (name) {
    case "Melf's Acid Arrow":
    case "Acid Arrow": {
      document = acidArrowEffect(document);
      break;
    }
    case "Alter Self": {
      document = alterSelfEffect(document);
      break;
    }
    case "Mordenkainen's Sword":
    case "Arcane Sword": {
      document = await arcaneSwordEffect(document);
      break;
    }
    case "Armor of Agathys": {
      document = await armorOfAgathysEffect(document);
      break;
    }
    case "Banishment": {
      document = await banishmentEffect(document);
      break;
    }
    case "Beacon of Hope": {
      document = beaconofHopeEffect(document);
      break;
    }
    case "Blur": {
      document = blurEffect(document);
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
    case "Chromatic Orb": {
      document = await chromaticOrbEffect(document);
      break;
    }
    case "Cloudkill": {
      document = await cloudkillEffect(document);
      break;
    }
    case "Color Spray": {
      document = await colorSprayEffect(document);
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
    case "Counterspell": {
      document = forceManualReaction(document);
      break;
    }
    case "Crown of Stars": {
      document = await crownofStarsEffect(document);
      break;
    }
    case "Create Bonfire": {
      document = await createBonfireEffect(document);
      break;
    }
    case "Dancing Lights": {
      document = await dancingLightsEffect(document);
      break;
    }
    case "Darkness": {
      document = await darknessEffect(document);
      break;
    }
    case "Divine Word": {
      document = await divineWordEffect(document);
      break;
    }
    case "Elemental Weapon": {
      document = await elementalWeaponEffect(document);
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
    case "Eyebite": {
      document = await eyebiteEffect(document);
      break;
    }
    case "Faerie Fire": {
      document = await faerieFireEffect(document);
      break;
    }
    case "Feather Fall": {
      document = forceManualReaction(document);
      break;
    }
    case "Flame Blade": {
      document = await flameBladeEffect(document);
      break;
    }
    case "Frostbite": {
      document = frostbiteEffect(document);
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
    case "Hail of Thorns": {
      document = await hailOfThornsEffect(document);
      break;
    }
    case "Hex": {
      document = await hexEffect(document);
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
    case "Otto's Irresistible Dance":
    case "Irresistible Dance": {
      document = await irresistibleDanceEffect(document);
      break;
    }
    case "Longstrider": {
      document = longstriderEffect(document);
      break;
    }
    case "Magic Weapon": {
      document = await magicWeaponEffect(document);
      break;
    }
    case "Misty Step": {
      if (!deps.autoAnimationsInstalled) {
        document = await mistyStepEffect(document);
      }
      break;
    }
    case "Moonbeam": {
      document = await moonbeamEffect(document);
      break;
    }
    case "Polymorph": {
      document = polymorphEffect(document);
      break;
    }
    case "Protection from Energy": {
      document = await protectionfromEnergyEffect(document);
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
    case "Shillelagh": {
      document = await shillelaghEffect(document);
      break;
    }
    case "Silence": {
      document = await silenceEffect(document);
      break;
    }
    case "Spike Growth": {
      document = await spikeGrowthEffect(document);
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
    case "Sword Burst": {
      document = swordBurstEffect(document);
      break;
    }
    case "Thunderclap": {
      document = thunderclapEffect(document);
      break;
    }
    case "Thunderous Smite": {
      document = await thunderousSmiteEffect(document);
      break;
    }
    case "Toll the Dead": {
      document = await tolltheDeadEffect(document);
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
    case "Vitriolic Sphere": {
      document = await vitriolicSphereEffect(document);
      break;
    }
    case "Witch Bolt": {
      document = await witchBoltEffect(document);
      break;
    }
    case "Zephyr Strike": {
      document = await zephyrStrikeEffect(document);
      break;
    }
    // no default
  }

  return document;
}


export async function spellEffectAdjustment(document, midiEffects = false) {
  if (!document.effects) document.effects = [];
  document = await basicSpellEffects(document);
  if (midiEffects) document = await midiEffectAdjustment(document);
  try {
    document = forceItemEffect(document);
  } catch (err) {
    await Promise.all(document);
    logger.error("Error applying effects: ", { err, document });
  }
  return document;
}
