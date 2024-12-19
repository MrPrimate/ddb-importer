import { applyDefaultMidiFlags } from "./effects.js";

// effect loads
import { deflectMissilesEffect } from "./feats/deflectMissiles.js";
import { favoredFoeEffect } from "./feats/favoredFoe.js";
import { formOfTheBeastReactionEffect } from "./feats/formOfTheBeastReaction.js";
import { giantsMightEffect } from "./feats/giantsMight.js";
import { hadozeDodgeEffect } from "./feats/hadozeeDodge.js";
import { heavyArmorMasterEffect } from "./feats/heavyArmorMaster.js";
import { indomitableEffect } from "./feats/indomitable.js";
import { maneuversEffect } from "./feats/maneuvers.js";
import { mantleOfInspirationEffect } from "./feats/mantleOfInspiration.js";
import { maskOfTheWildEffect } from "./feats/maskOfTheWild.js";
import { mindLinkEffect } from "./feats/mindLink.js";
import { momentaryStasis } from "./feats/momentaryStasis.js";
import { patientDefenseEffect } from "./feats/patientDefense.js";
import { planarWarriorEffect } from "./feats/planarWarrior.js";
import { radiantSoulEffect } from "./feats/radiantSoul.js";
import { runeCarverEffect } from "./feats/runeCarver.js";
import { savageAttackerEffect } from "./feats/savageAttacker.js";
import { shiftEffect } from "./feats/shift.js";
import { slayersPreyEffect } from "./feats/slayersPrey.js";
import { squireOfSolamniaEffect } from "./feats/squireOfSolamnia.js";
import { steadyAimEffect } from "./feats/steadyAim.js";
import { unarmoredMovementEffect } from "./feats/unarmoredMovement.js";
import { vigilantBlessingEffect } from "./feats/vigilantBlessing.js";
import { visageOfTheAstralSelfEffect } from "./feats/visageOfTheAstralSelf.js";
import { intimidatingPresenceEffect } from "./feats/intimidatingPresence.js";
import { ragingStormSeaEffect } from "./feats/ragingStormSea.js";
import { ragingStormTundraEffect } from "./feats/ragingStormTundra.js";
import { stormAuraTundraEffect } from "./feats/stormAuraTundra.js";
import { giantStatureEffect } from "./feats/giantStature.js";
import { demiurgicColossusEffect } from "./feats/demiurgicColossus.js";
import { flurryOfBlowsEffect } from "./feats/flurryOfBlows.js";
import { songOfVictoryEffect } from "./feats/songOfVictory.js";
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
    case "Deflect Missiles": {
      document = deflectMissilesEffect(document);
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
    case "Form of the Beast: Tail (reaction)": {
      document = formOfTheBeastReactionEffect(document);
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
    case "Savage Attacker": {
      document = savageAttackerEffect(document);
      break;
    }
    case "Shift": {
      if (ddb && character) document = shiftEffect(ddb, character, document);
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
    case "Demiurgic Colossus": {
      document = demiurgicColossusEffect(document);
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
    case "Heavy Armor Master": {
      document = heavyArmorMasterEffect(document);
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
