import { applyDefaultMidiFlags } from "./effects.js";

// effect loads
import { arcaneWardEffect } from "./feats/arcaneWard.js";
import { auraOfHateEffect } from "./feats/auraOfHate.js";
import { bardicInspirationEffect } from "./feats/bardicInspiration.js";
import { bladesongEffect } from "./feats/bladesong.js";
import { blessedHealerEffect } from "./feats/blessedHealer.js";
import { blessedStrikesEffect } from "./feats/blessedStrikes.js";
import { cloudRuneEffect } from "./feats/cloudRune.js";
import { crossbowExpertEffect } from "./feats/crossbowExpert.js";
import { crusherCriticalEffect } from "./feats/crusherCritical.js";
import { crusherEffect } from "./feats/crusher.js";
import { dauntingRoarEffect } from "./feats/dauntingRoar.js";
import { defensiveDuelistEffect } from "./feats/defensiveDuelist.js";
import { deflectMissilesEffect } from "./feats/deflectMissiles.js";
import { deftStrikeEffect } from "./feats/deftStike.js";
import { evasionEffect } from "./feats/evasion.js";
import { favoredFoeEffect } from "./feats/favoredFoe.js";
import { fightingStyleInterceptionEffect } from "./feats/fightingStyles.js";
import { fireRuneEffect } from "./feats/fireRune.js";
import { fontOfMagicEffect } from "./feats/fontOfMagic.js";
import { formOfTheBeastReactionEffect } from "./feats/formOfTheBeastReaction.js";
import { frostRuneEffect } from "./feats/frostRune.js";
import { giantsMightEffect } from "./feats/giantsMight.js";
import { hadozeDodgeEffect } from "./feats/hadozeeDodge.js";
import { heavyArmorMasterEffect } from "./feats/heavyArmorMaster.js";
import { hillRuneEffect } from "./feats/hillRune.js";
import { indomitableEffect } from "./feats/indomitable.js";
import { maneuversEffect } from "./feats/maneuvers.js";
import { mantleOfInspirationEffect } from "./feats/mantleOfInspiration.js";
import { maskOfTheWildEffect } from "./feats/maskOfTheWild.js";
import { mindLinkEffect } from "./feats/mindLink.js";
import { momentaryStasis } from "./feats/momentaryStasis.js";
import { pactMagicEffect } from "./feats/pactMagic.js";
import { patientDefenseEffect } from "./feats/patientDefense.js";
import { piercerCriticalEffect, piercerRerollEffect } from "./feats/piercer.js";
import { planarWarriorEffect } from "./feats/planarWarrior.js";
import { potentCantripEffect } from "./feats/potentCantrip.js";
import { powerfulBuild } from "./feats/powerfulBuild.js";
import { radiantSoulEffect } from "./feats/radiantSoul.js";
import { runeCarverEffect } from "./feats/runeCarver.js";
import { sacredWeaponEffect } from "./feats/sacredWeapon.js";
import { savageAttackerEffect } from "./feats/savageAttacker.js";
import { sculptSpellsEffect } from "./feats/sculptSpells.js";
import { sharpShooterEffect } from "./feats/sharpShooter.js";
import { shiftEffect } from "./feats/shift.js";
import { slasherCriticalEffect } from "./feats/slasherCritical.js";
import { slasherReduceSpeedEffect } from "./feats/slasherReduceSpeed.js";
import { slayersPreyEffect } from "./feats/slayersPrey.js";
import { squireOfSolamniaEffect } from "./feats/squireOfSolamnia.js";
import { steadyAimEffect } from "./feats/steadyAim.js";
import { stoneRuneEffect } from "./feats/stoneRune.js";
import { stonesEnduranceEffect } from "./feats/stonesEndurance.js";
import { stormRuneEffect } from "./feats/stormRune.js";
import { unarmoredMovementEffect } from "./feats/unarmoredMovement.js";
import { vedalkenDispassionEffect } from "./feats/vedalkenDispassion.js";
import { vigilantBlessingEffect } from "./feats/vigilantBlessing.js";
import { visageOfTheAstralSelfEffect } from "./feats/visageOfTheAstralSelf.js";
import { furyOfTheSmallEffect } from "./feats/furryOfTheSmall.js";
import { intimidatingPresenceEffect } from "./feats/intimidatingPresence.js";
import { ragingStormSeaEffect } from "./feats/ragingStormSea.js";
import { ragingStormTundraEffect } from "./feats/ragingStormTundra.js";
import { stormAuraTundraEffect } from "./feats/stormAuraTundra.js";
import { giantStatureEffect } from "./feats/giantStature.js";
import { demiurgicColossusEffect } from "./feats/demiurgicColossus.js";
import { greatWeaponMasterEffect } from "./feats/greatWeaponMaster.js";
import { sneakAttackEffect } from "./feats/sneakAttack.js";
import { aspectOfTheBeastBearEffect } from "./feats/aspectOfTheBeastBear.js";
import { flurryOfBlowsEffect } from "./feats/flurryOfBlows.js";
import { songOfVictoryEffect } from "./feats/songOfVictory.js";
import { twinklingConstellationsEffect } from "./feats/twinklingConstellations.js";
import { armsOfTheAstralSelfEffect } from "./feats/armsOfTheAstralSelf.js";
import { ghostWalkEffect } from "./feats/ghostWalk.js";
import { foeSlayerEffect } from "./feats/foeSlayer.js";
import { AutoEffects, MidiEffects } from "../parser/enrichers/effects/_module.mjs";


