import { applyDefaultMidiFlags } from "./effects.js";

// effect loads
import { favoredFoeEffect } from "./feats/favoredFoe.js";
import { slayersPreyEffect } from "./feats/slayersPrey.js";
import { flurryOfBlowsEffect } from "./feats/flurryOfBlows.js";
import { AutoEffects } from "../parser/enrichers/effects/_module.mjs";


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

  switch (name) {
    case "Favored Foe": {
      document = await favoredFoeEffect(document);
      break;
    }
    case "Flurry of Blows": {
      document = await flurryOfBlowsEffect(document);
      break;
    }
    // macro needs rewriting
    // case "Planar Warrior": {
    //   document = await planarWarriorEffect(document);
    //   break;
    // }
    case "Slayer's Prey": {
      document = await slayersPreyEffect(document);
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
