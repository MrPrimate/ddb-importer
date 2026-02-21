import { logger } from "../lib/_module";
import AutoEffects from "../parser/enrichers/effects/AutoEffects";
import {
  effectModules,
  applyDefaultMidiFlags,
} from "./effects";

// spell effects load start
import { blackTentaclesEffect } from "./spells/blackTentacles";
import { callLightningEffect } from "./spells/callLightning";
import { chillTouchEffect } from "./spells/chillTouch";
import { divineWordEffect } from "./spells/divineWord";
import { eyebiteEffect } from "./spells/eyebite";
import { moonbeamEffect } from "./spells/moonbeam";
import { phantasmalKillerEffect } from "./spells/phantasmalKiller";
import { sleepEffect } from "./spells/sleep";
import { spikeGrowthEffect } from "./spells/spikeGrowth";
import { stormSphereEffect } from "./spells/stormSphere";
// import { tolltheDeadEffect } from "./spells/tolltheDead";
import { vitriolicSphereEffect } from "./spells/vitriolicSphere";


export function baseSpellEffect(document, label,
  { transfer = false, disabled = false, description = null, durationSeconds = null,
    durationRounds = null, durationTurns = null, showIcon = null } = {},
) {
  return AutoEffects.BaseEffect(document, label, {
    transfer, disabled, description, durationSeconds, durationRounds, durationTurns, showIcon,
  });
}

 
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
