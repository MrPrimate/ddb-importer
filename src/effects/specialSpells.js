import { logger } from "../lib/_module.mjs";
import AutoEffects from "../parser/enrichers/effects/AutoEffects.mjs";
import {
  effectModules,
  applyDefaultMidiFlags,
} from "./effects.js";

// spell effects load start
import { blackTentaclesEffect } from "./spells/blackTentacles.js";
import { callLightningEffect } from "./spells/callLightning.js";
import { chillTouchEffect } from "./spells/chillTouch.js";
import { divineWordEffect } from "./spells/divineWord.js";
import { eyebiteEffect } from "./spells/eyebite.js";
import { moonbeamEffect } from "./spells/moonbeam.js";
import { phantasmalKillerEffect } from "./spells/phantasmalKiller.js";
import { sleepEffect } from "./spells/sleep.js";
import { spikeGrowthEffect } from "./spells/spikeGrowth.js";
import { stormSphereEffect } from "./spells/stormSphere.js";
// import { tolltheDeadEffect } from "./spells/tolltheDead.js";
import { vitriolicSphereEffect } from "./spells/vitriolicSphere.js";


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
    case "Evard's Black Tentacles":
    case "Black Tentacles": {
      document = await blackTentaclesEffect(document);
      break;
    }
    case "Call Lightning": {
      document = await callLightningEffect(document);
      break;
    }
    case "Chill Touch": {
      document = await chillTouchEffect(document);
      break;
    }
    case "Divine Word": {
      document = await divineWordEffect(document);
      break;
    }
    case "Eyebite": {
      document = await eyebiteEffect(document);
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
    case "Sleep": {
      document = await sleepEffect(document);
      break;
    }
    case "Spike Growth": {
      document = await spikeGrowthEffect(document);
      break;
    }
    case "Storm Sphere": {
      document = await stormSphereEffect(document);
      break;
    }
    case "Vitriolic Sphere": {
      document = await vitriolicSphereEffect(document);
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