export function baseFeatEffect(document, label,
  { transfer = false, disabled = false, description = null, durationSeconds = null,
    durationRounds = null, durationTurns = null } = {},
) {
  return AutoEffects.BaseEffect(document, label, {
    transfer, disabled, description, durationSeconds, durationRounds, durationTurns,
  });
}

// eslint-disable-next-line complexity
async function midiFeatureEffects(ddb, character, document) {
  const name = document.flags.ddbimporter?.originalName ?? document.name;

  document = applyDefaultMidiFlags(document);

  if (name.startsWith("Maneuvers: ") && ddb && character) {
    document = await maneuversEffect(ddb, character, document);
    return document;
  } else if (name.startsWith("Rune Carver: ")) {
    document = await runeCarverEffect(document);
    return document;
  }

  switch (name) {
    case "Arcane Ward": {
      document = await arcaneWardEffect(document);
      break;
    }
    case "Aspect of the Beast: Bear": {
      document = await aspectOfTheBeastBearEffect(document);
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
    case "Deft Strike": {
      document = await deftStrikeEffect(document);
      break;
    }
    case "Evasion": {
      document = evasionEffect(document);
      break;
    }
    case "Favored Foe": {
      document = await favoredFoeEffect(document);
      break;
    }
    case "Foe Slayer": {
      document = foeSlayerEffect(document);
      break;
    }
    case "Fighting Style: Interception": {
      document = fightingStyleInterceptionEffect(document);
      break;
    }
    case "Form of the Beast: Tail (reaction)": {
      document = formOfTheBeastReactionEffect(document);
      break;
    }
    case "Fury of the Small": {
      document = await furyOfTheSmallEffect(document);
      break;
    }
    case "Flurry of Blows": {
      document = await flurryOfBlowsEffect(document);
      break;
    }
    case "Giant's Might": {
      document = giantsMightEffect(document);
      break;
    }
    case "Glide (Reaction)": {
      document = MidiEffects.forceManualReaction(document);
      break;
    }
    case "Hadozee Dodge": {
      document = hadozeDodgeEffect(document);
      break;
    }
    case "Indomitable": {
      document = indomitableEffect(document);
      break;
    }
    case "Intimidating Presence": {
      document = intimidatingPresenceEffect(document);
      break;
    }
    case "Mantle of Inspiration": {
      document = await mantleOfInspirationEffect(document);
      break;
    }
    case "Mask of the Wild": {
      document = await maskOfTheWildEffect(document);
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
    case "Celestial Revelation (Radiant Soul)":
    case "Radiant Soul": {
      document = await radiantSoulEffect(document);
      break;
    }
    case "Raging Storm: Sea": {
      document = await ragingStormSeaEffect(document);
      break;
    }
    case "Raging Storm: Tundra": {
      document = await ragingStormTundraEffect(document);
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
    case "Squire of Solamnia: Precise Strike": {
      document = await squireOfSolamniaEffect(document);
      break;
    }
    case "Sneak Attack": {
      document = await sneakAttackEffect(document);
      break;
    }
    case "Stone's Endurance":
    case "Stone’s Endurance": {
      document = stonesEnduranceEffect(document);
      break;
    }
    case "Storm Aura: Tundra": {
      document = await stormAuraTundraEffect(document);
      break;
    }
    // case "Storm Soul: Desert":
    // case "Storm Soul: Sea":
    // case "Storm Soul: Tundra":
    // case "Storm Soul": {
    //   if (ddb) document = await stormSoulEffect(ddb, document);
    //   break;
    // }
    case "Swiftstride Reaction": {
      document = MidiEffects.forceManualReaction(document);
      break;
    }
    case "Vedalken Dispassion": {
      document = vedalkenDispassionEffect(document);
      break;
    }
    // no default
  }
  return document;
}

// eslint-disable-next-line complexity
export async function featureEffectAdjustment(ddb, character, document, midiEffects = false) {
  if (foundry.utils.getProperty(document, "flags.ddbimporter.dndbeyond.homebrew")) return document;
  if (!document.effects) document.effects = [];

  const name = document.flags.ddbimporter?.originalName ?? document.name;

  // check that we can gen effects
  const deps = AutoEffects.effectModules();

  // effects to always apply
  switch (name) {
    case "Aura of Hate": {
      document = auraOfHateEffect(document);
      break;
    }
    case "Arms of the Astral Self": {
      document = armsOfTheAstralSelfEffect(document);
      break;
    }
    case "Bladesong": {
      document = bladesongEffect(document);
      break;
    }
    case "Defensive Duelist": {
      document = defensiveDuelistEffect(document);
      break;
    }
    case "Demiurgic Colossus": {
      document = demiurgicColossusEffect(document);
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
    case "Ghost Walk": {
      document = ghostWalkEffect(document);
      break;
    }
    case "Giant Stature":
    case "Giant's Havoc: Giant Stature": {
      document = giantStatureEffect(document);
      break;
    }
    case "Great Weapon Master": {
      document = greatWeaponMasterEffect(document);
      break;
    }
    case "Heavy Armor Master": {
      document = heavyArmorMasterEffect(document);
      break;
    }
    case "Hill Rune": {
      document = hillRuneEffect(document);
      break;
    }
    case "Pact Magic": {
      document = pactMagicEffect(document);
      break;
    }
    case "Channel Divinity: Sacred Weapon":
    case "Sacred Weapon": {
      document = sacredWeaponEffect(document);
      break;
    }
    case "Song of Victory": {
      document = songOfVictoryEffect(document);
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
    case "Storm Rune": {
      document = stormRuneEffect(document);
      break;
    }
    case "Twinkling Constellations": {
      document = twinklingConstellationsEffect(document);
      break;
    }
    case "Unarmored Movement": {
      document = unarmoredMovementEffect(document);
      break;
    }
    case "Vigilant Blessing": {
      document = vigilantBlessingEffect(document);
      break;
    }
    case "Visage of the Astral Self": {
      document = visageOfTheAstralSelfEffect(document);
      break;
    }
    // no default
  }

  if (deps.daeInstalled) {
    switch (name) {
      case "Mind Link Response": {
        document = mindLinkEffect(document);
        break;
      }
      case "Momentary Stasis": {
        document = momentaryStasis(document);
        break;
      }
      case "Vigilant Blessing": {
        document = vigilantBlessingEffect(document);
        break;
      }
      // no default
    }
  }

  if (!deps.hasCore || !midiEffects) {
    return AutoEffects.forceDocumentEffect(document);
  }

  if (deps.midiQolInstalled && midiEffects) {
    document = await midiFeatureEffects(ddb, character, document);
  }

  return AutoEffects.forceDocumentEffect(document);
}
