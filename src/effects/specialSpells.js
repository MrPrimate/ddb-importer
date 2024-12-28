import { logger } from "../lib/_module.mjs";
import AutoEffects from "../parser/enrichers/effects/AutoEffects.mjs";
import {
  effectModules,
  applyDefaultMidiFlags,
} from "./effects.js";

// spell effects load start
import { absorbElementsEffect } from "./spells/absorbElements.js";
import { aidEffect } from "./spells/aid.js";
import { auraOfLifeEffect } from "./spells/auraOfLife.js";
import { banishmentEffect } from "./spells/banishment.js";
import { blackTentaclesEffect } from "./spells/blackTentacles.js";
import { boomingBladeEffect } from "./spells/boomingBlade.js";
import { brandingSmiteEffect } from "./spells/brandingSmite.js";
import { callLightningEffect } from "./spells/callLightning.js";
import { chillTouchEffect } from "./spells/chillTouch.js";
import { chromaticOrbEffect } from "./spells/chromaticOrb.js";
import { cloudkillEffect } from "./spells/cloudkill.js";
import { colorSprayEffect } from "./spells/colorSpray.js";
import { commandEffect } from "./spells/command.js";
import { confusionEffect } from "./spells/confusion.js";
import { contagionEffect } from "./spells/contagion.js";
import { createBonfireEffect } from "./spells/createBonfire.js";
import { crownofStarsEffect } from "./spells/crownofStars.js";
import { darkvisionEffect } from "./spells/darkvision.js";
import { divineWordEffect } from "./spells/divineWord.js";
import { enhanceAbilityEffect } from "./spells/enhanceAbility.js";
import { enlargeReduceEffect } from "./spells/enlargeReduce.js";
import { ensnaringStrikeEffect } from "./spells/ensnaringStrike.js";
import { eyebiteEffect } from "./spells/eyebite.js";
import { fireShieldEffect } from "./spells/fireShield.js";
import { flameBladeEffect } from "./spells/flameBlade.js";
import { fleshtoStoneEffect } from "./spells/fleshtoStone.js";
import { greaseEffect } from "./spells/grease.js";
import { greenFlameBladeEffect } from "./spells/greenFlameBlade.js";
import { hailOfThornsEffect } from "./spells/hailOfThorns.js";
import { heroesFeastEffect } from "./spells/heroesFeast.js";
import { heroismEffect } from "./spells/heroism.js";
import { hexEffect } from "./spells/hex.js";
import { hideousLaughterEffect } from "./spells/hideousLaughter.js";
import { huntersMarkEffect } from "./spells/huntersMark.js";
import { iceKnifeEffect } from "./spells/iceKnife.js";
import { incendiaryCloudEffect } from "./spells/incendiaryCloud.js";
import { insectPlagueEffect } from "./spells/insectPlague.js";
import { irresistibleDanceEffect } from "./spells/irresistibleDance.js";
import { mistyStepEffect } from "./spells/mistyStep.js";
import { moonbeamEffect } from "./spells/moonbeam.js";
import { phantasmalKillerEffect } from "./spells/phantasmalKiller.js";
import { resilientSphereEffect } from "./spells/resilientSphere.js";
import { resistanceEffect } from "./spells/resistance.js";
import { silenceEffect } from "./spells/silence.js";
import { sleepEffect } from "./spells/sleep.js";
import { spikeGrowthEffect } from "./spells/spikeGrowth.js";
import { spiritGuardiansEffect } from "./spells/spiritGuardians.js";
import { spiritShroudEffect } from "./spells/spiritShroud.js";
import { spiritualWeaponEffect } from "./spells/spiritualWeapon.js";
import { stormSphereEffect } from "./spells/stormSphere.js";
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
  { transfer = false, disabled = false, description = null, durationSeconds = null,
    durationRounds = null, durationTurns = null } = {},
) {
  return AutoEffects.BaseEffect(document, label, {
    transfer, disabled, description, durationSeconds, durationRounds, durationTurns,
  });
}

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
    case "Absorb Elements": {
      document = await absorbElementsEffect(document);
      break;
    }
    case "Aid": {
      document = await aidEffect(document);
      break;
    }
    case "Aura of Life": {
      document = await auraOfLifeEffect(document);
      break;
    }
    case "Banishment": {
      document = await banishmentEffect(document);
      break;
    }
    case "Evard's Black Tentacles":
    case "Black Tentacles": {
      document = await blackTentaclesEffect(document);
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
      document = await commandEffect(document);
      break;
    }
    case "Contagion": {
      document = await contagionEffect(document);
      break;
    }
    case "Chill Touch": {
      document = await chillTouchEffect(document);
      break;
    }
    case "Confusion": {
      document = await confusionEffect(document);
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
    case "Darkvision": {
      document = await darkvisionEffect(document);
      break;
    }
    case "Divine Word": {
      document = await divineWordEffect(document);
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
    case "Ensnaring Strike": {
      document = await ensnaringStrikeEffect(document);
      break;
    }
    case "Eyebite": {
      document = await eyebiteEffect(document);
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
    case "Grease": {
      document = await greaseEffect(document);
      break;
    }
    case "Green-Flame Blade": {
      document = await greenFlameBladeEffect(document);
      break;
    }
    case "Hail of Thorns": {
      document = await hailOfThornsEffect(document);
      break;
    }
    case "Heroism": {
      document = await heroismEffect(document);
      break;
    }
    case "Heroes' Feast": {
      document = await heroesFeastEffect(document);
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
    case "Phantasmal Killer": {
      document = await phantasmalKillerEffect(document);
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
    case "Silence": {
      document = await silenceEffect(document);
      break;
    }
    case "Sleep": {
      document = await sleepEffect(document);
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
  if (foundry.utils.getProperty(document, "flags.ddbimporter.dndbeyond.homebrew")) return document;
  // KNOWN_ISSUE_4_0: spell effect fixes
  return document;
  // eslint-disable-next-line no-unreachable
  if (!document.effects) document.effects = [];
  if (midiEffects) document = await midiEffectAdjustment(document);
  try {
    document = AutoEffects.forceDocumentEffect(document);
  } catch (err) {
    await Promise.all(document);
    logger.error("Error applying effects: ", { err, document });
  }
  return document;
}
