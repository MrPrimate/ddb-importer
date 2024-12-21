import { applyDefaultMidiFlags } from "./effects.js";

// effect loads
import { favoredFoeEffect } from "./feats/favoredFoe.js";
import { maneuversEffect } from "./feats/maneuvers.js";
import { mantleOfInspirationEffect } from "./feats/mantleOfInspiration.js";
import { maskOfTheWildEffect } from "./feats/maskOfTheWild.js";
import { patientDefenseEffect } from "./feats/patientDefense.js";
import { planarWarriorEffect } from "./feats/planarWarrior.js";
import { radiantSoulEffect } from "./feats/radiantSoul.js";
import { runeCarverEffect } from "./feats/runeCarver.js";
import { slayersPreyEffect } from "./feats/slayersPrey.js";
import { squireOfSolamniaEffect } from "./feats/squireOfSolamnia.js";
import { ragingStormSeaEffect } from "./feats/ragingStormSea.js";
import { ragingStormTundraEffect } from "./feats/ragingStormTundra.js";
import { stormAuraTundraEffect } from "./feats/stormAuraTundra.js";
import { flurryOfBlowsEffect } from "./feats/flurryOfBlows.js";
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
    case "Favored Foe": {
      document = await favoredFoeEffect(document);
      break;
    }
    case "Flurry of Blows": {
      document = await flurryOfBlowsEffect(document);
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

  // check that we can gen effects
  const deps = AutoEffects.effectModules();

  if (deps.midiQolInstalled && midiEffects) {
    document = await midiFeatureEffects(ddb, character, document);
  }

  return AutoEffects.forceDocumentEffect(document);
}
